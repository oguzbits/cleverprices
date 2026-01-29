import { eq, isNull } from "drizzle-orm";
import { db, products } from "../../src/db";
import { keepaDataSource } from "../../src/lib/data-sources/keepa";

/**
 * Bulk Fetcher for Keepa Product Details
 *
 * Goal: Populate the `keepa_features` column for all products.
 * This allows us to run AI enrichment offline without Bing Search.
 */
async function runBulkFetch() {
  console.log("🚀 Starting Keepa Bulk Fetcher...");

  // 1. Find candidates: Products without keepaFeatures
  // We prioritize recent products first
  const allCandidates = await db
    .select({
      id: products.id,
      asin: products.asin,
      parentAsin: products.parentAsin,
      // country: products.originCountry, // Removed to fix Drizzle error if field is missing types
    })
    .from(products)
    .where(isNull(products.keepaFeatures));

  console.log(
    `📋 Found ${allCandidates.length} products missing Keepa Metadata.`,
  );

  if (allCandidates.length === 0) {
    console.log("✅ All products have metadata. Exiting.");
    return;
  }

  // 2. Batch Process in groups of 100 (Keepa Limit)
  const BATCH_SIZE = 100;
  let totalUpdated = 0;

  for (let i = 0; i < allCandidates.length; i += BATCH_SIZE) {
    const batch = allCandidates.slice(i, i + BATCH_SIZE);
    const asins = batch.map((p) => p.asin);

    console.log(
      `\n🔄 Processing Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allCandidates.length / BATCH_SIZE)} (${batch.length} items)...`,
    );

    try {
      // Fetch from Keepa (Domain 3 = .de)
      // We use 'de' as default since that's the primary market
      const keepaProducts = await keepaDataSource.fetchProductsByAsins(
        asins,
        "de",
        { includeHistory: false },
      );

      console.log(`   ✅ Received ${keepaProducts.length} items from Keepa.`);

      // Update DB
      let batchUpdated = 0;
      for (const kProduct of keepaProducts) {
        if (
          !kProduct.description &&
          (!kProduct.features || kProduct.features.length === 0)
        ) {
          continue; // Skip empties
        }

        // Prepare JSON blob
        const metaBlob = {
          description: kProduct.description,
          features: kProduct.features,
          // We can add more raw fields here if needed later
        };

        await db
          .update(products)
          .set({
            keepaFeatures: JSON.stringify(metaBlob),
            updatedAt: new Date(),
          })
          .where(eq(products.asin, kProduct.id));

        batchUpdated++;
      }

      totalUpdated += batchUpdated;
      console.log(`   💾 Updated ${batchUpdated} records in DB.`);

      // Respect Rate Limits: Keepa creates tokens at ~1/sec.
      // A batch costs ~100 tokens (1 per item).
      // We should wait a bit if we are running long.
      // 100 items / 100 tokens.
      // Wait 5 seconds to be safe if heavily looping.
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e: any) {
      console.error("❌ Batch failed:", e.message);
    }
  }

  console.log(`\n🎉 Bulk Fetch Complete. Total updated: ${totalUpdated}`);
}

// Run if called directly
import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBulkFetch().catch(console.error);
}
