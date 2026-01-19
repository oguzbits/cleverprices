import { db, products, prices, priceHistory } from "../src/db";
import { eq, isNull, and, or, asc } from "drizzle-orm";
import { withRetry } from "../src/db/utils";
import type { CountryCode } from "../src/lib/countries";
import {
  getProducts,
  getTokenStatus,
} from "../src/lib/keepa/product-discovery";
import {
  extractSalesRank,
  keepaPriceToDecimal,
  parseKeepaHistory,
  getDailyLow,
} from "../src/lib/keepa/utils";

async function enrich() {
  const country = (process.argv[2] || "de") as CountryCode;
  console.log("💎 CleverPrices Product Enrichment");
  console.log(`🌍 Seeding historical data for ${country.toUpperCase()}...\n`);

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
          `📦 Seeding batch ${batchAbsIndex + 1}/${batches.length}...`,
        );

        try {
          const enrichedProducts = await getProducts(batch, country, {
            includeHistory: true,
          });

          const metadataQueries: any[] = [];
          const allHistoryInsertions: any[] = [];

          const now = new Date();
          for (const ep of enrichedProducts) {
            const localProduct = candidates.find((p) => p.asin === ep.asin);
            if (!localProduct) continue;

            // 1. Prepare avg90 in prices table
            const avg90Raw = ep.stats?.avg90?.[1]; // 1 = New price
            const priceAvg90 = keepaPriceToDecimal(avg90Raw);

            if (priceAvg90) {
              metadataQueries.push(
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

            // 2. Prepare Price History
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
                // Delete older records
                metadataQueries.push(
                  db
                    .delete(priceHistory)
                    .where(
                      and(
                        eq(priceHistory.productId, localProduct.id),
                        eq(priceHistory.country, country),
                      ),
                    ),
                );
                // Collect history points for mega-insert
                allHistoryInsertions.push(...historyToInsert);
              }
            }

            // 3. Prepare Metadata Mark
            metadataQueries.push(
              db
                .update(products)
                .set({
                  historySeeded: true,
                  salesRank:
                    extractSalesRank(ep.salesRanks) ?? localProduct.salesRank,
                  updatedAt: now,
                })
                .where(eq(products.id, localProduct.id)),
            );
          }

          // EXECUTION STEP: One batch + One bulk insert (Ultra fast)
          try {
            await withRetry(async () => {
              // 1. Run all deletions and metadata updates in one atomic batch
              if (metadataQueries.length > 0) {
                await (db as any).batch(metadataQueries);
              }

              // 2. Run the mega-insert for all history points at once
              // Drizzle will automatically chunk this for us to stay within SQL limits
              if (allHistoryInsertions.length > 0) {
                await db.insert(priceHistory).values(allHistoryInsertions);
              }
            });

            seeded += enrichedProducts.length;
            console.log(
              `    ✅ Batch ${batchAbsIndex + 1} complete (${enrichedProducts.length} products)`,
            );
          } catch (err: any) {
            console.error(
              `  Failed to commit batch ${batchAbsIndex + 1}:`,
              err.message,
            );
          }
        } catch (e: any) {
          console.error(`  Error in batch ${batchAbsIndex + 1}:`, e.message);
        }
      }),
    );
  }

  console.log(`\n✅ Enrichment cycle complete. Seeded ${seeded} products.`);
}

enrich().catch(console.error);
