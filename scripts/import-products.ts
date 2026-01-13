#!/usr/bin/env bun
/**
 * Product Import Script
 *
 * Discovers and imports products from Keepa into the database.
 *
 * Usage:
 *   bun run scripts/import-products.ts [category] [country]
 *
 * Examples:
 *   bun run scripts/import-products.ts hard-drives us
 *   bun run scripts/import-products.ts ram de
 *   bun run scripts/import-products.ts all us
 */

import { eq } from "drizzle-orm";
import { db, products, prices, NewProduct, NewPrice } from "../src/db";
import {
  discoverProducts,
  getTokenStatus,
  isKeepaConfigured,
  KEEPA_DOMAINS,
  type KeepaProductRaw,
} from "../src/lib/keepa/product-discovery";
import type { CountryCode } from "../src/lib/countries";

// Currency mapping
const DOMAIN_CURRENCIES: Record<number, string> = {
  1: "USD",
  2: "GBP",
  3: "EUR",
  4: "EUR",
  6: "CAD",
  8: "EUR",
  9: "EUR",
};

// Keepa price type indices
const KEEPA_PRICE_TYPES = {
  AMAZON: 0,
  NEW: 1,
  USED: 2,
  WAREHOUSE: 9,
  RATING: 16,
  REVIEW_COUNT: 17,
};

/**
 * Convert Keepa price (in cents) to decimal
 */
function keepaPriceToDecimal(price: number | null | undefined): number | null {
  if (price === null || price === undefined || price < 0) return null;
  return price / 100;
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(asin: string, title?: string): string {
  if (!title) return asin.toLowerCase();

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${slug}-${asin.toLowerCase()}`;
}

/**
 * Extract product specifications from title/features
 */
function extractSpecs(product: KeepaProductRaw): {
  capacity?: number;
  capacityUnit?: "GB" | "TB" | "W";
  technology?: string;
  formFactor?: string;
} {
  const title = product.title?.toLowerCase() || "";
  const features = (product.features || []).join(" ").toLowerCase();
  const text = `${title} ${features}`;

  let capacity: number | undefined;
  let capacityUnit: "GB" | "TB" | "W" | undefined;
  let technology: string | undefined;
  let formFactor: string | undefined;

  // Storage capacity (TB/GB)
  const tbMatch = text.match(/(\d+)\s*tb/);
  const gbMatch = text.match(/(\d+)\s*gb/);
  if (tbMatch) {
    capacity = parseInt(tbMatch[1], 10);
    capacityUnit = "TB";
  } else if (gbMatch) {
    capacity = parseInt(gbMatch[1], 10);
    capacityUnit = "GB";
  }

  // PSU wattage
  const wattMatch = text.match(/(\d+)\s*w(?:att)?/);
  if (wattMatch && (text.includes("power") || text.includes("psu"))) {
    capacity = parseInt(wattMatch[1], 10);
    capacityUnit = "W";
  }

  // Technology
  if (text.includes("nvme")) technology = "NVMe SSD";
  else if (text.includes("sata") && text.includes("ssd"))
    technology = "SATA SSD";
  else if (text.includes("ssd")) technology = "SSD";
  else if (text.includes("hdd") || text.includes("hard drive"))
    technology = "HDD";
  else if (text.includes("ddr5")) technology = "DDR5";
  else if (text.includes("ddr4")) technology = "DDR4";

  // Form factor
  if (text.includes("m.2") || text.includes("m2")) formFactor = "M.2";
  else if (text.includes("2.5")) formFactor = '2.5"';
  else if (text.includes("3.5")) formFactor = '3.5"';
  else if (text.includes("so-dimm") || text.includes("sodimm"))
    formFactor = "SO-DIMM";
  else if (text.includes("dimm")) formFactor = "DIMM";

  return { capacity, capacityUnit, technology, formFactor };
}

/**
 * Import a single product into the database
 */
async function importProduct(
  raw: KeepaProductRaw,
  category: string,
  country: CountryCode,
): Promise<"inserted" | "updated" | "skipped"> {
  try {
    const domain = KEEPA_DOMAINS[country];
    const currency = DOMAIN_CURRENCIES[domain] || "USD";
    const specs = extractSpecs(raw);

    // Get current prices
    const currentPrices = raw.stats?.current || [];
    const amazonPrice = keepaPriceToDecimal(
      currentPrices[KEEPA_PRICE_TYPES.AMAZON],
    );
    const newPrice = keepaPriceToDecimal(currentPrices[KEEPA_PRICE_TYPES.NEW]);
    const usedPrice = keepaPriceToDecimal(
      currentPrices[KEEPA_PRICE_TYPES.USED],
    );
    const warehousePrice = keepaPriceToDecimal(
      currentPrices[KEEPA_PRICE_TYPES.WAREHOUSE],
    );

    const bestPrice = amazonPrice ?? newPrice;
    if (!bestPrice) {
      // console.log(`  [Skip] ${raw.asin}: No price available`);
      return "skipped";
    }

    // Calculate price per unit
    let pricePerUnit: number | null = null;
    if (specs.capacity && specs.capacity > 0) {
      let normalizedCapacity = specs.capacity;
      if (specs.capacityUnit === "TB") {
        normalizedCapacity = specs.capacity * 1000; // Convert to GB
      }
      pricePerUnit = bestPrice / normalizedCapacity;
    }

    // Get image URL
    let imageUrl: string | undefined;
    if (raw.imagesCSV) {
      const firstImage = raw.imagesCSV.split(",")[0];
      if (firstImage) {
        imageUrl = `https://m.media-amazon.com/images/I/${firstImage}`;
      }
    }

    // Get rating
    const rating =
      keepaPriceToDecimal(currentPrices[KEEPA_PRICE_TYPES.RATING]) || undefined;
    const reviewCount =
      currentPrices[KEEPA_PRICE_TYPES.REVIEW_COUNT] ?? undefined;

    // Prepare product data
    const productData: NewProduct = {
      asin: raw.asin,
      slug: generateSlug(raw.asin, raw.title),
      title: raw.title || raw.asin,
      brand: raw.brand || undefined,
      category,
      imageUrl,
      capacity: specs.capacity,
      capacityUnit: specs.capacityUnit,
      normalizedCapacity:
        specs.capacityUnit === "TB"
          ? (specs.capacity || 0) * 1000
          : specs.capacity,
      technology: specs.technology,
      formFactor: specs.formFactor,
      rating,
      reviewCount: reviewCount && reviewCount > 0 ? reviewCount : undefined,
      features: raw.features ? JSON.stringify(raw.features) : undefined,
      description: raw.description,
    };

    // Upsert product
    const existing = await db.query.products.findFirst({
      where: eq(products.asin, raw.asin),
    });

    let productId: number;
    let status: "inserted" | "updated" = "inserted";

    if (existing) {
      await db
        .update(products)
        .set(productData)
        .where(eq(products.id, existing.id));
      productId = existing.id;
      status = "updated";
    } else {
      const result = await db
        .insert(products)
        .values(productData)
        .returning({ id: products.id });
      productId = result[0].id;
      status = "inserted";
    }

    // Upsert price
    const priceData: NewPrice = {
      productId,
      country,
      amazonPrice,
      newPrice,
      usedPrice,
      warehousePrice,
      pricePerUnit,
      currency,
      source: "keepa",
      lastUpdated: new Date(),
    };

    const existingPrice = await db.query.prices.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.productId, productId), eq(p.country, country)),
    });

    if (existingPrice) {
      await db
        .update(prices)
        .set(priceData)
        .where(eq(prices.id, existingPrice.id));
    } else {
      await db.insert(prices).values(priceData);
    }

    return status;
  } catch (error) {
    console.error(`  [Error] ${raw.asin}:`, error);
    return "skipped";
  }
}

/**
 * Import all products for a category
 */
async function importCategory(
  category: string,
  country: CountryCode,
): Promise<void> {
  console.log(`\n📦 Importing ${category} (${country.toUpperCase()})...`);

  const rawProducts = await discoverProducts(category, country, 100);
  console.log(`  Found ${rawProducts.length} candidate products`);

  const stats = {
    inserted: 0,
    updated: 0,
    skipped: 0,
  };

  for (const product of rawProducts) {
    const result = await importProduct(product, category, country);
    stats[result]++;
  }

  console.log(
    `  ✅ Category Result: ${stats.inserted} new, ${stats.updated} updated, ${stats.skipped} skipped`,
  );
}

/**
 * Main entry point
 */
async function main() {
  console.log("🚀 CleverPrices Product Import\n");

  // Check Keepa configuration
  if (!isKeepaConfigured()) {
    console.error("❌ KEEPA_API_KEY not configured. Add it to .env.local");
    process.exit(1);
  }

  // Check token status
  const tokens = await getTokenStatus();
  console.log(
    `💰 Keepa tokens: ${tokens.tokensLeft} available, ${tokens.refillRate}/min refill`,
  );

  if (tokens.tokensLeft < 100) {
    console.warn("⚠️  Low on tokens. Consider waiting for refill.");
  }

  // Parse arguments
  const args = process.argv.slice(2);
  const categoryArg = args[0] || "all";
  const countryArg = (args[1] || "de") as CountryCode;

  // Categories to import
  const categories =
    categoryArg === "all"
      ? ["hard-drives", "ram", "power-supplies"]
      : [categoryArg];

  console.log(`\n📋 Categories: ${categories.join(", ")}`);
  console.log(`🌍 Country: ${countryArg.toUpperCase()}\n`);

  // Import each category
  for (const category of categories) {
    await importCategory(category, countryArg);
  }

  // Final token check
  const finalTokens = await getTokenStatus();
  console.log(
    `\n✅ Import complete! Tokens remaining: ${finalTokens.tokensLeft}`,
  );
}

main().catch(console.error);
