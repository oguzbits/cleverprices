import { db } from "../src/db";
import { products } from "../src/db/schema";
import { type CategorySlug } from "../src/lib/categories";
import { getProducts } from "../src/lib/keepa/product-discovery";
import { upsertProductFromKeepa } from "../src/lib/keepa/sync-service";

async function refreshPrices() {
  console.log("Fetching all products from DB...");
  const allProducts = await db
    .select({ asin: products.asin, category: products.category })
    .from(products);

  if (allProducts.length === 0) {
    console.log("No products in DB.");
    return;
  }

  const asins = allProducts.map((p) => p.asin);
  console.log(`Found ${asins.length} products. Refreshing prices...`);

  // Batch in 20s to be safe
  const batchSize = 20;
  for (let i = 0; i < asins.length; i += batchSize) {
    const batch = asins.slice(i, i + batchSize);
    console.log(
      `Processing batch ${i / batchSize + 1}... (${batch.length} items)`,
    );

    try {
      const keepaProducts = await getProducts(batch, "de", {
        includeHistory: false,
        days: 90,
      });

      console.log(`Keepa returned ${keepaProducts.length} products.`);

      for (const kp of keepaProducts) {
        const p = allProducts.find((x) => x.asin === kp.asin);
        if (p) {
          await upsertProductFromKeepa(kp, p.category as CategorySlug);
        }
      }
    } catch (e) {
      console.error("Batch failed:", e);
    }
  }
  console.log("Done.");
}

refreshPrices().catch(console.error);
