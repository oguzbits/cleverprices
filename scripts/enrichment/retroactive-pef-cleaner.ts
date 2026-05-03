import { eq } from "drizzle-orm";

import { db, products } from "../../src/db";
import {
  calculateSiblingConsensus,
  getProductIdentity,
} from "../../src/lib/utils/product-identity";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";

async function retroactiveClean() {
  console.log("🧹 Starting Retroactive PEF Cleaning for Smartphones...");

  const targets = await db
    .select()
    .from(products)
    .where(eq(products.category, "smartphones"));

  console.log(`📋 Processing ${targets.length} products...`);

  // Index for consensus
  const siblingsDocs = targets;
  const families = new Map<string, any[]>();
  for (const p of targets) {
    const identity = getProductIdentity(p as any);
    const key = `${p.brand}-${identity.model}`.toLowerCase();
    if (!families.has(key)) families.set(key, []);
    families.get(key)!.push(p);
  }

  for (const product of targets) {
    if (!product.officialSpecifications) continue;

    try {
      const specs = JSON.parse(product.officialSpecifications);
      const identity = getProductIdentity(product as any);

      // Get consensus for this specific family
      const key = `${product.brand}-${identity.model}`.toLowerCase();
      const consensus = calculateSiblingConsensus(families.get(key) || []);

      const identityContext = {
        title: product.title || "",
        brand: product.brand || "",
        model: identity.model,
      };

      const cleaned = sanitizeSpecs(specs, identityContext, consensus);

      const originalCount = Object.keys(specs).length;
      const cleanedCount = Object.keys(cleaned).length;

      if (
        originalCount !== cleanedCount ||
        JSON.stringify(specs) !== JSON.stringify(cleaned)
      ) {
        console.log(`✨ Cleaned ID ${product.id}: ${product.title}`);
        console.log(
          `   - Dropped ${originalCount - cleanedCount} leaky fields.`,
        );

        await db
          .update(products)
          .set({
            officialSpecifications: JSON.stringify(cleaned),
            enrichmentStatus: "processed", // Explicitly mark as processed now it's clean
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      } else {
        // Even if no change, mark as processed if it was pending
        if (product.enrichmentStatus === "pending") {
          await db
            .update(products)
            .set({ enrichmentStatus: "processed" })
            .where(eq(products.id, product.id));
        }
      }
    } catch (e) {
      // console.error(`Error cleaning ${product.id}:`, e);
    }
  }

  console.log("✅ Retroactive cleaning complete.");
}

retroactiveClean().catch(console.error);
