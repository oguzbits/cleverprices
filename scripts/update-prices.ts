import { execSync } from "child_process";
import { and, asc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db, priceHistory, prices, products } from "../src/db";
import { withRetry } from "../src/db/utils";
import type { CountryCode } from "../src/lib/countries";
import {
  getProducts,
  getTokenStatus,
  isKeepaConfigured,
  KEEPA_DOMAINS,
} from "../src/lib/keepa/product-discovery";
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

  // Robust argument parsing for --limit
  const limitArgIndex = process.argv.findIndex((a) => a.startsWith("--limit"));
  let customLimit = 1000;
  if (limitArgIndex !== -1) {
    const arg = process.argv[limitArgIndex];
    if (arg.includes("=")) {
      customLimit = parseInt(arg.split("=")[1]);
    } else if (process.argv[limitArgIndex + 1]) {
      customLimit = parseInt(process.argv[limitArgIndex + 1]);
    }
  }
  if (isNaN(customLimit)) customLimit = 1000;

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
    .limit(customLimit);

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

  // Create batches (50 products per batch = ~150 statements. Very safe for Turso)
  const batches = [];
  for (let i = 0; i < asins.length; i += 50) {
    batches.push(asins.slice(i, i + 50));
  }

  // Check if we have enough tokens to attempt parallel execution
  // conservatively assuming 1 token per product + overhead
  const status = await getTokenStatus();

  // RESERVE tokens for Enrichment (at least 200-300)
  const MIN_RESERVE_FOR_ENRICHMENT = 250;
  const availableForUpdate = Math.max(
    0,
    status.tokensLeft - MIN_RESERVE_FOR_ENRICHMENT,
  );
  const maxProductsToFetch = Math.min(asins.length, availableForUpdate);

  if (maxProductsToFetch < asins.length) {
    console.log(
      `\n⚠️ Token management: Limiting update to ${maxProductsToFetch} products to reserve ${MIN_RESERVE_FOR_ENRICHMENT} tokens for enrichment.`,
    );
    // Truncate batches to fit within available tokens
    const truncatedAsins = asins.slice(0, maxProductsToFetch);
    const truncatedBatches = [];
    for (let i = 0; i < truncatedAsins.length; i += 100) {
      truncatedBatches.push(truncatedAsins.slice(i, i + 100));
    }
    batches.length = 0;
    batches.push(...truncatedBatches);
  }

  if (batches.length === 0) {
    console.log(
      "  No tokens available for price update. Skipping to enrichment.",
    );
    return;
  }

  console.log(`  Processing ${batches.length} batches in parallel...`);

  // Bounded Parallelism: Process batches in groups to balance speed vs stability
  const BATCH_CONCURRENCY = 3;

  console.log(
    `  Processing ${batches.length} batches with concurrency of ${BATCH_CONCURRENCY}...`,
  );

  for (let i = 0; i < batches.length; i += BATCH_CONCURRENCY) {
    const currentBatches = batches.slice(i, i + BATCH_CONCURRENCY);
    console.log(
      `  ⚡ Executing parallel group ${Math.ceil(i / BATCH_CONCURRENCY) + 1}...`,
    );

    await Promise.all(
      currentBatches.map(async (batch, idx) => {
        const batchAbsIndex = i + idx;
        console.log(
          `  🚀 Fetching batch ${batchAbsIndex + 1}/${batches.length}...`,
        );

        try {
          const keepaProducts = await getProducts(batch, country, {
            includeHistory: false,
          });

          if (keepaProducts.length === 0) return;

          // Optimization: Batch fetch today's history for all products in this batch
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);

          const batchProductIds = keepaProducts
            .map((kp) => productMap.get(kp.asin)?.id)
            .filter((id): id is number => id !== undefined);

          const existingHistoryToday = await db.query.priceHistory.findMany({
            where: and(
              inArray(priceHistory.productId, batchProductIds),
              eq(priceHistory.country, country),
              sql`${priceHistory.recordedAt} >= ${startOfDay.getTime()}`,
            ),
          });

          // PREPARE BATCH QUERIES
          const sqlQueries: any[] = [];
          const now = new Date();

          for (const kp of keepaProducts) {
            const product = productMap.get(kp.asin);
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

            // Update Product Meta (Sales Rank & Ratings)
            const salesRank =
              extractSalesRank(kp.salesRanks) ?? product.salesRank;
            const rating = normalizeRating(kp.rating) ?? product.rating;

            // 1. Product Meta Update
            sqlQueries.push(
              db
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
                .where(eq(products.id, product.id)),
            );

            // 2. Price History Logic
            if (bestPrice) {
              const todayRecord = existingHistoryToday.find(
                (h) => h.productId === product.id,
              );
              if (todayRecord) {
                if (bestPrice < todayRecord.price) {
                  sqlQueries.push(
                    db
                      .update(priceHistory)
                      .set({ price: bestPrice, recordedAt: now })
                      .where(eq(priceHistory.id, todayRecord.id)),
                  );
                }
              } else {
                sqlQueries.push(
                  db.insert(priceHistory).values({
                    productId: product.id,
                    country,
                    price: bestPrice,
                    currency,
                    priceType: amazonPrice ? "amazon" : "new",
                    recordedAt: now,
                  }),
                );
              }
            }

            // 3. Current Price Upsert
            const pricePerUnit =
              product.normalizedCapacity &&
              product.normalizedCapacity > 0 &&
              bestPrice
                ? bestPrice / product.normalizedCapacity
                : null;

            const priceAvg30 = keepaPriceToDecimal(
              kp.stats?.avg30?.[KEEPA_PRICE_TYPES.NEW],
            );
            const priceAvg90 = keepaPriceToDecimal(
              kp.stats?.avg90?.[KEEPA_PRICE_TYPES.NEW],
            );

            sqlQueries.push(
              db
                .insert(prices)
                .values({
                  productId: product.id,
                  country,
                  amazonPrice,
                  newPrice,
                  usedPrice,
                  warehousePrice,
                  pricePerUnit,
                  priceAvg30,
                  priceAvg90,
                  currency,
                  source: "keepa",
                  lastUpdated: now,
                })
                .onConflictDoUpdate({
                  target: [prices.productId, prices.country],
                  set: {
                    amazonPrice,
                    newPrice,
                    usedPrice,
                    warehousePrice,
                    pricePerUnit,
                    priceAvg30: priceAvg30 ?? sql`${prices.priceAvg30}`,
                    priceAvg90: priceAvg90 ?? sql`${prices.priceAvg90}`,
                    lastUpdated: now,
                  },
                }),
            );
          }

          // EXECUTE ALL IN ONE BATCH (One HTTP round-trip per 100 products)
          if (sqlQueries.length > 0) {
            try {
              await withRetry(async () => {
                // Cast to any to bypass strict tuple length requirements for arbitrary batches
                await (db as any).batch(sqlQueries);
              });
              updated += keepaProducts.length;
            } catch (err) {
              console.error(`  Batch failed for ${batchAbsIndex + 1}:`, err);
              failed += keepaProducts.length;
            }
          }
        } catch (error) {
          console.error(`  Error fetching batch:`, error);
          failed += batch.length;
        }
      }),
    );
  } // End of wave loop

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
