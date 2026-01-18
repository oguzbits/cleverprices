import { and, asc, eq, isNull, lt, or } from "drizzle-orm";
import {
  db,
  NewPriceHistoryRecord,
  priceHistory,
  prices,
  products,
} from "../src/db";
import { withRetry } from "../src/db/utils";
import type { CountryCode } from "../src/lib/countries";
import {
  getProducts,
  getTokenStatus,
  isKeepaConfigured,
  KEEPA_DOMAINS,
} from "../src/lib/keepa/product-discovery";
import { execSync } from "child_process";
import {
  extractSalesRank,
  keepaPriceToDecimal,
  normalizeRating,
} from "../src/lib/keepa/utils";
import { updateLastRun } from "../src/lib/worker-state";

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

/**
 * Update prices for all products
 */
async function updatePrices(country: CountryCode): Promise<void> {
  console.log(`\n💰 Updating prices for ${country.toUpperCase()}...`);

  const isStaleOnly = process.argv.includes("--stale");
  const elevenHoursAgo = new Date(Date.now() - 11 * 60 * 60 * 1000);

  // Strict Rotation Logic
  const targetProducts = await db
    .select({
      id: products.id,
      asin: products.asin,
      normalizedCapacity: products.normalizedCapacity,
      salesRank: products.salesRank,
      rating: products.rating,
      reviewCount: products.reviewCount,
      lastUpdated: prices.lastUpdated,
    })
    .from(products)
    .leftJoin(
      prices,
      and(eq(prices.productId, products.id), eq(prices.country, country)),
    )
    .where(
      isStaleOnly
        ? or(isNull(prices.lastUpdated), lt(prices.lastUpdated, elevenHoursAgo))
        : undefined,
    )
    .orderBy(asc(prices.lastUpdated))
    .limit(500);

  if (targetProducts.length === 0) {
    console.log("  No products in database or all products are fresh.");
    return;
  }

  console.log(`  Queue size: ${targetProducts.length} products.`);

  const productMap = new Map(targetProducts.map((p) => [p.asin, p]));
  const asins = targetProducts.map((p) => p.asin);
  const domain = KEEPA_DOMAINS[country];
  const currency = DOMAIN_CURRENCIES[domain] || "USD";

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < asins.length; i += 100) {
    const batch = asins.slice(i, i + 100);
    const status = await getTokenStatus();
    if (status.tokensLeft < 20) {
      console.log(
        `\n🛑 Low tokens detected (${status.tokensLeft}). Aborting remaining batches.`,
      );
      break;
    }

    console.log(
      `  Fetching batch ${Math.floor(i / 100) + 1}/${Math.ceil(asins.length / 100)}...`,
    );

    try {
      const keepaProducts = await getProducts(batch, country, {
        includeHistory: false,
      });

      // Process in parallel chunks to speed up DB writes
      const CONCURRENCY = 10;
      for (let j = 0; j < keepaProducts.length; j += CONCURRENCY) {
        const chunk = keepaProducts.slice(j, j + CONCURRENCY);

        await Promise.all(
          chunk.map(async (kp) => {
            const product = productMap.get(kp.asin);
            if (!product) return;

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

            // Update Product Meta (Sales Rank & Ratings)
            const salesRank =
              extractSalesRank(kp.salesRanks) ?? product.salesRank;
            const rating = normalizeRating(kp.rating) ?? product.rating;
            const now = new Date(); // Consistent timestamp for all updates

            try {
              await withRetry(async () => {
                // Update product meta
                await db
                  .update(products)
                  .set({
                    salesRank,
                    rating,
                    reviewCount:
                      kp.reviewsLastSeenStatus !== undefined
                        ? kp.reviewsLastSeenStatus
                        : product.reviewCount,
                    updatedAt: now,
                  })
                  .where(eq(products.id, product.id));

                // Get existing price record
                const existingPrice = await db.query.prices.findFirst({
                  where: (p, { and, eq }) =>
                    and(eq(p.productId, product.id), eq(p.country, country)),
                });

                if (bestPrice) {
                  // Calculate price per unit
                  let pricePerUnit: number | null = null;
                  if (
                    product.normalizedCapacity &&
                    product.normalizedCapacity > 0
                  ) {
                    pricePerUnit = bestPrice / product.normalizedCapacity;
                  }

                  // Save to history if best price changed
                  const oldBestPrice =
                    existingPrice?.amazonPrice ?? existingPrice?.newPrice;
                  if (existingPrice && oldBestPrice !== bestPrice) {
                    const historyRecord: NewPriceHistoryRecord = {
                      productId: product.id,
                      country,
                      price: bestPrice,
                      currency,
                      priceType: amazonPrice ? "amazon" : "new",
                      recordedAt: now,
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
                        lastUpdated: now,
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
                      lastUpdated: now,
                    });
                  }
                } else if (existingPrice) {
                  // EVEN if no price found today, update lastUpdated so it's no longer "stale"
                  await db
                    .update(prices)
                    .set({
                      lastUpdated: now,
                    })
                    .where(eq(prices.id, existingPrice.id));
                } else {
                  // No existing price record and no price found today
                  // Create a skeleton record to mark as checked
                  await db.insert(prices).values({
                    productId: product.id,
                    country,
                    currency,
                    source: "keepa",
                    lastUpdated: now,
                  });
                }
              });

              updated++;
            } catch (productError) {
              console.error(
                `  Failed to update product ${product.asin}:`,
                productError,
              );
              failed++;
            }
          }),
        );
      } // End of chunk loop
    } catch (error) {
      console.error(`  Error fetching batch:`, error);
      failed += batch.length;
    }

    if (i + 100 < asins.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`  ✓ Updated: ${updated}, Failed: ${failed}`);

  // Auto-warm cache after updating prices (Explicit trigger only)
  if (process.env.WARM_CACHE === "true") {
    try {
      console.log("\n🔥 Triggering Cache Warmer...");
      execSync(`bun run scripts/warm-cache.ts`, { stdio: "inherit" });
    } catch (e) {
      console.warn("⚠️ Cache warming failed, but prices were updated.");
    }
  }
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

  const country = (process.argv[2] || "de") as CountryCode;
  await updatePrices(country);

  const finalTokens = await getTokenStatus();
  console.log(
    `\n✅ Update complete! Tokens remaining: ${finalTokens.tokensLeft}`,
  );

  updateLastRun();
}

main().catch(console.error);
