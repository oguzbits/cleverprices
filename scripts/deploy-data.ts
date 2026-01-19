import { createClient } from "@libsql/client";
import { Database } from "bun:sqlite";
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import {
  priceHistory,
  prices,
  productOffers,
  products,
} from "../src/db/schema";
import { loadWorkerState, updateLastCloudSync } from "../src/lib/worker-state";

async function migrate() {
  const isDelta = process.argv.includes("--delta");
  const isDryRun = process.argv.includes("--dry-run");
  const isForce = process.argv.includes("--force");

  // New: Limit history days to save writes (e.g. --history-days 90)
  const historyDaysFlag = process.argv.find((a) =>
    a.startsWith("--history-days="),
  );
  const historyDays = historyDaysFlag
    ? parseInt(historyDaysFlag.split("=")[1])
    : null;

  const state = loadWorkerState();
  const lastSyncTime = isDelta ? state.lastCloudSync : 0;
  // Convert MS to Seconds for SQLite query because Drizzle/LibSQL stores seconds by default
  const queryTime = Math.floor(lastSyncTime / 1000);
  const lastSyncDate = new Date(lastSyncTime);

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE: No changes will be written to the cloud.");
  }

  if (isDelta && state.lastCloudSync === 0) {
    console.warn(
      "⚠️  Warning: Incremental sync requested but no previous sync record found.",
    );
    console.warn("   Performing a full sync instead.");
  }

  console.log(
    isDelta && state.lastCloudSync > 0
      ? `🔄 Starting incremental sync (since ${lastSyncDate.toLocaleString()})...`
      : "🚀 Starting full fresh migration...",
  );

  const dbUrl =
    process.env.TURSO_DATABASE_URL?.replace("libsql://", "https://") || "";
  const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !dbAuthToken) {
    console.error("❌ Missing TURSO credentials.");
    process.exit(1);
  }

  const client = createClient({ url: dbUrl, authToken: dbAuthToken });
  const db = drizzle(client, {
    schema: { products, prices, productOffers, priceHistory },
  });

  console.log("📂 Opening local database...");
  const localDb = new Database("./data/cleverprices.db");

  const ensureDate = (val: number | string | Date): Date => {
    if (val instanceof Date) return val;
    if (typeof val === "string") return new Date(val);
    // If small number, assume seconds
    if (typeof val === "number" && val < 10000000000) {
      return new Date(val * 1000);
    }
    return new Date(val);
  };

  // 1. DATA EXTRACTION
  console.log("📊 Reading local data...");

  const localProducts = localDb
    .prepare(
      isDelta
        ? "SELECT * FROM products WHERE updated_at > ?"
        : "SELECT * FROM products",
    )
    .all(queryTime) as any[];

  const localPrices = localDb
    .prepare(
      isDelta
        ? "SELECT * FROM prices WHERE last_updated > ?"
        : "SELECT * FROM prices",
    )
    .all(queryTime) as any[];

  const localOffers = localDb
    .prepare(
      isDelta
        ? "SELECT * FROM product_offers WHERE last_updated > ?"
        : "SELECT * FROM product_offers",
    )
    .all(queryTime) as any[];

  let historyQuery = `SELECT * FROM price_history WHERE 1=1`;
  const historyParams: any[] = [];

  if (isDelta) {
    historyQuery += ` AND (recorded_at > ? OR product_id IN (SELECT id FROM products WHERE updated_at > ?))`;
    historyParams.push(queryTime, queryTime);
  }

  if (historyDays) {
    const cutoffDate = Math.floor(
      (Date.now() - historyDays * 24 * 60 * 60 * 1000) / 1000,
    );
    historyQuery += ` AND recorded_at > ?`;
    historyParams.push(cutoffDate);
    console.log(`⏳ Filtering history to last ${historyDays} days...`);
  }

  const localHistory = localDb
    .prepare(historyQuery)
    .all(...historyParams) as any[];

  console.log(`\n📈 Sync Plan (Local -> Cloud):`);
  console.log(`   📦 Products:    ${localProducts.length}`);
  console.log(`   💰 Prices:      ${localPrices.length}`);
  console.log(`   🏷️  Offers:      ${localOffers.length}`);
  if (isDelta) console.log(`   📉 History:     ${localHistory.length}`);

  if (!isDelta) {
    if (!isForce && !isDryRun) {
      console.error(
        "❌ ERROR: Full sync requires --force because it DELETES existing cloud data.",
      );
      console.log(
        "   Use --delta for incremental sync, or add --force if you are sure.",
      );
      process.exit(1);
    }

    console.log("\n🧹 Cleaning transient tables for full sync...");
    if (!isDryRun) {
      try {
        await db.delete(priceHistory).catch(() => {});
        await db.delete(productOffers).catch(() => {});
        await db.delete(prices).catch(() => {});
      } catch (e) {
        console.warn("⚠️ Warning during cleanup:", (e as any).message);
      }
    } else {
      console.log("   [DRY RUN] Would delete history, offers, and prices.");
    }
  }

  // 3. PUSH PRODUCTS (Upsert)
  if (localProducts.length > 0) {
    console.log(`\n☁️  Syncing products...`);
    const productBatchSize = 50;
    for (let i = 0; i < localProducts.length; i += productBatchSize) {
      const batch = localProducts.slice(i, i + productBatchSize);
      const records = batch.map((p) => ({
        asin: p.asin,
        gtin: p.gtin,
        mpn: p.mpn,
        sku: p.sku,
        slug: p.slug,
        title: p.title,
        brand: p.brand,
        category: p.category,
        imageUrl: p.image_url,
        manufacturer: p.manufacturer,
        capacity: p.capacity,
        capacityUnit: p.capacity_unit,
        normalizedCapacity: p.normalized_capacity,
        formFactor: p.form_factor,
        technology: p.technology,
        condition: p.condition,
        parentAsin: p.parent_asin,
        variationAttributes: p.variation_attributes,
        specifications: p.specifications,
        rawData: p.raw_data,
        features: p.features,
        rating: p.rating,
        reviewCount: p.review_count,
        salesRank: p.sales_rank,
        salesRankReference: p.sales_rank_reference,
        monthlySold: p.monthly_sold,
        description: p.description,
        energyLabel: p.energy_label,
        historySeeded: p.history_seeded === 1,
        updatedAt: ensureDate(p.updated_at || new Date()),
      }));

      if (!isDryRun) {
        try {
          await db
            .insert(products)
            .values(records)
            .onConflictDoUpdate({
              target: products.asin,
              set: {
                slug: sql`excluded.slug`,
                title: sql`excluded.title`,
                category: sql`excluded.category`,
                imageUrl: sql`excluded.image_url`,
                manufacturer: sql`excluded.manufacturer`,
                parentAsin: sql`excluded.parent_asin`,
                variationAttributes: sql`excluded.variation_attributes`,
                specifications: sql`excluded.specifications`,
                rawData: sql`excluded.raw_data`,
                features: sql`excluded.features`,
                rating: sql`excluded.rating`,
                reviewCount: sql`excluded.review_count`,
                salesRank: sql`excluded.sales_rank`,
                salesRankReference: sql`excluded.sales_rank_reference`,
                monthlySold: sql`excluded.monthly_sold`,
                historySeeded: sql`excluded.history_seeded`,
                updatedAt: sql`excluded.updated_at`,
              },
            });
        } catch (e: any) {
          console.error(`❌ Product batch failed at index ${i}:`, e.message);
        }
      } else {
        console.log(`   [DRY RUN] Would upsert ${records.length} products.`);
      }
    }
  }

  // Pre-fetch LOCAL ASINs to avoid N queries
  console.log("🗺️  Pre-fetching local ASINs...");
  const allLocalProducts = localDb
    .prepare("SELECT id, asin FROM products")
    .all() as any[];
  const localIdToAsin = new Map(allLocalProducts.map((p) => [p.id, p.asin]));

  // 4. MAP IDS by ASIN
  // Optimization: Instead of fetching ALL products from cloud, we only fetch what we need for the prices/offers/history
  console.log("🗺️  Mapping Cloud IDs by ASIN (batched)...");
  const asinToCloudId = new Map<string, number>();
  const asinsAlreadySeeded = new Set<string>();

  // Collect all unique ASINs from local data that we need to map
  const localAsinSet = new Set<string>();
  localProducts.forEach((p) => localAsinSet.add(p.asin));
  localPrices.forEach((pr) => {
    const asin = localIdToAsin.get(pr.product_id);
    if (asin) localAsinSet.add(asin);
  });
  localOffers.forEach((off) => {
    const asin = localIdToAsin.get(off.product_id);
    if (asin) localAsinSet.add(asin);
  });
  localHistory.forEach((h) => {
    const asin = localIdToAsin.get(h.product_id);
    if (asin) localAsinSet.add(asin);
  });

  const allAsinsToMap = Array.from(localAsinSet);
  const mappingBatchSize = 1000;

  for (let i = 0; i < allAsinsToMap.length; i += mappingBatchSize) {
    const batch = allAsinsToMap.slice(i, i + mappingBatchSize);
    const cloudBatch = await db
      .select({
        id: products.id,
        asin: products.asin,
        historySeeded: products.historySeeded,
      })
      .from(products)
      .where(inArray(products.asin, batch));

    cloudBatch.forEach((p) => {
      asinToCloudId.set(p.asin, p.id);
      if (p.historySeeded) {
        asinsAlreadySeeded.add(p.asin);
      }
    });

    console.log(
      `    ... mapped ${asinToCloudId.size}/${allAsinsToMap.length} ASINs (${asinsAlreadySeeded.size} already seeded)`,
    );
  }

  const getLocalAsin = (localProductId: number) =>
    localIdToAsin.get(localProductId);

  // 5. PUSH PRICES
  if (localPrices.length > 0) {
    console.log(`💰 Pushing prices...`);
    let priceSuccess = 0;
    const priceBatchSize = 100;

    for (let i = 0; i < localPrices.length; i += priceBatchSize) {
      const batch = localPrices.slice(i, i + priceBatchSize);
      const records: any[] = [];

      for (const pr of batch) {
        const asin = getLocalAsin(pr.product_id);
        const cloudId = asin ? asinToCloudId.get(asin) : null;
        if (!cloudId) continue;

        const lastUpdatedDate = ensureDate(pr.last_updated || new Date());

        records.push({
          productId: cloudId,
          country: pr.country,
          amazonPrice: pr.amazon_price,
          amazonPriceFormatted: pr.amazon_price_formatted,
          newPrice: pr.new_price,
          usedPrice: pr.used_price,
          warehousePrice: pr.warehouse_price,
          listPrice: pr.list_price,
          priceMin: pr.price_min,
          priceMax: pr.price_max,
          priceAvg30: pr.price_avg_30,
          priceAvg90: pr.price_avg_90,
          pricePerUnit: pr.price_per_unit,
          currency: pr.currency,
          source: pr.source,
          availability: pr.availability,
          deliveryTime: pr.delivery_time,
          deliveryCost: pr.delivery_cost,
          deliveryFree: pr.delivery_free === 1,
          lastUpdated: lastUpdatedDate,
        });
      }

      if (records.length > 0) {
        if (!isDryRun) {
          try {
            await db
              .insert(prices)
              .values(records)
              .onConflictDoUpdate({
                target: [prices.productId, prices.country],
                set: {
                  amazonPrice: sql`excluded.amazon_price`,
                  amazonPriceFormatted: sql`excluded.amazon_price_formatted`,
                  newPrice: sql`excluded.new_price`,
                  usedPrice: sql`excluded.used_price`,
                  warehousePrice: sql`excluded.warehouse_price`,
                  listPrice: sql`excluded.list_price`,
                  priceMin: sql`excluded.price_min`,
                  priceMax: sql`excluded.price_max`,
                  priceAvg30: sql`excluded.price_avg_30`,
                  priceAvg90: sql`excluded.price_avg_90`,
                  pricePerUnit: sql`excluded.price_per_unit`,
                  lastUpdated: sql`excluded.last_updated`,
                },
              });
            priceSuccess += records.length;
          } catch (e: any) {
            console.error(`\n❌ Price batch failure:`, e.message);
          }
        } else {
          console.log(`   [DRY RUN] Would push ${records.length} prices.`);
          priceSuccess += records.length;
        }
      }
    }
    console.log(`✅ Prices: ${priceSuccess}/${localPrices.length}`);
  }

  // 6. PUSH OFFERS
  if (localOffers.length > 0) {
    console.log(`🏷️  Pushing offers...`);
    let offerSuccess = 0;
    const offerBatchSize = 100;

    for (let i = 0; i < localOffers.length; i += offerBatchSize) {
      const batch = localOffers.slice(i, i + offerBatchSize);
      const records: any[] = [];

      for (const off of batch) {
        const asin = getLocalAsin(off.product_id);
        const cloudId = asin ? asinToCloudId.get(asin) : null;
        if (!cloudId) continue;

        records.push({
          productId: cloudId,
          source: off.source,
          merchantName: off.merchant_name,
          merchantLogo: off.merchant_logo,
          price: off.price,
          currency: off.currency,
          shippingCost: off.shipping_cost,
          totalPrice: off.total_price,
          affiliateUrl: off.affiliate_url,
          deepLink: off.deep_link,
          availability: off.availability,
          deliveryTime: off.delivery_time,
          merchantRating: off.merchant_rating,
          merchantReviewCount: off.merchant_review_count,
          lastUpdated: ensureDate(off.last_updated || new Date()),
        });
      }

      if (records.length > 0) {
        try {
          await db
            .insert(productOffers)
            .values(records)
            .onConflictDoUpdate({
              target: [
                productOffers.productId,
                productOffers.source,
                productOffers.merchantName,
              ],
              set: {
                price: sql`excluded.price`,
                shippingCost: sql`excluded.shipping_cost`,
                totalPrice: sql`excluded.total_price`,
                affiliateUrl: sql`excluded.affiliate_url`,
                availability: sql`excluded.availability`,
                deliveryTime: sql`excluded.delivery_time`,
                lastUpdated: sql`excluded.last_updated`,
              },
            });
          offerSuccess += records.length;
        } catch (e: any) {
          console.error(`❌ Offer batch failure:`, e.message);
        }
      }
    }
    console.log(`✅ Offers: ${offerSuccess}/${localOffers.length}`);
  }

  // 7. PUSH HISTORY (Delta only)
  if (localHistory.length > 0) {
    console.log(`📉 Pushing price history...`);
    let historySuccess = 0;
    let skippedProducts = new Set<string>();

    for (let i = 0; i < localHistory.length; i += 100) {
      const batch = localHistory.slice(i, i + 100);
      const records = batch
        .map((h) => {
          const asin = getLocalAsin(h.product_id);
          if (!asin) return null;

          // Skip if already seeded in cloud
          if (asinsAlreadySeeded.has(asin)) {
            skippedProducts.add(asin);
            return null;
          }

          const cloudId = asinToCloudId.get(asin);
          if (!cloudId) return null;

          return {
            productId: cloudId,
            country: h.country,
            price: h.price,
            currency: h.currency,
            priceType: h.price_type,
            recordedAt: ensureDate(h.recorded_at),
          };
        })
        .filter(Boolean) as any[];

      if (records.length > 0) {
        if (!isDryRun) {
          await db.insert(priceHistory).values(records);
        }
        historySuccess += records.length;
      }
    }
    console.log(
      `✅ History: ${historySuccess} records ${isDryRun ? "would be " : ""}pushed. (Skipped ${skippedProducts.size} products already seeded in cloud)`,
    );
  }

  if (!isDryRun) {
    updateLastCloudSync();
    console.log("🏁 Sync completed successfully.");
  } else {
    console.log("🏁 Dry run finished. No data was changed.");
  }
  process.exit(0);
}

migrate().catch(console.error);
