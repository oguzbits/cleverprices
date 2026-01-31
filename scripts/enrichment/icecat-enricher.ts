import { and, eq, isNotNull, not, or } from "drizzle-orm";
import { db, products } from "../../src/db";
import { LocalIcecatDataSource } from "../../src/lib/data-sources/icecat-local";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";

/**
 * Icecat CLI Enricher
 * Uses the local 570MB index for high-speed matching.
 */
class IcecatEnricher {
  private source = new LocalIcecatDataSource();

  async run(limit = 50) {
    console.log(`💎 Starting Icecat Enrichment (Limit: ${limit})...`);

    const targets = await db
      .select()
      .from(products)
      .where(
        and(
          not(eq(products.enrichmentStatus, "processed")),
          not(eq(products.enrichmentStatus, "not_found")),
          or(isNotNull(products.gtin), isNotNull(products.mpn)),
        ),
      )
      // Prioritize Smartphones and Laptops
      .orderBy(products.category)
      .limit(limit);

    console.log(`📋 Found ${targets.length} candidates for Icecat.`);

    for (const product of targets) {
      try {
        console.log(
          `🔍 Checking Icecat for: ${product.title} (${product.gtin || product.mpn})`,
        );

        let icecatData = null;
        if (product.gtin) {
          icecatData = await this.source.fetchProductByGtin(product.gtin, "DE");
        }

        if (!icecatData && product.mpn) {
          const id = await this.source.findIdByMpn(product.mpn);
          if (id) {
            icecatData = await this.source.fetchProduct(id, "DE");
          }
        }

        if (!icecatData || !icecatData.specifications) {
          console.log("❌ Not found on Icecat.");
          continue;
        }

        const specs = icecatData.specifications;
        const sanitized = sanitizeSpecs(specs, product.brand || undefined);

        if (Object.keys(sanitized).length > 2) {
          console.log(
            `✅ Extracted ${Object.keys(sanitized).length} fields from Icecat!`,
          );

          await db
            .update(products)
            .set({
              officialTitle: icecatData.title || product.officialTitle,
              officialSpecifications: JSON.stringify(sanitized),
              enrichmentStatus: "processed",
              specificationsSource: "icecat",
              lastEnrichedAt: new Date(),
            })
            .where(eq(products.id, product.id));
        } else {
          console.log("⚠️ Found on Icecat but insufficient specs mapping.");
        }
      } catch (e: any) {
        console.error(`❌ Error enriching ID ${product.id}:`, e.message);
      }
    }
  }
}

// GUI Execution
const limit = parseInt(process.argv[2] || "50");
const enricher = new IcecatEnricher();
enricher.run(limit).catch(console.error);
