import { eq } from "drizzle-orm";
import { db, products } from "../../src/db";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";
import { EBAY_FIELD_MAP, normalizeEbayValue } from "./ebay-mapper";

/**
 * eBay Browse API Enricher
 * Uses EBAY_CLIENT_ID and EBAY_CLIENT_SECRET from environment.
 * Targets products by GTIN (EAN).
 */
export class EbayEnricher {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl = "https://api.ebay.com/buy/browse/v1";

  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = process.env.EBAY_APP_ID; // App ID is Client ID
    const clientSecret = process.env.EBAY_CERT_ID; // Cert ID is Client Secret

    if (!clientId || !clientSecret) {
      throw new Error("Missing EBAY_APP_ID or EBAY_CERT_ID in environment");
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    console.log("🔑 Requesting eBay Access Token (PRODUCTION)...");
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

  async searchByGtin(
    gtin: string,
    title: string,
    mpn?: string | null,
  ): Promise<any> {
    const market = "EBAY_DE"; // Primary market for ID lookup
    const token = await this.getAccessToken();

    // 1. Try EXACT GTIN
    let url = `${this.baseUrl}/item_summary/search?q=${gtin}&limit=5&fieldgroups=ASPECTS,EXTENDED,MATCHING_ITEMS`;
    let response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": market,
      },
    });

    let data = await response.json();
    let best = await this.getBestItemFromSummaries(data.itemSummaries, market);
    if (best) return { ...best, matchType: "gtin" };

    // 2. Try MPN (Manufacturer Part Number) - Critical for PC Parts
    if (mpn && mpn.length > 3) {
      console.log(`   🔄 No GTIN match, trying MPN: ${mpn}`);
      const url = `${this.baseUrl}/item_summary/search?q=${encodeURIComponent(mpn)}&limit=3&fieldgroups=ASPECTS,EXTENDED`;
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-EBAY-C-MARKETPLACE-ID": market,
          },
        });
        const data = await response.json();
        // MPN searches can be noisy, so we MUST double-check the title similarity
        const best = await this.getBestItemFromSummaries(
          data.itemSummaries,
          market,
        );
        if (best) {
          // Validation: Does the found item title contain the MPN?
          if (best.title.toLowerCase().includes(mpn.toLowerCase())) {
            return { ...best, matchType: "mpn" };
          }
        }
      } catch (err) {
        // Ignore MPN errors
      }
    }

    // 3. Try GTIN Variations (EAN-13 <-> UPC-12)
    let altGtin = "";
    if (gtin.length === 13 && gtin.startsWith("0")) {
      altGtin = gtin.substring(1); // Try UPC (12 digits)
    } else if (gtin.length === 12) {
      altGtin = "0" + gtin; // Try EAN (13 digits)
    }

    if (altGtin) {
      console.log(`   🔄 Trying alternate GTIN: ${altGtin}`);
      const url = `${this.baseUrl}/item_summary/search?q=${altGtin}&limit=3&fieldgroups=ASPECTS,EXTENDED`;
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-EBAY-C-MARKETPLACE-ID": market,
          },
        });
        const data = await response.json();
        const best = await this.getBestItemFromSummaries(
          data.itemSummaries,
          market,
        );
        if (best) return { ...best, matchType: "gtin-alt" };
      } catch (err) {
        // Ignore Alt GTIN errors
      }
    }

    return null;
  }

  async getBestItemFromSummaries(summaries: any[], mkt: string) {
    if (!summaries || !Array.isArray(summaries)) return null;

    let bestItem: any = null;
    let maxAspects = -1;

    // Pick top 5 to find a catalog entry
    const candidates = summaries.slice(0, 5);

    for (const summary of candidates) {
      // Catalog entries are the gold standard (epid exists)
      if (summary.epid) {
        const details = await this.getItemDetails(summary.itemId, mkt);
        if (details && details.localizedAspects) return details;
      }

      const details = await this.getItemDetails(summary.itemId, mkt);
      const aspectCount = details.localizedAspects?.length || 0;

      if (aspectCount > maxAspects) {
        maxAspects = aspectCount;
        bestItem = details;
      }

      // If we found a very good entry (> 12 aspects), take it
      if (aspectCount > 12) break;
    }

    return bestItem;
  }

  async getItemDetails(itemId: string, mkt = "EBAY_DE") {
    const token = await this.getAccessToken();
    const url = `https://api.ebay.com/buy/browse/v1/item/${itemId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": mkt,
      },
    });

    return await response.json();
  }

  async run(limit = 10) {
    console.log(`🚀 Starting eBay Enrichment (Limit: ${limit})...`);

    const targets = await db
      .select()
      .from(products)
      .where(eq(products.id, 289))
      .limit(limit);

    console.log(`📋 Found ${targets.length} candidates with GTINs.`);

    for (const product of targets) {
      try {
        console.log(
          `🔍 Checking eBay for: ${product.title} (${[product.gtin, product.asin, product.mpn].filter(Boolean).join(", ")})`,
        );

        // 1. Try GTIN/MPN Lookup (Waterfall within the function)
        let ebayData: any = null;
        if (product.gtin) {
          // The searchByGtin function already handles GTIN variations and MPN internally.
          // We pass the primary GTIN, title, and MPN to it.
          ebayData = await this.searchByGtin(
            product.gtin,
            product.title,
            product.mpn,
          );
        }

        // 2. Fallback: Keyword Search (Waterfall Strategy)
        if (!ebayData) {
          console.log("   🔄 No GTIN match, trying keyword search...");

          const cleanTitle = (t: string) =>
            t
              .replace(/[®™©*]/g, "")
              .replace(/[()|,"+]/g, " ") // Strip punctuation early
              .replace(/\d+(\.\d+)?\s*(MB\/s|GB\/s|MBps|GBps)/gi, "") // SSD speeds
              .replace(/\b\d+(GB|TB|MB|MHz|GHz|Hz|W|Wh|mAh)\b/gi, "")
              .replace(
                /\b(Grafikkarte|Grafik|Smartphone|Handy|Drucker|Kühler|Motherboard|Mainboard|Notebook|Laptop|Tablet|SSD|HDD|Prozessor|CPU|Retail|OC|V2|LHR|Rev\.|Gen\.|Generation|Edition|Gaming|DDR6|GDDR6|DDR5|GDDR5|GB|TB|MB|Generalüberholt|Renewed|Refurbished|Zustand|Gut|Sehr|Wie|Neu|OVP|Ohne|Simlock|Netlock|Vertrag|Brandneu|WIE NEU|TOP ZUSTAND)\b/gi,
                "",
              )
              .replace(/\s+/g, " ")
              .trim();

          const attempts = [
            product.title
              .replace(/[()|,"+]|(\d+,\d+")/g, " ") // Handle "6,9"" and generic punctuation
              .replace(/\s+/g, " ")
              .split(" ")
              .slice(0, 6)
              .join(" ")
              .trim(),
            cleanTitle(product.title).split(/\s+/).slice(0, 6).join(" "),
            cleanTitle(product.title).split(/\s+/).slice(0, 4).join(" "),
            cleanTitle(product.title).split(/\s+/).slice(0, 3).join(" "),
            // Brand + Model fallback if available
            product.brand && product.title.split(" ").length > 2
              ? `${product.brand} ${product.title.split(" ").slice(1, 3).join(" ")}`.replace(
                  /[()|,"+]/g,
                  "",
                )
              : "",
          ];

          for (const q of [...new Set(attempts)]) {
            if (!q || q.length < 5) continue;
            console.log(`      🧪 Trying query: "${q}"`);
            ebayData = await this.searchByKeywords(q);
            if (ebayData && ebayData.localizedAspects) {
              ebayData.isSearchMatch = true;
              break;
            }
          }
        }

        if (!ebayData || !ebayData.localizedAspects) {
          console.log("❌ No specs found on eBay.");
          continue;
        }

        const rawSpecs: Record<string, string> = {};
        for (const aspect of ebayData.localizedAspects) {
          const cpField = EBAY_FIELD_MAP[aspect.name];
          if (cpField) {
            rawSpecs[cpField] = normalizeEbayValue(aspect.name, aspect.value);
          }
        }

        const sanitized = sanitizeSpecs(rawSpecs, product.brand || undefined);

        if (Object.keys(sanitized).length >= 1) {
          const source = ebayData.isSearchMatch ? "ebay-search" : "ebay";
          console.log(
            `✅ Extracted ${Object.keys(sanitized).length} clean fields from eBay! (${source}): ${Object.keys(sanitized).join(", ")}`,
          );

          await db
            .update(products)
            .set({
              officialSpecifications: JSON.stringify(sanitized),
              enrichmentStatus: "processed",
              specificationsSource: source,
              lastEnrichedAt: new Date(),
            })
            .where(eq(products.id, product.id));
        } else {
          console.log(
            `⚠️ No mapped specs found. Raw eBay labels: ${ebayData.localizedAspects.map((a: any) => a.name).join(", ")}`,
          );
        }
      } catch (e: any) {
        console.error(`❌ Failed ID ${product.id}:`, e.message);
      }
    }
  }

  async searchByKeywords(q: string) {
    const token = await this.getAccessToken();
    const marketplaces = ["EBAY_DE", "EBAY_GB", "EBAY_US"];
    const forbiddenTerms = [
      "case",
      "hülle",
      "tasche",
      "folie",
      "kabel",
      "cable",
      "box only",
      "nur karton",
      "reparatur",
      "defekt",
      "for parts",
    ];

    for (const mkt of marketplaces) {
      const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&limit=5`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": mkt,
        },
      });

      const data: any = await response.json();
      if (data.itemSummaries && data.itemSummaries.length > 0) {
        // Filter out items that contain forbidden terms in title
        const validSummaries = data.itemSummaries.filter((item: any) => {
          const title = item.title.toLowerCase();
          return !forbiddenTerms.some((term) => title.includes(term));
        });

        if (validSummaries.length > 0) {
          const best = await this.getBestItemFromSummaries(
            validSummaries.slice(0, 3), // Scan top 3 valid pieces
            mkt,
          );
          if (
            best &&
            best.localizedAspects &&
            best.localizedAspects.length > 2
          ) {
            return { ...best, isSearchMatch: true };
          }
        }
      }
    }
    return null;
  }
}

// CLI Execution
if (require.main === module) {
  const enricher = new EbayEnricher();
  const limit = parseInt(process.argv[2] || "5");
  enricher.run(limit).catch(console.error);
}
