import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db, products } from "../../src/db";
import { EBAY_FIELD_MAP, normalizeEbayValue } from "./ebay-mapper";

/**
 * eBay Browse API Enricher
 * Uses EBAY_CLIENT_ID and EBAY_CLIENT_SECRET from environment.
 * Targets products by GTIN (EAN).
 */
class EbayEnricher {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing EBAY_CLIENT_ID or EBAY_CLIENT_SECRET in environment",
      );
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    console.log("🔑 Requesting eBay Access Token...");
    const response = await fetch(
      "https://api.ebay.com/identity/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
      },
    );

    const data: any = await response.json();
    if (data.error) {
      throw new Error(
        `eBay Auth Failed: ${data.error_description || data.error}`,
      );
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  async searchByGtin(gtin: string) {
    const token = await this.getAccessToken();
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?gtin=${gtin}&limit=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_DE",
      },
    });

    if (response.status === 429) {
      console.warn("⚠️ eBay Rate Limit Hit!");
      return null;
    }

    const data: any = await response.json();
    const item = data.itemSummaries?.[0];
    if (!item) return null;

    // To get the FULL specs (localizedAspects), we need to call getItem
    return this.getItemDetails(item.itemId);
  }

  async getItemDetails(itemId: string) {
    const token = await this.getAccessToken();
    const url = `https://api.ebay.com/buy/browse/v1/item/${itemId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_DE",
      },
    });

    return await response.json();
  }

  async run(limit = 10) {
    console.log(`🚀 Starting eBay Enrichment (Limit: ${limit})...`);

    const targets = await db
      .select()
      .from(products)
      .where(
        and(
          isNotNull(products.gtin),
          isNull(products.icecatId),
          isNull(products.officialSpecifications), // Only Fill Gaps
        ),
      )
      .limit(limit);

    console.log(`📋 Found ${targets.length} candidates with GTINs.`);

    for (const product of targets) {
      try {
        console.log(`🔍 Checking eBay for: ${product.title} (${product.gtin})`);
        const ebayData: any = await this.searchByGtin(product.gtin!);

        if (!ebayData || !ebayData.localizedAspects) {
          console.log("❌ No specs found on eBay.");
          continue;
        }

        const specs: Record<string, string> = {};
        for (const aspect of ebayData.localizedAspects) {
          const cpField = EBAY_FIELD_MAP[aspect.name];
          if (cpField) {
            specs[cpField] = normalizeEbayValue(aspect.name, aspect.value);
          }
        }

        if (Object.keys(specs).length > 2) {
          console.log(
            `✅ Extracted ${Object.keys(specs).length} fields from eBay!`,
          );

          await db
            .update(products)
            .set({
              officialSpecifications: JSON.stringify(specs),
              enrichmentStatus: "processed",
              lastEnrichedAt: new Date(),
            })
            .where(eq(products.id, product.id));
        } else {
          console.log("⚠️ Too few specs found on eBay (ignoring).");
        }
      } catch (e: any) {
        console.error(`❌ Failed ID ${product.id}:`, e.message);
      }
    }
  }
}

// CLI Execution
if (require.main === module) {
  const enricher = new EbayEnricher();
  const limit = parseInt(process.argv[2] || "5");
  enricher.run(limit).catch(console.error);
}
