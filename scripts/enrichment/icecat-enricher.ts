import { and, eq, isNotNull, not, or, sql } from "drizzle-orm";
import { db, products } from "../../src/db";
import { getCategorySchema } from "../../src/lib/data-quality/schemas";
import { LocalIcecatDataSource } from "../../src/lib/data-sources/icecat-local";
import { type LeanProduct } from "../../src/lib/types";
import { calculateProductHealth } from "../../src/lib/utils/data-quality";
import {
  calculateSiblingConsensus,
  getProductIdentity,
} from "../../src/lib/utils/product-identity";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";
import { auditSourceIntegrity } from "../maintenance/source-auditor";

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
          eq(products.category, "smartphones"),
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
        // Source Integrity Firewall (SIF)
        const sourceIntegrity = await auditSourceIntegrity(product.id);
        if (!sourceIntegrity.isTrusted) {
          console.log(
            `🛡️  [SIF] Source Untrusted for ID ${product.id}: ${sourceIntegrity.violations.join(", ")}`,
          );
        }

        console.log(
          `🔍 Checking Icecat for: ${product.title} (${product.gtin || product.mpn})`,
        );

        let icecatData = null;
        if (product.gtin) {
          icecatData = await this.source.fetchProductByGtin(product.gtin, "de");
        }

        if (!icecatData && product.mpn) {
          const id = await this.source.findIdByMpn(product.mpn);
          if (id) {
            icecatData = await this.source.fetchProduct(id, "de");
          }
        }

        if (!icecatData || !icecatData.specifications) {
          console.log("❌ Not found on Icecat.");

          if (!sourceIntegrity.isTrusted) {
            console.log(
              "🛡️  [SIF] Marking as untrusted_source due to poor raw data.",
            );
            await db
              .update(products)
              .set({ enrichmentStatus: "untrusted_source" })
              .where(eq(products.id, product.id));
          }
          continue;
        }

        const identity = getProductIdentity(product as LeanProduct);

        // PEF Stage 2: Fetch Sibling Consensus
        // We look for products in the same category that share the same model name
        const siblingsDocs = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.category, product.category || ""),
              sql`${products.title} LIKE ${"%" + identity.model + "%"}`,
            ),
          )
          .limit(20);

        const consensus = calculateSiblingConsensus(
          siblingsDocs as LeanProduct[],
        );

        const specs = icecatData.specifications;
        const identityContext = {
          title: product.title || "",
          brand: product.brand || "",
          model: identity.model,
        };

        // PEF Stage 1 & 2 logic is now inside sanitizeSpecs
        const sanitized = sanitizeSpecs(specs, identityContext, consensus);

        // Security Guard: Filter out leaking variants (redundant but safe to keep loop for individual logging)
        const guardedSpecs: Record<string, unknown> = { ...sanitized };
        let rejectedCount = 0;

        // In PEF, sanitized already has the guarded fields.
        // We'll just verify for logging purposes if any fields from the original specs were dropped.
        const originalSpecCount = Object.keys(specs).length;
        const sanitizedCount = Object.keys(guardedSpecs).length;
        rejectedCount = originalSpecCount - sanitizedCount;

        if (Object.keys(guardedSpecs).length > 2) {
          if (rejectedCount > 0) {
            console.log(
              `🛡️ Guarded against ${rejectedCount} leaking attributes.`,
            );
          }

          // DQA Pillar 2: Health Scoring
          const health = calculateProductHealth(
            {
              category: product.category,
              officialSpecifications: JSON.stringify(guardedSpecs),
              title: product.title,
              brand: product.brand,
            },
            consensus,
          );

          const schema = getCategorySchema(product.category || "");
          const isHealthy =
            !schema || health.healthScore >= schema.minRequiredScore;

          if (!isHealthy) {
            console.log(
              `🛑 [DQA] Low health score (${health.healthScore}/100). Marking for manual review.`,
            );
          }

          console.log(
            `✅ Extracted ${Object.keys(guardedSpecs).length} fields from Icecat! (Health: ${health.healthScore}/100)`,
          );

          await db
            .update(products)
            .set({
              officialTitle: icecatData.title || product.officialTitle,
              officialSpecifications: JSON.stringify(guardedSpecs),
              enrichmentStatus: isHealthy ? "processed" : "manual_review",
              specificationsSource: "icecat",
              lastEnrichedAt: new Date(),
            })
            .where(eq(products.id, product.id));
        } else {
          console.log("⚠️ Found on Icecat but insufficient specs mapping.");
        }
      } catch (e: unknown) {
        console.error(
          `❌ Error enriching ID ${product.id}:`,
          (e as Error).message,
        );
      }
    }
  }
}

// GUI Execution
const limit = parseInt(process.argv[2] || "50");
const enricher = new IcecatEnricher();
enricher.run(limit).catch(console.error);
