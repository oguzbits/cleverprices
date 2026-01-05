#!/usr/bin/env bun
/**
 * Price Update Script
 *
 * Updates prices for existing products in the database.
 * Run this daily to keep prices fresh.
 *
 * Usage:
 *   bun run scripts/update-prices.ts [country]
 *
 * Examples:
 *   bun run scripts/update-prices.ts us
 *   bun run scripts/update-prices.ts de
 */

import { eq, and } from "drizzle-orm";
import {
  db,
  products,
  prices,
  priceHistory,
  NewPriceHistoryRecord,
} from "../src/db";
import {
  getProducts,
  getTokenStatus,
  isKeepaConfigured,
  KEEPA_DOMAINS,
} from "../src/lib/keepa/product-discovery";
import type { CountryCode } from "../src/lib/countries";

// Constants
const KEEPA_PRICE_TYPES = {
  AMAZON: 0,
  NEW: 1,
  USED: 2,
  WAREHOUSE: 9,
};

const DOMAIN_CURRENCIES: Record<number, string> = {
  1: "USD",
  2: "GBP",
  3: "EUR",
  4: "EUR",
  6: "CAD",
  8: "EUR",
  9: "EUR",
};

function keepaPriceToDecimal(price: number | null | undefined): number | null {
  if (price === null || price === undefined || price < 0) return null;
  return price / 100;
}

/**
 * Update prices for all products
 */
async function updatePrices(country: CountryCode): Promise<void> {
  console.log(`\n💰 Updating prices for ${country.toUpperCase()}...`);

  // Get all products
  const allProducts = await db.query.products.findMany();
  console.log(`  Found ${allProducts.length} products in database`);

  if (allProducts.length === 0) {
    console.log("  No products to update. Run import-products.ts first.");
    return;
  }

  // Batch ASINs (100 at a time for Keepa)
  const asins = allProducts.map((p) => p.asin);
  const domain = KEEPA_DOMAINS[country];
  const currency = DOMAIN_CURRENCIES[domain] || "USD";

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < asins.length; i += 100) {
    const batch = asins.slice(i, i + 100);
    console.log(
      `  Fetching batch ${Math.floor(i / 100) + 1}/${Math.ceil(asins.length / 100)}...`,
    );

    try {
      const keepaProducts = await getProducts(batch, country, {
        includeHistory: false,
      });

      for (const kp of keepaProducts) {
        const product = allProducts.find((p) => p.asin === kp.asin);
        if (!product) continue;

        const currentPrices = kp.stats?.current || [];
        const amazonPrice = keepaPriceToDecimal(
          currentPrices[KEEPA_PRICE_TYPES.AMAZON],
        );
        const newPrice = keepaPriceToDecimal(
          currentPrices[KEEPA_PRICE_TYPES.NEW],
        );
        const usedPrice = keepaPriceToDecimal(
          currentPrices[KEEPA_PRICE_TYPES.USED],
        );
        const warehousePrice = keepaPriceToDecimal(
          currentPrices[KEEPA_PRICE_TYPES.WAREHOUSE],
        );

        const bestPrice = amazonPrice ?? newPrice;
        if (!bestPrice) continue;

        // Calculate price per unit
        let pricePerUnit: number | null = null;
        if (product.normalizedCapacity && product.normalizedCapacity > 0) {
          pricePerUnit = bestPrice / product.normalizedCapacity;
        }

        // Get existing price record
        const existingPrice = await db.query.prices.findFirst({
          where: (p, { and, eq }) =>
            and(eq(p.productId, product.id), eq(p.country, country)),
        });

        // Save to history if price changed
        if (existingPrice && existingPrice.amazonPrice !== amazonPrice) {
          const historyRecord: NewPriceHistoryRecord = {
            productId: product.id,
            country,
            price: bestPrice,
            currency,
            priceType: "amazon",
            recordedAt: new Date(),
          };
          await db.insert(priceHistory).values(historyRecord);
        }

        // Update or insert current price
        if (existingPrice) {
          await db
            .update(prices)
            .set({
              amazonPrice,
              newPrice,
              usedPrice,
              warehousePrice,
              pricePerUnit,
              lastUpdated: new Date(),
            })
            .where(eq(prices.id, existingPrice.id));
        } else {
          await db.insert(prices).values({
            productId: product.id,
            country,
            amazonPrice,
            newPrice,
            usedPrice,
            warehousePrice,
            pricePerUnit,
            currency,
            source: "keepa",
            lastUpdated: new Date(),
          });
        }

        updated++;
      }
    } catch (error) {
      console.error(`  Error fetching batch:`, error);
      failed += batch.length;
    }

    // Small delay between batches
    if (i + 100 < asins.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`  ✓ Updated: ${updated}, Failed: ${failed}`);
}

/**
 * Main entry point
 */
async function main() {
  console.log("🔄 CleverPrices Price Update\n");

  if (!isKeepaConfigured()) {
    console.error("❌ KEEPA_API_KEY not configured");
    process.exit(1);
  }

  const tokens = await getTokenStatus();
  console.log(`💰 Keepa tokens: ${tokens.tokensLeft} available`);

  const country = (process.argv[2] || "us") as CountryCode;
  await updatePrices(country);

  const finalTokens = await getTokenStatus();
  console.log(
    `\n✅ Update complete! Tokens remaining: ${finalTokens.tokensLeft}`,
  );
}

main().catch(console.error);
