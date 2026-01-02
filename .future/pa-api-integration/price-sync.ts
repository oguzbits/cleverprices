/**
 * Price Sync Service
 *
 * Syncs product prices from Amazon PA API to your products database.
 * Run this as a cron job every 4-6 hours once PA API is configured.
 *
 * Usage:
 *   npx ts-node scripts/sync-prices.ts
 *   # or
 *   bun run scripts/sync-prices.ts
 */

import { getItems, isPaApiConfigured, PaApiProduct } from "@/lib/amazon-paapi";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Path to products.json
const PRODUCTS_PATH = join(process.cwd(), "src/data/products.json");
const BUILD_CONFIG_PATH = join(process.cwd(), "src/lib/build-config.ts");

interface StoredProduct {
  id: number;
  slug: string;
  asin: string;
  title: string;
  category: string;
  affiliateUrl: string;
  image?: string;
  capacity: number;
  capacityUnit: string;
  warranty: string;
  formFactor: string;
  technology?: string;
  condition: string;
  brand: string;
  prices: Record<string, number | null>;
}

type Marketplace = "us" | "uk" | "de" | "fr" | "es" | "it" | "ca";

const MARKETPLACES: Marketplace[] = ["us", "uk", "de", "fr", "es", "it", "ca"];

/**
 * Chunk array into smaller arrays
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sync prices for all products across all marketplaces
 */
async function syncAllPrices(): Promise<{
  updated: number;
  failed: number;
  errors: string[];
}> {
  if (!isPaApiConfigured()) {
    throw new Error(
      "PA API not configured. Add credentials to .env.local:\n" +
        "  PAAPI_ACCESS_KEY=your_access_key\n" +
        "  PAAPI_SECRET_KEY=your_secret_key\n" +
        "  PAAPI_PARTNER_TAG=your_partner_tag\n",
    );
  }

  // Load current products
  const productsJson = readFileSync(PRODUCTS_PATH, "utf-8");
  const products: StoredProduct[] = JSON.parse(productsJson);

  console.log(`📦 Syncing prices for ${products.length} products...`);

  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  // Get all unique ASINs
  const asins = products.map((p) => p.asin);

  // Process each marketplace
  for (const marketplace of MARKETPLACES) {
    console.log(`\n🌍 Fetching prices for ${marketplace.toUpperCase()}...`);

    // Chunk ASINs into groups of 10 (PA API limit)
    const asinChunks = chunk(asins, 10);

    for (let i = 0; i < asinChunks.length; i++) {
      const asinBatch = asinChunks[i];
      console.log(
        `   Batch ${i + 1}/${asinChunks.length} (${asinBatch.length} ASINs)`,
      );

      try {
        const { products: apiProducts, errors: apiErrors } = await getItems(
          asinBatch,
          marketplace,
        );

        // Log any API errors
        for (const err of apiErrors) {
          console.warn(`   ⚠️ ${err.code}: ${err.message}`);
          errors.push(`${marketplace}/${err.code}: ${err.message}`);
        }

        // Update prices in our products array
        for (const apiProduct of apiProducts) {
          const localProduct = products.find((p) => p.asin === apiProduct.asin);
          if (localProduct && apiProduct.price) {
            localProduct.prices[marketplace] = apiProduct.price.amount;
            updated++;
          }
        }

        // Mark products not returned as unavailable (null price)
        for (const asin of asinBatch) {
          const apiProduct = apiProducts.find((p) => p.asin === asin);
          if (!apiProduct) {
            const localProduct = products.find((p) => p.asin === asin);
            if (localProduct) {
              localProduct.prices[marketplace] = null;
              failed++;
            }
          }
        }
      } catch (err) {
        console.error(
          `   ❌ Error fetching batch: ${err instanceof Error ? err.message : err}`,
        );
        errors.push(
          `${marketplace}: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        failed += asinBatch.length;
      }

      // Rate limiting: 1 request per second to be safe
      if (i < asinChunks.length - 1) {
        await sleep(1000);
      }
    }
  }

  // Save updated products
  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + "\n");
  console.log(`\n✅ Saved updated prices to ${PRODUCTS_PATH}`);

  // Update PRICES_UPDATED_AT in build-config.ts
  const now = new Date().toISOString();
  let buildConfig = readFileSync(BUILD_CONFIG_PATH, "utf-8");
  buildConfig = buildConfig.replace(
    /export const PRICES_UPDATED_AT = "[^"]+";/,
    `export const PRICES_UPDATED_AT = "${now}";`,
  );
  writeFileSync(BUILD_CONFIG_PATH, buildConfig);
  console.log(`✅ Updated PRICES_UPDATED_AT to ${now}`);

  return { updated, failed, errors };
}

/**
 * Sync prices for a single product (useful for testing)
 */
async function syncSingleProduct(
  asin: string,
  marketplace: Marketplace = "us",
): Promise<PaApiProduct | null> {
  const { products, errors } = await getItems([asin], marketplace);

  if (errors.length > 0) {
    console.error("Errors:", errors);
  }

  return products[0] || null;
}

// Run if called directly
if (require.main === module) {
  syncAllPrices()
    .then(({ updated, failed, errors }) => {
      console.log(`\n📊 Sync complete:`);
      console.log(`   Updated: ${updated}`);
      console.log(`   Failed: ${failed}`);
      if (errors.length > 0) {
        console.log(`   Errors: ${errors.length}`);
      }
    })
    .catch((err) => {
      console.error("Sync failed:", err);
      process.exit(1);
    });
}

export { syncAllPrices, syncSingleProduct };
