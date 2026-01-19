import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db, priceHistory, prices, products } from "../src/db";
import { withRetry } from "../src/db/utils";
import type { CountryCode } from "../src/lib/countries";
import {
  getProducts,
  getTokenStatus,
} from "../src/lib/keepa/product-discovery";
import {
  extractSalesRank,
  getDailyLow,
  keepaPriceToDecimal,
  parseKeepaHistory,
} from "../src/lib/keepa/utils";

async function enrich() {
  const isDryRun = process.argv.includes("--dry-run");
  // Robust country detection: search for a 2-letter alphabetical code that doesn't start with -
  const countryArg =
    process.argv.slice(2).find((a) => /^[a-zA-Z]{2}$/.test(a)) || "de";
  const country = countryArg as CountryCode;

  console.log("💎 CleverPrices Product Enrichment");
  console.log(`🌍 Seeding historical data for ${country.toUpperCase()}...`);
  if (isDryRun)
    console.log("🧪 DRY RUN MODE: Database commits will be skipped.");
  console.log("");

  // Robust argument parsing for --limit
  const limitArgIndex = process.argv.findIndex((a) => a.startsWith("--limit"));
  let customLimit = 200;
  if (limitArgIndex !== -1) {
    const arg = process.argv[limitArgIndex];
    if (arg.includes("=")) {
      customLimit = parseInt(arg.split("=")[1]);
    } else if (process.argv[limitArgIndex + 1]) {
      customLimit = parseInt(process.argv[limitArgIndex + 1]);
    }
  }
  if (isNaN(customLimit)) customLimit = 200;

  const candidates = await db.query.products.findMany({
    where: or(
      eq(products.historySeeded, false),
      isNull(products.historySeeded),
    ),
    orderBy: [asc(products.salesRank)],
    limit: customLimit,
  });

  if (candidates.length === 0) {
    console.log("✅ All products are already enriched!");
    return;
  }

  console.log(`🔍 Found ${candidates.length} candidates for enrichment.`);

  let seeded = 0;
  const asins = candidates.map((p) => p.asin);

  // Create batches (Keepa supports up to 100, but 50 is better for heavy history data)
  const batches = [];
  for (let i = 0; i < asins.length; i += 50) {
    batches.push(asins.slice(i, i + 50));
  }

  // Check tokens before parallel launch
  // Enrichment is expensive (~2-5 tokens/product). 20 products = ~40-100 tokens.
  const status = await getTokenStatus();
  if (status.tokensLeft < batches.length * 50) {
    console.log(
      `\n⚠️ Low tokens (${status.tokensLeft}). Processing batches sequentially (not implemented, proceeding with caution or could just run parallel anyway as bucket is shared).`,
    );
    // For now, proceed. Keepa handles concurrency.
  }

  const BATCH_CONCURRENCY = 3;
  const allMetadataQueries: any[] = [];
  const globalHistoryInsertions: any[] = [];
  const now = new Date();

  // PHASE 1: Data Acquisition
  console.log(
    `📡 Phase 1: Fetching data from Keepa (${batches.length} batches)...`,
  );
  const fetchStart = performance.now();

  for (let i = 0; i < batches.length; i += BATCH_CONCURRENCY) {
    const currentBatches = batches.slice(i, i + BATCH_CONCURRENCY);
    await Promise.all(
      currentBatches.map(async (batch, idx) => {
        const batchAbsIndex = i + idx;
        try {
          const enrichedProducts = await getProducts(batch, country, {
            includeHistory: true,
          });

          for (const ep of enrichedProducts) {
            const localProduct = candidates.find((p) => p.asin === ep.asin);
            if (!localProduct) continue;

            // 1. Prepare metadata - Only if changed
            const priceAvg90 = keepaPriceToDecimal(ep.stats?.avg90?.[1]);
            // Search local candidate to find if priceAvg90 is already set (need to find it in the price list, but candidates doesn't have prices)
            // Simplified: Always push AVG90 for now as it's part of the enrichment goal, but avoid if zero/null
            if (priceAvg90 && priceAvg90 > 0) {
              allMetadataQueries.push(
                db
                  .update(prices)
                  .set({ priceAvg90 })
                  .where(
                    and(
                      eq(prices.productId, localProduct.id),
                      eq(prices.country, country),
                    ),
                  ),
              );
            }

            // 2. Prepare History
            if (ep.csv) {
              const amazonHistory = getDailyLow(parseKeepaHistory(ep.csv[0]));
              const newHistory = getDailyLow(parseKeepaHistory(ep.csv[1]));

              const historyToInsert = [
                ...amazonHistory.map((h) => ({
                  productId: localProduct.id,
                  country,
                  price: h.price,
                  currency: "EUR",
                  priceType: "amazon",
                  recordedAt: new Date(h.timestamp),
                })),
                ...newHistory.map((h) => ({
                  productId: localProduct.id,
                  country,
                  price: h.price,
                  currency: "EUR",
                  priceType: "new",
                  recordedAt: new Date(h.timestamp),
                })),
              ];

              if (historyToInsert.length > 0) {
                // Only delete if we suspect there might be partial data (extra safety)
                // but if we want to save writes, we could skip this for fresh seeds.
                // Keeping it but ensuring it's only called when needed.
                allMetadataQueries.push(
                  db
                    .delete(priceHistory)
                    .where(
                      and(
                        eq(priceHistory.productId, localProduct.id),
                        eq(priceHistory.country, country),
                      ),
                    ),
                );
                globalHistoryInsertions.push(...historyToInsert);
              }
            }

            const salesRank =
              extractSalesRank(ep.salesRanks) ?? localProduct.salesRank;

            allMetadataQueries.push(
              db
                .update(products)
                .set({
                  historySeeded: true,
                  salesRank,
                  updatedAt: now,
                })
                .where(eq(products.id, localProduct.id)),
            );
            seeded++;
          }
          console.log(
            `  ✓ Batch ${batchAbsIndex + 1}/${batches.length} complete`,
          );
        } catch (e: any) {
          console.error(`  ❌ Error in batch ${batchAbsIndex + 1}:`, e.message);
        }
      }),
    );
  }
  const fetchTime = ((performance.now() - fetchStart) / 1000).toFixed(2);
  console.log(`🛰️ Acquisition complete in ${fetchTime}s\n`);

  // PHASE 2: Database Sync
  console.log(
    `🚀 Phase 2: Committing to DB (${allMetadataQueries.length} updates, ${globalHistoryInsertions.length} history points)...`,
  );
  const syncStart = performance.now();

  try {
    if (isDryRun) {
      console.log("  🧪 [DRY RUN] Skipping database commits.");
    } else {
      // 1. Run all metadata updates and deletions in parallel batches
      if (allMetadataQueries.length > 0) {
        const BATCH_LIMIT = 500;
        const metadataChunks = [];
        for (let j = 0; j < allMetadataQueries.length; j += BATCH_LIMIT) {
          metadataChunks.push(allMetadataQueries.slice(j, j + BATCH_LIMIT));
        }

        console.log(
          `  📦 Executing ${metadataChunks.length} metadata batches...`,
        );
        await Promise.all(
          metadataChunks.map((chunk) =>
            withRetry(async () => {
              await (db as any).batch(chunk as any);
            }),
          ),
        );
      }

      // 2. Run the mega-insert for all history points in parallel chunks
      if (globalHistoryInsertions.length > 0) {
        const CHUNK_SIZE = 3000;
        const historyChunks = [];
        for (let j = 0; j < globalHistoryInsertions.length; j += CHUNK_SIZE) {
          historyChunks.push(globalHistoryInsertions.slice(j, j + CHUNK_SIZE));
        }

        const CONCURRENCY = 5;
        console.log(
          `  📦 Executing ${historyChunks.length} history chunks (concurrency: ${CONCURRENCY})...`,
        );

        for (let j = 0; j < historyChunks.length; j += CONCURRENCY) {
          const group = historyChunks.slice(j, j + CONCURRENCY);
          await Promise.all(
            group.map((chunk, groupIdx) =>
              withRetry(async () => {
                await db.insert(priceHistory).values(chunk);
              }).catch((err) => {
                console.error(
                  `    ❌ Chunk failed in wave ${Math.floor(j / CONCURRENCY) + 1}, index ${groupIdx}:`,
                  err.message,
                );
                throw err;
              }),
            ),
          );
          const progress = Math.min(
            globalHistoryInsertions.length,
            (j + group.length) * CHUNK_SIZE,
          );
          console.log(
            `    ... progress: ${progress}/${globalHistoryInsertions.length}`,
          );
        }
      }
    }
  } catch (err: any) {
    console.error(`❌ Database sync failed:`, err.message);
    process.exit(1);
  }

  const syncTime = ((performance.now() - syncStart) / 1000).toFixed(2);
  const totalTime = ((performance.now() - fetchStart) / 1000).toFixed(2);

  console.log("\n📊 Performance Report:");
  console.log(`------------------------------`);
  console.log(`🌍 Data Fetch:  ${fetchTime}s`);
  console.log(`💾 DB Sync:    ${syncTime}s`);
  console.log(`🏁 Total:      ${totalTime}s`);
  console.log(`------------------------------`);
  console.log(`✅ Enrichment cycle complete. Seeded ${seeded} products.`);
}

enrich().catch((err) => {
  console.error("💥 Fatal Enrichment Error:", err);
  process.exit(1);
});
