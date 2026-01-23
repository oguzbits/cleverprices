import { createClient } from "@libsql/client";
import { Database } from "bun:sqlite";
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { prices, products } from "../../src/db/schema";
import { loadWorkerState, updateLastCloudSync } from "../../src/lib/worker-state";

/**
 * Deploy Data to Turso (Lean Schema)
 *
 * Syncs local SQLite database to Turso cloud.
 * Lean schema: no priceHistory table, no rawData/features/description columns.
 * History is stored in prices.history_json.
 */
async function migrate() {
  const isDelta = process.argv.includes("--delta");
  const isDryRun = process.argv.includes("--dry-run");
  const isForce = process.argv.includes("--force");

  const state = loadWorkerState();
  const lastSyncTime = isDelta ? state.lastCloudSync : 0;
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
      : "🚀 Starting full fresh migration (Lean Schema)...",
  );

  const dbUrl =
    process.env.TURSO_DATABASE_URL?.replace("libsql://", "https://") || "";
  const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !dbAuthToken) {
    console.error("❌ Missing TURSO credentials.");
    process.exit(1);
  }

  const client = createClient({ url: dbUrl, authToken: dbAuthToken });
  const db = drizzle(client, { schema: { products, prices } });

  console.log("📂 Opening local database...");
  const localDb = new Database("./data/cleverprices.db");

  const ensureDate = (val: number | string | Date): Date => {
    if (val instanceof Date) return val;
    if (typeof val === "string") return new Date(val);
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

  console.log(`\n📈 Sync Plan (Local -> Cloud):`);
  console.log(`   📦 Products:    ${localProducts.length}`);
  console.log(`   💰 Prices:      ${localPrices.length}`);

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

    console.log("\n🧹 Cleaning prices table for full sync...");
    if (!isDryRun) {
      try {
        await db.delete(prices).catch(() => {});
      } catch (e) {
        console.warn("⚠️ Warning during cleanup:", (e as any).message);
      }
    } else {
      console.log("   [DRY RUN] Would delete prices.");
    }
  }

  // 2. PUSH PRODUCTS (Upsert) - Lean schema: no rawData, features, description, salesRankReference
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
        // Lean schema: rawData, features, description, salesRankReference removed
        rating: p.rating,
        reviewCount: p.review_count,
        salesRank: p.sales_rank,
        monthlySold: p.monthly_sold,
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
                rating: sql`excluded.rating`,
                reviewCount: sql`excluded.review_count`,
                salesRank: sql`excluded.sales_rank`,
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

  // 3. MAP IDS by ASIN
  console.log("🗺️  Mapping Cloud IDs by ASIN (batched)...");
  const asinToCloudId = new Map<string, number>();

  const localAsinSet = new Set<string>();
  localProducts.forEach((p) => localAsinSet.add(p.asin));
  localPrices.forEach((pr) => {
    const asin = localIdToAsin.get(pr.product_id);
    if (asin) localAsinSet.add(asin);
  });

  const allAsinsToMap = Array.from(localAsinSet);
  const mappingBatchSize = 1000;

  for (let i = 0; i < allAsinsToMap.length; i += mappingBatchSize) {
    const batch = allAsinsToMap.slice(i, i + mappingBatchSize);
    const cloudBatch = await db
      .select({ id: products.id, asin: products.asin })
      .from(products)
      .where(inArray(products.asin, batch));

    cloudBatch.forEach((p) => {
      asinToCloudId.set(p.asin, p.id);
    });

    console.log(
      `    ... mapped ${asinToCloudId.size}/${allAsinsToMap.length} ASINs`,
    );
  }

  const getLocalAsin = (localProductId: number) =>
    localIdToAsin.get(localProductId);

  // 4. PUSH PRICES (Lean schema: price, usedPrice, priceAvg90, historyJson)
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
          price: pr.price,
          usedPrice: pr.used_price,
          priceAvg90: pr.price_avg_90,
          historyJson: pr.history_json,
          currency: pr.currency,
          source: pr.source,
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
                  price: sql`excluded.price`,
                  usedPrice: sql`excluded.used_price`,
                  priceAvg90: sql`excluded.price_avg_90`,
                  historyJson: sql`excluded.history_json`,
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

  // Note: priceHistory table no longer exists in lean schema
  // History is now stored in prices.history_json

  if (!isDryRun) {
    updateLastCloudSync();
    console.log("🏁 Sync completed successfully.");
  } else {
    console.log("🏁 Dry run finished. No data was changed.");
  }
  process.exit(0);
}

migrate().catch(console.error);
