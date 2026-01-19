#!/usr/bin/env bun
/**
 * Collect Price History
 *
 * Records current prices to the price_history table.
 * Run this daily (via cron or manually) to build historical data.
 *
 * Over time, this builds up price charts without needing Keepa.
 *
 * Usage:
 *   bun run scripts/collect-price-history.ts [country]
 *
 * Examples:
 *   bun run scripts/collect-price-history.ts us
 *   bun run scripts/collect-price-history.ts de
 *   bun run scripts/collect-price-history.ts all
 */

import { eq, and, sql } from "drizzle-orm";
import {
  db,
  products,
  prices,
  priceHistory,
  NewPriceHistoryRecord,
} from "../src/db";
import type { CountryCode } from "../src/lib/countries";

const SUPPORTED_COUNTRIES: CountryCode[] = [
  "us",
  "de",
  "uk",
  "ca",
  "fr",
  "it",
  "es",
];

/**
 * Record prices to history for a specific country
 */
async function collectHistoryForCountry(
  country: CountryCode,
): Promise<{ recorded: number; skipped: number }> {
  console.log(`\n📊 Collecting price history for ${country.toUpperCase()}...`);

  // 1. Get all current prices for this country from local DB
  const pricesWithProducts = await db
    .select({
      productId: prices.productId,
      country: prices.country,
      amazonPrice: prices.amazonPrice,
      newPrice: prices.newPrice,
      usedPrice: prices.usedPrice,
      warehousePrice: prices.warehousePrice,
      currency: prices.currency,
    })
    .from(prices)
    .where(eq(prices.country, country));

  if (pricesWithProducts.length === 0) {
    console.log("  No prices found for this country.");
    return { recorded: 0, skipped: 0 };
  }

  // 2. Fetch all history recorded today to avoid N+1 checks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  console.log(`  🔍 Checking existing records for today...`);
  const existingRecords = await db
    .select({
      productId: priceHistory.productId,
      priceType: priceHistory.priceType,
    })
    .from(priceHistory)
    .where(
      and(
        eq(priceHistory.country, country),
        sql`${priceHistory.recordedAt} >= ${todayMs}`,
      ),
    );

  const existingMap = new Set(
    existingRecords.map((r) => `${r.productId}-${r.priceType}`),
  );

  let recorded = 0;
  let skipped = 0;
  const historyBatch: NewPriceHistoryRecord[] = [];

  for (const priceRecord of pricesWithProducts) {
    const bestPrice = priceRecord.amazonPrice ?? priceRecord.newPrice;

    if (!bestPrice) {
      skipped++;
      continue;
    }

    const priceType = priceRecord.amazonPrice ? "amazon" : "new";
    const key = `${priceRecord.productId}-${priceType}`;

    // Skip if we already recorded this type today
    if (existingMap.has(key)) {
      skipped++;
      continue;
    }

    // Prepare Amazon/New price
    historyBatch.push({
      productId: priceRecord.productId,
      country,
      price: bestPrice,
      currency: priceRecord.currency,
      priceType: priceType as any,
      recordedAt: new Date(),
    });

    // Also record used price if available and missing
    if (
      priceRecord.usedPrice &&
      !existingMap.has(`${priceRecord.productId}-used`)
    ) {
      historyBatch.push({
        productId: priceRecord.productId,
        country,
        price: priceRecord.usedPrice,
        currency: priceRecord.currency,
        priceType: "used",
        recordedAt: new Date(),
      });
    }

    // Also record warehouse price if available and missing
    if (
      priceRecord.warehousePrice &&
      !existingMap.has(`${priceRecord.productId}-warehouse`)
    ) {
      historyBatch.push({
        productId: priceRecord.productId,
        country,
        price: priceRecord.warehousePrice,
        currency: priceRecord.currency,
        priceType: "warehouse",
        recordedAt: new Date(),
      });
    }

    recorded++;
  }

  // 3. Batch Insert history records
  if (historyBatch.length > 0) {
    console.log(`  💾 Saving ${historyBatch.length} history points...`);
    const BATCH_SIZE = 500;
    for (let i = 0; i < historyBatch.length; i += BATCH_SIZE) {
      await db
        .insert(priceHistory)
        .values(historyBatch.slice(i, i + BATCH_SIZE));
    }
  }

  console.log(`  ✓ Recorded: ${recorded}, Skipped: ${skipped}`);
  return { recorded, skipped };
}

/**
 * Get price history statistics
 */
async function getHistoryStats(): Promise<void> {
  // Use COUNT(*) for efficiency instead of fetching all rows
  const [historyRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(priceHistory);
  const [productRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);

  // Get date range using efficient findFirst (which uses indexes)
  const oldest = await db.query.priceHistory.findFirst({
    orderBy: (ph, { asc }) => [asc(ph.recordedAt)],
  });

  const newest = await db.query.priceHistory.findFirst({
    orderBy: (ph, { desc }) => [desc(ph.recordedAt)],
  });

  console.log(`\n📈 Price History Statistics:`);
  console.log(`   Total records:  ${historyRes.count}`);
  console.log(`   Total products: ${productRes.count}`);

  if (oldest && newest) {
    const oldestDate = new Date(oldest.recordedAt).toLocaleDateString();
    const newestDate = new Date(newest.recordedAt).toLocaleDateString();
    console.log(`   Date range:     ${oldestDate} → ${newestDate}`);

    const daysCovered = Math.ceil(
      (new Date(newest.recordedAt).getTime() -
        new Date(oldest.recordedAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    console.log(`   Days covered:   ${daysCovered}`);
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log("📊 CleverPrices Price History Collection\n");

  const countryArg = process.argv[2] || "all";

  if (countryArg === "all") {
    // Collect for all supported countries
    let totalRecorded = 0;
    let totalSkipped = 0;

    for (const country of SUPPORTED_COUNTRIES) {
      try {
        const { recorded, skipped } = await collectHistoryForCountry(country);
        totalRecorded += recorded;
        totalSkipped += skipped;
      } catch (error) {
        console.error(`  Error for ${country}:`, error);
      }
    }

    console.log(
      `\n📊 Total: ${totalRecorded} recorded, ${totalSkipped} skipped`,
    );
  } else {
    const country = countryArg.toLowerCase() as CountryCode;
    if (!SUPPORTED_COUNTRIES.includes(country)) {
      console.error(`❌ Unknown country: ${countryArg}`);
      console.log(`   Supported: ${SUPPORTED_COUNTRIES.join(", ")}`);
      process.exit(1);
    }
    await collectHistoryForCountry(country);
  }

  // Show stats
  await getHistoryStats();

  console.log("\n✅ Done! Run this script daily to build price history.");
}

main().catch(console.error);
