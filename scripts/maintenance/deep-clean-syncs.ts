import { eq, like } from "drizzle-orm";

import { db } from "../../src/db";
import { products } from "../../src/db/schema";
import { verifySpecModel } from "../../src/lib/utils/product-identity";

async function main() {
  console.log("🚀 Starting Deep Clean of Variant Syncs...");

  // 1. Fetch all products that were enriched via variant-sync
  const syncedProducts = await db
    .select()
    .from(products)
    .where(like(products.specificationsSource, "variant-sync:%"));

  console.log(`📋 Found ${syncedProducts.length} synced products to verify.`);

  let totalCleaned = 0;
  let totalValid = 0;

  for (const product of syncedProducts) {
    if (!product.officialSpecifications) continue;

    try {
      const specs = JSON.parse(product.officialSpecifications);
      const candidateModel = specs["Modell"] || specs["Model"];

      if (!candidateModel) {
        // If it was synced but has no model spec, we leave it for now or could reset it
        totalValid++;
        continue;
      }

      // 2. Run our IMPROVED verification logic
      const isValid = verifySpecModel(
        candidateModel,
        product.title,
        product.brand || "",
      );

      if (!isValid) {
        console.log(`❌ INVALID SYNC DETECTED (ID: ${product.id})`);
        console.log(`   Title: ${product.title}`);
        console.log(`   Model in Spec: "${candidateModel}"`);
        console.log(`   -> Resetting to pending for re-evaluation.`);

        // 3. Reset the product
        // We set specifications to null/empty to force a fresh enrichment or a correct sync
        await db
          .update(products)
          .set({
            officialSpecifications: null,
            specificationsSource: null,
            enrichmentStatus: "pending",
            officialTitle: null, // Reset since it was likely "Pixel 9" etc.
          })
          .where(eq(products.id, product.id));

        totalCleaned++;
      } else {
        totalValid++;
      }
    } catch (e) {
      console.error(`Failed to process product ${product.id}`, e);
    }
  }

  console.log("\n✅ Deep Clean Finished.");
  console.log(`🔹 Valid Syncs Kept: ${totalValid}`);
  console.log(`🔹 Invalid Syncs Reset: ${totalCleaned}`);
  process.exit(0);
}

main().catch(console.error);
