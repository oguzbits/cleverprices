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

  // 1. WIPE
  console.log("🧹 Wiping cloud database (ordered)...");
  await db.delete(priceHistory);
  await db.delete(productOffers);
  await db.delete(prices);
  await db.delete(products);

  // 2. LOAD LOCAL
  console.log("📦 Reading local data...");
  const localProducts = localDb
    .prepare("SELECT * FROM products")
    .all() as any[];
  const localPrices = localDb.prepare("SELECT * FROM prices").all() as any[];
  const localOffers = localDb
    .prepare("SELECT * FROM product_offers")
    .all() as any[];

  // 3. PUSH PRODUCTS
  console.log(`☁️  Pushing ${localProducts.length} products...`);
  for (const p of localProducts) {
    const record: any = {
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
      features: p.features,
      description: p.description,
    };

    try {
      await db.insert(products).values(record);
    } catch (e: any) {
      console.error(`Failed product ${p.slug}:`, e.message);
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
  for (const pr of localPrices) {
    // Bun return snake_case fields
    const localProd = localProducts.find((p) => p.id === pr.product_id);
    if (!localProd) continue;

    const cloudId = slugToCloudId.get(localProd.slug);
    if (!cloudId) continue;

    // Map snake_case to camelCase for Drizzle
    const record: any = {
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
        ? new Date(pr.last_updated * 1000)
        : new Date(),
    };

    try {
      await db.insert(prices).values(record);
      priceSuccess++;
    } catch (e: any) {
      console.error(`Failed price for ${localProd.slug}:`, e.message);
    }
  }
  console.log(`✅ Prices: ${priceSuccess}/${localPrices.length}`);

  // 6. PUSH OFFERS
  console.log(`🏷️  Pushing ${localOffers.length} offers...`);
  let offerSuccess = 0;
  for (const off of localOffers) {
    // Bun return snake_case fields
    const localProd = localProducts.find((p) => p.id === off.product_id);
    if (!localProd) continue;

    const cloudId = slugToCloudId.get(localProd.slug);
    if (!cloudId) continue;

    const record: any = {
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
      lastUpdated: off.last_updated
        ? new Date(off.last_updated * 1000)
        : new Date(),
    };

    try {
      await db.insert(productOffers).values(record);
      offerSuccess++;
    } catch (e: any) {
      console.error(`Failed offer for ${localProd.slug}:`, e.message);
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
