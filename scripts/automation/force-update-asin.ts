import { eq } from "drizzle-orm";
import { db, prices, products } from "../../src/db";
import {
  compressHistory,
  parseHistoryBlob,
} from "../../src/lib/history-compression";
import {
  getProducts,
  isKeepaConfigured,
} from "../../src/lib/keepa/product-discovery";
import { keepaPriceToDecimal } from "../../src/lib/keepa/utils";

async function forceUpdateAsin(asin: string, country: string = "de") {
  if (!isKeepaConfigured()) {
    console.error("❌ KEEPA_API_KEY missing");
    process.exit(1);
  }

  console.log(`\n🚀 Force updating ASIN: ${asin} (${country})...`);

  // 1. Find product in DB
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.asin, asin))
    .limit(1);

  if (!product) {
    console.error(`❌ Product with ASIN ${asin} not found in DB.`);
    return;
  }

  const [priceRecord] = await db
    .select()
    .from(prices)
    .where(eq(prices.productId, product.id))
    .limit(1);

  // 2. Fetch from Keepa
  const keepaProducts = await getProducts([asin], country as any);
  if (keepaProducts.length === 0) {
    console.error("❌ Keepa returned no data for this ASIN.");
    return;
  }

  const kp = keepaProducts[0];
  const currentPrices = kp.stats?.current || [];

  const KEEPA_PRICE_TYPES = {
    AMAZON: 0,
    NEW: 1,
    USED: 2,
    LIST: 8,
    WAREHOUSE: 9,
    BUY_BOX: 18,
  };

  const amazonPrice = keepaPriceToDecimal(
    currentPrices[KEEPA_PRICE_TYPES.AMAZON],
  );
  const newPrice = keepaPriceToDecimal(currentPrices[KEEPA_PRICE_TYPES.NEW]);
  const buyBoxPrice = keepaPriceToDecimal(
    currentPrices[KEEPA_PRICE_TYPES.BUY_BOX],
  );
  const usedPrice = keepaPriceToDecimal(currentPrices[KEEPA_PRICE_TYPES.USED]);
  const warehousePrice = keepaPriceToDecimal(
    currentPrices[KEEPA_PRICE_TYPES.WAREHOUSE],
  );

  console.log(`\n📊 Keepa Raw Data:`);
  console.log(`  - Amazon: ${amazonPrice}€`);
  console.log(`  - New:    ${newPrice}€`);
  console.log(`  - BuyBox: ${buyBoxPrice}€`);
  console.log(`  - Used:   ${usedPrice}€`);
  console.log(`  - Whouse: ${warehousePrice}€`);

  const bestPrice =
    buyBoxPrice ??
    (amazonPrice && newPrice
      ? Math.min(amazonPrice, newPrice)
      : (amazonPrice ?? newPrice));
  const finalUsedPrice = warehousePrice ?? usedPrice;

  console.log(`\n✅ Calculated Best Price: ${bestPrice}€`);
  console.log(`✅ Calculated Used Price: ${finalUsedPrice}€`);

  // 3. Update DB
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  let historyObj = parseHistoryBlob(priceRecord?.historyJson);
  if (bestPrice) {
    historyObj[todayStr] = Math.round(bestPrice * 100);
  }
  const historyJson = compressHistory(JSON.stringify(historyObj));

  await db
    .insert(prices)
    .values({
      productId: product.id,
      country,
      price: bestPrice,
      usedPrice: finalUsedPrice,
      historyJson,
      currency: "EUR",
      source: "keepa",
      lastUpdated: now,
    })
    .onConflictDoUpdate({
      target: [prices.productId, prices.country],
      set: {
        price: bestPrice,
        usedPrice: finalUsedPrice,
        historyJson,
        lastUpdated: now,
      },
    });

  console.log("\n💾 Database updated successfully.");
}

const asin = process.argv[2];
if (!asin) {
  console.error("Usage: bun run force-update-asin.ts <ASIN>");
  process.exit(1);
}

forceUpdateAsin(asin).catch(console.error);
