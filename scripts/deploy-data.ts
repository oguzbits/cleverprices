import { Database } from "bun:sqlite";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  products,
  prices,
  productOffers,
  priceHistory,
} from "../src/db/schema";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("🚀 Starting fresh migration...");

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

  // 1. COMPARISON (Safe Sync)
  console.log("📊 Comparing Local vs Cloud...");

  // Fetch just IDs/ASINs from cloud to compare
  const cloudAsins = await db.select({ asin: products.asin }).from(products);
  const cloudAsinSet = new Set(cloudAsins.map((p) => p.asin));

  console.log(
    `📦 Reading local data... (Cloud has ${cloudAsinSet.size} products)`,
  );
  const localProducts = localDb
    .prepare("SELECT * FROM products")
    .all() as any[];
  const localPrices = localDb.prepare("SELECT * FROM prices").all() as any[];
  const localOffers = localDb
    .prepare("SELECT * FROM product_offers")
    .all() as any[];

  // Calculate distinct counts
  let newCount = 0;
  let updateCount = 0;
  for (const p of localProducts) {
    if (cloudAsinSet.has(p.asin)) {
      updateCount++;
    } else {
      newCount++;
    }
  }

  console.log(`\n📊 Database Comparison:`);
  console.log(`   Local Products:     ${localProducts.length}`);
  console.log(`   Cloud Products:     ${cloudAsinSet.size}`);

  // Items in Cloud but NOT in Local (will remain untouched)
  const untouchedInCloud = cloudAsinSet.size - updateCount;

  console.log("\n📈 Sync Plan (Local -> Cloud):");
  console.log(`   🆕 To Insert:       ${newCount} (New in Local)`);
  console.log(`   🔄 To Update:       ${updateCount} (Common to both)`);
  console.log(`   ⏭️  Untouched:       ${untouchedInCloud} (Only in Cloud)`);

  console.log(`\n   - Prices to Sync:   ${localPrices.length}`);
  console.log(`   - Offers to Sync:   ${localOffers.length}`);
  console.log("\n🧹 Cleaning transient tables (prices/offers)...");

  // Only wipe transient data, NOT products (to preserve IDs/Refs if we needed them, though we map by slug later)
  // Actually, we map by slug later, so wiping Products is actually strictly unnecessary and risky if we ever add other relations.
  // Best practice: Upsert Products, Replace Prices.
  try {
    await db.delete(priceHistory).catch(() => {});
    await db.delete(productOffers).catch(() => {});
    await db.delete(prices).catch(() => {});
    // await db.delete(products).catch(() => {}); // <--- DO NOT WIPE PRODUCTS
  } catch (e) {
    console.warn("⚠️ Warning during cleanup:", (e as any).message);
  }

  // 3. PUSH PRODUCTS (Upsert)
  console.log(`\n☁️  Syncing ${localProducts.length} products...`);
  // Process in batches of 50
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
      capacity: p.capacity,
      capacityUnit: p.capacity_unit,
      normalizedCapacity: p.normalized_capacity,
      formFactor: p.form_factor,
      technology: p.technology,
      warranty: p.warranty,
      condition: p.condition,
      rating: p.rating,
      reviewCount: p.review_count,
      salesRank: p.sales_rank,
      salesRankReference: p.sales_rank_reference,
      monthlySold: p.monthly_sold,
      offerCountNew: p.offer_count_new,
      offerCountUsed: p.offer_count_used,
      primeEligible: p.prime_eligible ? Boolean(p.prime_eligible) : null,
      features: p.features,
      description: p.description,
      variationCSV: p.variation_csv,
      eanList: p.ean_list,
      energyLabel: p.energy_label,
      updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
    }));

    try {
      await db
        .insert(products)
        .values(records)
        .onConflictDoUpdate({
          target: products.asin,
          set: {
            // Update all important fields
            title: sql`excluded.title`,
            salesRank: sql`excluded.sales_rank`,
            monthlySold: sql`excluded.monthly_sold`,
            updatedAt: sql`excluded.updated_at`,
            rating: sql`excluded.rating`,
            reviewCount: sql`excluded.review_count`,
            imageUrl: sql`excluded.image_url`,
          },
        });
      // console.log(`   Processed ${i + batch.length}/${localProducts.length}...`);
    } catch (e: any) {
      console.error(`❌ Batch failed at index ${i}:`, e.message);
    }
  }

  // 4. MAP IDS
  console.log("🗺️  Mapping Cloud IDs...");
  const cloudProducts = await db
    .select({ id: products.id, slug: products.slug })
    .from(products);
  const slugToCloudId = new Map(cloudProducts.map((p) => [p.slug, p.id]));

  // 5. PUSH PRICES
  console.log(`💰 Pushing ${localPrices.length} prices...`);
  let priceSuccess = 0;
  const priceBatchSize = 100;

  for (let i = 0; i < localPrices.length; i += priceBatchSize) {
    const batch = localPrices.slice(i, i + priceBatchSize);
    const records: any[] = [];

    for (const pr of batch) {
      const localProd = localProducts.find((p) => p.id === pr.product_id);
      if (!localProd) continue;

      const cloudId = slugToCloudId.get(localProd.slug);
      if (!cloudId) continue;

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
        pricePerUnit: pr.price_per_unit,
        currency: pr.currency,
        source: pr.source,
        availability: pr.availability,
        deliveryTime: pr.delivery_time,
        deliveryCost: pr.delivery_cost,
        deliveryFree: pr.delivery_free === 1,
        lastUpdated: pr.last_updated
          ? new Date(pr.last_updated) // localDb might store ISO or unix
          : new Date(),
      });
    }

    if (records.length > 0) {
      try {
        await db.insert(prices).values(records);
        priceSuccess += records.length;
      } catch (e: any) {
        console.error(`❌ Price batch failure:`, e.message);
      }
    }
  }
  console.log(`✅ Prices: ${priceSuccess}/${localPrices.length}`);

  // 6. PUSH OFFERS
  console.log(`🏷️  Pushing ${localOffers.length} offers...`);
  let offerSuccess = 0;
  const offerBatchSize = 100;

  for (let i = 0; i < localOffers.length; i += offerBatchSize) {
    const batch = localOffers.slice(i, i + offerBatchSize);
    const records: any[] = [];

    for (const off of batch) {
      const localProd = localProducts.find((p) => p.id === off.product_id);
      if (!localProd) continue;

      const cloudId = slugToCloudId.get(localProd.slug);
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
        lastUpdated: off.last_updated ? new Date(off.last_updated) : new Date(),
      });
    }

    if (records.length > 0) {
      try {
        await db.insert(productOffers).values(records);
        offerSuccess += records.length;
      } catch (e: any) {
        console.error(`❌ Offer batch failure:`, e.message);
      }
    }
  }
  console.log(`✅ Offers: ${offerSuccess}/${localOffers.length}`);

  // VERIFY
  const finalProdCount = await db
    .select({ count: sql`count(*)` })
    .from(products);
  const finalPriceCount = await db
    .select({ count: sql`count(*)` })
    .from(prices);
  console.log("🏁 Final Cloud Counts:", {
    products: finalProdCount[0].count,
    prices: finalPriceCount[0].count,
  });

  process.exit(0);
}

migrate().catch(console.error);
