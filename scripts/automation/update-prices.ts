import { execSync } from "child_process";
import { and, asc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { db, prices, products } from "../../src/db";
import { withRetry } from "../../src/db/utils";
import type { CountryCode } from "../../src/lib/countries";
import {
  compressHistory,
  parseHistoryBlob,
  pruneHistory,
} from "../../src/lib/history-compression";
import {
  getProducts,
  getTokenStatus,
  isKeepaConfigured,
  KEEPA_DOMAINS,
} from "../../src/lib/keepa/product-discovery";
import {
  extractSalesRank,
  keepaPriceToDecimal,
  normalizeRating,
} from "../../src/lib/keepa/utils";
import { updateLastRun } from "../../src/lib/worker-state";

// Constants
const KEEPA_PRICE_TYPES = {
  AMAZON: 0,
  NEW: 1,
  USED: 2,
  LIST: 8,
  WAREHOUSE: 9,
  BUY_BOX: 18,
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
  const isDryRun = process.argv.includes("--dry-run");
  console.log(`\n💰 Updating prices for ${country.toUpperCase()}...`);
  if (isDryRun)
    console.log("🧪 DRY RUN MODE: Database commits will be skipped.");

  const isStaleOnly = process.argv.includes("--stale");
  const staleThresholdHours = 4; // Tightened from 11h for faster turnover
  const staleThreshold = new Date(
    Date.now() - staleThresholdHours * 60 * 60 * 1000,
  );

  // Robust argument parsing for --limit
  const limitArgIndex = process.argv.findIndex((a) => a.startsWith("--limit"));
  let customLimit = 2000; // Increased from 1000 to allow larger batches for small catalogs
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
  const queryStart = performance.now();
  const targetProducts = await db
    .select({
      id: products.id,
      asin: products.asin,
      gtin: products.gtin,
      normalizedCapacity: products.normalizedCapacity,
      salesRank: products.salesRank,
      rating: products.rating,
      reviewCount: products.reviewCount,
      // Current price state for diffing (lean schema)
      currentPrice: prices.price,
      currentUsedPrice: prices.usedPrice,
      currentHistoryJson: prices.historyJson,
      currentLastUpdated: prices.lastUpdated,
    })
    .from(products)
    .leftJoin(
      prices,
      and(eq(prices.productId, products.id), eq(prices.country, country)),
    )
    .where(
      isStaleOnly
        ? or(isNull(prices.lastUpdated), lt(prices.lastUpdated, staleThreshold))
        : undefined,
    )
    .orderBy(asc(prices.lastUpdated))
    .limit(customLimit);

  if (targetProducts.length === 0) {
    console.log("  No products in database or all products are fresh.");
    return;
  }

  const queryTime = ((performance.now() - queryStart) / 1000).toFixed(2);
  console.log(
    `  Queue size: ${targetProducts.length} products (fetched in ${queryTime}s).`,
  );

  const productMap = new Map(targetProducts.map((p) => [p.asin, p]));
  const asins = targetProducts.map((p) => p.asin);
  const domain = KEEPA_DOMAINS[country];
  const currency = DOMAIN_CURRENCIES[domain] || "USD";

  let updated = 0;
  let failed = 0;

  // Create batches
  const batches = [];
  for (let i = 0; i < asins.length; i += 50) {
    batches.push(asins.slice(i, i + 50));
  }

  // Check tokens
  const status = await getTokenStatus();
  // We respect the limit passed from the caller (keepa-worker),
  // but we no longer sub-reserve tokens here as it causes double-throttling.
  const maxProductsToFetch = Math.min(asins.length, status.tokensLeft - 50); // Keep small safety buffer

  if (maxProductsToFetch < asins.length) {
    console.log(
      `  ⚠️ Limiting update to ${maxProductsToFetch} to reserve enrichment tokens.`,
    );
    const truncatedAsins = asins.slice(0, maxProductsToFetch);
    batches.length = 0;
    for (let i = 0; i < truncatedAsins.length; i += 100) {
      batches.push(truncatedAsins.slice(i, i + 100));
    }
  }

  if (batches.length === 0) {
    console.log("  No tokens available for price update.");
    return;
  }

  const fetchStart = performance.now();
  const BATCH_CONCURRENCY = 3;

  for (let i = 0; i < batches.length; i += BATCH_CONCURRENCY) {
    const currentBatches = batches.slice(i, i + BATCH_CONCURRENCY);
    await Promise.all(
      currentBatches.map(async (batch, idx) => {
        const batchAbsIndex = i + idx;
        try {
          const keepaProducts = await getProducts(batch, country, {
            includeHistory: false,
          });

          if (keepaProducts.length === 0) return;

          const sqlQueries: any[] = [];
          const now = new Date();
          const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

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
            const buyBoxPrice = keepaPriceToDecimal(
              currentPrices[KEEPA_PRICE_TYPES.BUY_BOX],
            );

            // Standardized price logic: Use Buy Box if available, otherwise MIN of Amazon/New
            // CRITICAL: Ignore prices <= 0 to avoid recording broken data.
            const bBox = buyBoxPrice && buyBoxPrice > 0 ? buyBoxPrice : null;
            const amz = amazonPrice && amazonPrice > 0 ? amazonPrice : null;
            const mkt = newPrice && newPrice > 0 ? newPrice : null;

            const bestPrice =
              bBox ?? (amz && mkt ? Math.min(amz, mkt) : (amz ?? mkt));

            const salesRank =
              extractSalesRank(kp.salesRanks) ?? product.salesRank;
            const rating = normalizeRating(kp.rating) ?? product.rating;
            const reviewCount = kp.reviewsLastSeenStatus ?? product.reviewCount;

            // 1. Meta Update - Only if changed (SQLite write optimization)
            const metaChanged =
              salesRank !== product.salesRank ||
              rating !== product.rating ||
              reviewCount !== product.reviewCount;

            if (metaChanged) {
              sqlQueries.push(
                db
                  .update(products)
                  .set({
                    salesRank,
                    rating,
                    reviewCount,
                    updatedAt: now,
                  })
                  .where(eq(products.id, product.id)),
              );
            }

            // 2. Lean Schema: Calculate consolidated "clever" price
            const usedPrice = keepaPriceToDecimal(
              currentPrices[KEEPA_PRICE_TYPES.USED],
            );
            const warehousePrice = keepaPriceToDecimal(
              currentPrices[KEEPA_PRICE_TYPES.WAREHOUSE],
            );
            const listPrice = keepaPriceToDecimal(
              currentPrices[KEEPA_PRICE_TYPES.LIST],
            );

            // Calculate price per unit (Price/TB, Price/GB, etc.)
            // TODO: Implement thorough population plan per category
            let pricePerUnit: number | null = null;
            /*
            if (
              bestPrice &&
              product.normalizedCapacity &&
              product.normalizedCapacity > 0
            ) {
              pricePerUnit = bestPrice / product.normalizedCapacity;
            }
            */

            // 3. Update historyJson with today's price
            // Parse existing history (handles both legacy TEXT and compressed BLOB)
            let historyObj: Record<string, number> = parseHistoryBlob(
              product.currentHistoryJson,
            );

            // Add today's price (in cents) - only if we have a valid price
            if (bestPrice && bestPrice > 0) {
              const priceCents = Math.round(bestPrice * 100);
              // Only update if lower than existing today's price (daily low)
              if (!historyObj[todayStr] || priceCents < historyObj[todayStr]) {
                historyObj[todayStr] = priceCents;
              }
            }

            // Prune to last 365 days
            historyObj = pruneHistory(historyObj, 365);

            // Compress for storage
            const historyJson = compressHistory(JSON.stringify(historyObj));

            // 4. Price Upsert - Lean Schema
            // Always update lastUpdated if we fetched it, to avoid re-fetching in the same cycle.
            const priceAvg90 = keepaPriceToDecimal(
              kp.stats?.avg90?.[KEEPA_PRICE_TYPES.NEW],
            );

            sqlQueries.push(
              db
                .insert(prices)
                .values({
                  productId: product.id,
                  country,
                  price: bestPrice,
                  usedPrice,
                  warehousePrice,
                  listPrice,
                  priceAvg90,
                  // pricePerUnit, (Keeping empty for now)
                  historyJson,
                  currency,
                  source: "keepa",
                  lastUpdated: now,
                })
                .onConflictDoUpdate({
                  target: [prices.productId, prices.country],
                  set: {
                    price: bestPrice,
                    usedPrice,
                    warehousePrice:
                      warehousePrice ?? sql`${prices.warehousePrice}`,
                    listPrice: listPrice ?? sql`${prices.listPrice}`,
                    priceAvg90: priceAvg90 ?? sql`${prices.priceAvg90}`,
                    // pricePerUnit: pricePerUnit ?? sql`${prices.pricePerUnit}`,
                    historyJson,
                    lastUpdated: now,
                  },
                }),
            );
          }

          if (sqlQueries.length > 0 && !isDryRun) {
            await withRetry(async () => {
              await (db as any).batch(sqlQueries);
            });
          }
          updated += keepaProducts.length;
          console.log(
            `    ✓ Batch ${batchAbsIndex + 1}/${batches.length} synced (${keepaProducts.length} items)`,
          );
        } catch (err) {
          console.error(
            `    ❌ Batch ${batchAbsIndex + 1} failed:`,
            err instanceof Error ? err.message : String(err),
          );
          failed += batch.length;
        }
      }),
    );
  }

  const fetchTime = ((performance.now() - fetchStart) / 1000).toFixed(2);
  console.log(`\n📊 Update Summary:`);
  console.log(`------------------------------`);
  console.log(`🌍 Network: ${fetchTime}s`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`------------------------------`);
  if (process.env.WARM_CACHE === "true" && !isDryRun) {
    try {
      console.log("\n🔥 Triggering Cache Warmer (Lite Mode)...");
      execSync(`bun run warm-cache --lite`, { stdio: "inherit" });
    } catch (err) {
      console.error(
        "\n   ❌ Cache warming failed:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // 🏁 Force Checkpoint: Truncate the WAL file to reclaim disk space immediately
  if (!isDryRun) {
    try {
      await db.run(sql`PRAGMA wal_checkpoint(TRUNCATE);`);
      console.log("💾 Database checkpoint complete (WAL truncated).");
    } catch (err) {
      console.warn(
        "⚠️ Checkpoint failed (Database busy). Space will be reclaimed in the next pass.",
      );
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  const start = performance.now();
  console.log("🔄 CleverPrices Price Update\n");

  if (!isKeepaConfigured()) {
    console.error("❌ KEEPA_API_KEY missing");
    process.exit(1);
  }

  const tokens = await getTokenStatus();
  console.log(`💰 Keepa tokens: ${tokens.tokensLeft} available`);

  const country = (process.argv[2] || "de") as CountryCode;
  await updatePrices(country);

  const finalTokens = await getTokenStatus();
  const totalDuration = ((performance.now() - start) / 1000).toFixed(2);

  console.log(`\n🏁 Total execution time: ${totalDuration}s`);
  console.log(
    `✅ Update complete! Tokens remaining: ${finalTokens.tokensLeft}`,
  );

  updateLastRun();
}

main().catch((err) => {
  console.error("💥 Fatal Price Update Error:", err);
  process.exit(1);
});
