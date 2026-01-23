import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
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
} from "../../src/lib/keepa/product-discovery";
import {
  extractSalesRank,
  getDailyLow,
  keepaPriceToDecimal,
  parseKeepaHistory,
} from "../../src/lib/keepa/utils";

/**
 * Enrich Products
 *
 * Seeds historical price data from Keepa into the historyJson column.
 * Lean schema: history is stored as JSON blob instead of separate rows.
 */
async function enrich() {
  const isDryRun = process.argv.includes("--dry-run");
  const isForce = process.argv.includes("--force");
  const countryArg =
    process.argv.slice(2).find((a) => /^[a-zA-Z]{2}$/.test(a)) || "de";
  const country = countryArg as CountryCode;

  console.log("💎 CleverPrices Product Enrichment (Lean Schema)");
  console.log(`🌍 Seeding historical data for ${country.toUpperCase()}...`);

  if (isDryRun) {
    console.log("🧪 DRY RUN MODE: Database commits will be skipped.");
  }

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

  // SMART CANDIDATE DISCOVERY:
  // Products that need enrichment (not yet seeded with history)
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

  console.log(`📋 Found ${candidates.length} candidates to enrich.`);

  const tokensPre = await getTokenStatus();
  console.log(`💰 Keepa tokens: ${tokensPre.tokensLeft} available`);

  const BATCH_SIZE = 50;
  const batches: string[][] = [];
  for (let j = 0; j < candidates.length; j += BATCH_SIZE) {
    batches.push(candidates.slice(j, j + BATCH_SIZE).map((p) => p.asin));
  }
  console.log(`📦 Split into ${batches.length} batches of ${BATCH_SIZE}.\n`);

  const allQueries: any[] = [];
  let seeded = 0;
  const now = new Date();

  console.log(`🛰️ Phase 1: Fetching data from Keepa (with history)...`);
  const fetchStart = performance.now();

  const BATCH_CONCURRENCY = 3;
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

            // 1. Build historyJson from Keepa CSV data
            // Get existing historyJson if available
            const existingPrice = await db
              .select({ historyJson: prices.historyJson })
              .from(prices)
              .where(
                and(
                  eq(prices.productId, localProduct.id),
                  eq(prices.country, country),
                ),
              )
              .limit(1);

            // Parse existing history (handles both legacy TEXT and compressed BLOB)
            let historyObj: Record<string, number> = parseHistoryBlob(
              existingPrice[0]?.historyJson,
            );

            // If force mode, start fresh
            if (isForce) {
              historyObj = {};
            }

            // Parse Keepa history and merge into historyObj
            if (ep.csv) {
              const amazonHistory = getDailyLow(parseKeepaHistory(ep.csv[0]));
              const newHistory = getDailyLow(parseKeepaHistory(ep.csv[1]));

              // Merge Amazon and New histories, keeping the lowest price per day
              for (const h of [...amazonHistory, ...newHistory]) {
                const dateStr = new Date(h.timestamp)
                  .toISOString()
                  .split("T")[0];
                const priceCents = Math.round(h.price * 100);
                if (!historyObj[dateStr] || priceCents < historyObj[dateStr]) {
                  historyObj[dateStr] = priceCents;
                }
              }
            }

            // Prune to last 365 days
            historyObj = pruneHistory(historyObj, 365);

            // Compress for storage
            const historyJson = compressHistory(JSON.stringify(historyObj));

            // 2. Get price statistics from stats
            // Index 1 is NEW price, index 8 is LIST price (MSRP)
            const priceAvg90 = keepaPriceToDecimal(ep.stats?.avg90?.[1]);
            const listPrice = keepaPriceToDecimal(ep.stats?.current?.[8]);

            // Calculate price per unit
            // TODO: Implement thorough population plan per category
            let pricePerUnit: number | null = null;
            /*
            const currentPrice = keepaPriceToDecimal(ep.stats?.current?.[1]); // Use NEW price as fallback for current
            if (
              currentPrice &&
              localProduct.normalizedCapacity &&
              localProduct.normalizedCapacity > 0
            ) {
              pricePerUnit = currentPrice / localProduct.normalizedCapacity;
            }
            */

            // 3. Upsert prices with historyJson and stats
            if (Object.keys(historyObj).length > 0 || priceAvg90 || listPrice) {
              allQueries.push(
                db
                  .insert(prices)
                  .values({
                    productId: localProduct.id,
                    country,
                    historyJson,
                    priceAvg90,
                    listPrice,
                    // pricePerUnit, (Keeping empty for now)
                    currency: "EUR",
                    source: "keepa",
                    lastUpdated: now,
                  })
                  .onConflictDoUpdate({
                    target: [prices.productId, prices.country],
                    set: {
                      historyJson,
                      priceAvg90: priceAvg90 ?? sql`${prices.priceAvg90}`,
                      listPrice: listPrice ?? sql`${prices.listPrice}`,
                      // pricePerUnit: pricePerUnit ?? sql`${prices.pricePerUnit}`,
                      lastUpdated: now,
                    },
                  }),
              );
            }

            // 4. Mark product as enriched
            const salesRank =
              extractSalesRank(ep.salesRanks) ?? localProduct.salesRank;

            allQueries.push(
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
  console.log(`🚀 Phase 2: Committing to DB (${allQueries.length} queries)...`);
  const syncStart = performance.now();

  try {
    if (isDryRun) {
      console.log("  🧪 [DRY RUN] Skipping database commits.");
    } else {
      if (allQueries.length > 0) {
        const BATCH_LIMIT = 500;
        const chunks = [];
        for (let j = 0; j < allQueries.length; j += BATCH_LIMIT) {
          chunks.push(allQueries.slice(j, j + BATCH_LIMIT));
        }

        console.log(`  📦 Executing ${chunks.length} query batches...`);
        await Promise.all(
          chunks.map((chunk) =>
            withRetry(async () => {
              await (db as any).batch(chunk as any);
            }),
          ),
        );
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
