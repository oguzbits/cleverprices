/**
 * Keepa Sync Service
 *
 * Manages product data synchronization from Keepa API.
 *
 * Strategy: Maximize products with 1-2x daily updates
 * - No tiers, all products treated equally
 * - Simple daily refresh for all products
 * - ~25,000 products possible with 1x daily update
 */

import { db } from "@/db";
import { priceHistory, prices, products } from "@/db/schema";
import type { CategorySlug } from "@/lib/categories";
import { getChildCategories } from "@/lib/categories";
import { asc, eq, lt, sql } from "drizzle-orm";

import {
  getBestsellers,
  getDeals,
  getProducts,
  type KeepaProductRaw,
} from "./product-discovery";
import {
  getMaxProductsToday,
  checkBudget,
  recordTokenUsage,
} from "./token-tracker";

/**
 * Sync configuration - optimized for 24/7 scanning
 */
export const SYNC_CONFIG = {
  // Target product count for the "Deep Scan" phase
  deepScanTarget: 25000,
  // Batch size for processing (Keepa supports up to 100)
  batchSize: 50,
  // Delay between batches (ms) to avoid rate limits
  batchDelayMs: 1000,
} as const;

/**
 * Calculate refresh interval based on how many products we are tracking.
 * Fewer products = More frequent updates (freshness).
 */
export function getDynamicRefreshInterval(productCount: number): number {
  if (productCount < 1000) return 1 * 60 * 60 * 1000; // 1 hour
  if (productCount < 5000) return 6 * 60 * 60 * 1000; // 6 hours
  if (productCount < 15000) return 12 * 60 * 60 * 1000; // 12 hours
  return 24 * 60 * 60 * 1000; // 24 hours (Standard)
}

/**
 * Get all active (non-hidden) categories
 */
export function getActiveCategories(): CategorySlug[] {
  const parentSlug = "electronics" as CategorySlug;
  const children = getChildCategories(parentSlug);
  return children.filter((cat) => !cat.hidden).map((cat) => cat.slug);
}

/**
 * Get count of products in database
 */
export async function getProductCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);
  return result[0]?.count || 0;
}

/**
 * Get products that need refresh (older than 24 hours)
 */
export async function getProductsNeedingRefresh(
  limit?: number,
): Promise<{ asin: string; category: string }[]> {
  const count = await getProductCount();
  const interval = getDynamicRefreshInterval(count);
  const cutoff = new Date(Date.now() - interval);
  const maxProducts = limit || getMaxProductsToday();

  if (maxProducts <= 0) {
    return [];
  }

  const staleProducts = await db
    .select({
      asin: products.asin,
      category: products.category,
    })
    .from(products)
    .where(lt(products.updatedAt, cutoff))
    .orderBy(asc(products.updatedAt))
    .limit(maxProducts);

  return staleProducts;
}

/**
 * Run daily sync - updates all stale products
 */
export async function runDailySync(): Promise<{
  success: boolean;
  productsUpdated: number;
  tokensUsed: number;
  errors: string[];
}> {
  const result = {
    success: true,
    productsUpdated: 0,
    tokensUsed: 0,
    errors: [] as string[],
  };

  // Check token budget and wait if needed
  const budgetCheck = checkBudget(50); // Initial check
  if (!budgetCheck.allowed) {
    console.log(
      `[Sync] Budget low, waiting ${budgetCheck.waitTimeMs / 1000}s...`,
    );
    await sleep(budgetCheck.waitTimeMs);
  }

  // Get products needing refresh
  const staleProducts = await getProductsNeedingRefresh();

  if (staleProducts.length === 0) {
    console.log("[Sync] No stale products to update");
    return result;
  }

  console.log(`[Sync] Found ${staleProducts.length} products to update`);

  // Process in batches
  const asins = staleProducts.map((p) => p.asin);
  const batches = chunkArray(asins, SYNC_CONFIG.batchSize);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // Check budget for batch
    const batchCost = batch.length;
    let budget = checkBudget(batchCost);

    if (!budget.allowed) {
      console.log(
        `[Sync] Bucket empty. Waiting ${Math.ceil(budget.waitTimeMs / 1000)}s for refill...`,
      );
      await sleep(budget.waitTimeMs);
      // Re-check just to be safe (though wait implies we are good)
      budget = checkBudget(batchCost);
    }

    try {
      // Fetch from Keepa (Germany only)
      const keepaProducts = await getProducts(batch, "de", {
        includeHistory: false, // Skip history to save bandwidth
        days: 0,
      });

      // Record token usage (1 token per product)
      const tokensUsed = keepaProducts.length;
      recordTokenUsage(tokensUsed);
      result.tokensUsed += tokensUsed;

      // Update database
      for (const keepaProduct of keepaProducts) {
        try {
          await upsertProductFromKeepa(keepaProduct);
          result.productsUpdated++;
        } catch (error) {
          result.errors.push(`Failed to update ${keepaProduct.asin}: ${error}`);
        }
      }

      console.log(
        `[Sync] Batch ${i + 1}/${batches.length}: Updated ${keepaProducts.length} products`,
      );

      // Delay between batches to respect rate limits
      await sleep(SYNC_CONFIG.batchDelayMs);
    } catch (error) {
      result.errors.push(`Batch ${i + 1} failed: ${error}`);
    }
  }

  console.log(
    `[Sync] Complete: ${result.productsUpdated} products updated, ${result.tokensUsed} tokens used`,
  );

  return result;
}

/**
 * Discover new products for a category
 */
export async function discoverProducts(
  category: CategorySlug,
  limit: number = 100,
): Promise<{
  success: boolean;
  newProducts: number;
  tokensUsed: number;
  errors: string[];
}> {
  const result = {
    success: true,
    newProducts: 0,
    tokensUsed: 0,
    errors: [] as string[],
  };

  // Check token budget
  const budget = checkBudget(limit + 10);
  if (!budget.allowed) {
    console.log(
      `[Discovery] Budget low, waiting ${budget.waitTimeMs / 1000}s...`,
    );
    await sleep(budget.waitTimeMs);
  }

  try {
    // 1. Get bestsellers from Keepa
    const bestsellers = await getBestsellers(category, "de", limit);
    const allAsins = new Set<string>(bestsellers);

    if (allAsins.size === 0) {
      console.log(`[Discovery] No products found for category: ${category}`);
      // Don't return yet, try deals
    }

    // 2. Get deals (price drops) - High priority for value
    // Cost: 5 tokens per 150 items
    try {
      const dealBudget = checkBudget(5);
      if (dealBudget.allowed) {
        const deals = await getDeals(category, "de", 150);
        if (deals.length > 0) {
          deals.forEach((asin) => allAsins.add(asin));
          console.log(`[Discovery] Got ${deals.length} deals for ${category}`);
        }
      } else {
        console.log(`[Discovery] Skipping deals due to low budget`);
      }
    } catch (error) {
      console.error(`[Discovery] Deals failed for ${category}:`, error);
    }

    // 3. Process in batches if > 50 ASINs
    const asinsArray = Array.from(allAsins);
    const batches = chunkArray(asinsArray, SYNC_CONFIG.batchSize);

    for (const batch of batches) {
      // Fetch product details
      const keepaProducts = await getProducts(batch, "de", {
        includeHistory: false,
        days: 90,
      });

      // Record token usage
      const tokensUsed = keepaProducts.length;
      recordTokenUsage(tokensUsed);
      result.tokensUsed += tokensUsed;

      // Check which are new (not in database)
      for (const keepaProduct of keepaProducts) {
        const existing = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.asin, keepaProduct.asin))
          .limit(1);

        if (existing.length === 0) {
          await upsertProductFromKeepa(keepaProduct, category);
          result.newProducts++;
        } else {
          // Update existing product
          await upsertProductFromKeepa(keepaProduct);
        }
      }

      // Respect rate limits between batches
      await sleep(SYNC_CONFIG.batchDelayMs);
    }

    // Add tokens for the initial bestseller search query (Keepa charges 50 for a list)
    recordTokenUsage(50);
    result.tokensUsed += 50;

    console.log(
      `[Discovery] ${category}: Found ${result.newProducts} new products, ${result.tokensUsed} tokens used`,
    );
  } catch (error) {
    result.success = false;
    result.errors.push(`Discovery failed: ${error}`);
  }

  return result;
}

/**
 * Import products for all categories (initial population)
 */
export async function importAllCategories(
  productsPerCategory: number = 50,
): Promise<{
  success: boolean;
  totalProducts: number;
  tokensUsed: number;
  categories: Record<string, number>;
  errors: string[];
}> {
  const result = {
    success: true,
    totalProducts: 0,
    tokensUsed: 0,
    categories: {} as Record<string, number>,
    errors: [] as string[],
  };

  const categories = getActiveCategories();
  console.log(`[Import] Starting import for ${categories.length} categories`);

  const currentCount = await getProductCount();
  const isDeepScan = currentCount < SYNC_CONFIG.deepScanTarget;

  if (isDeepScan) {
    console.log(
      `[Deep Scan] Current count (${currentCount}) is below target (${SYNC_CONFIG.deepScanTarget}). Initializing aggressive discovery.`,
    );
  }

  for (const category of categories) {
    // Check budget before each category
    const catBudget = checkBudget(productsPerCategory + 10);
    if (!catBudget.allowed) {
      console.log(
        `[Import] Waiting ${catBudget.waitTimeMs / 1000}s for tokens...`,
      );
      await sleep(catBudget.waitTimeMs);
    }

    try {
      const catResult = await discoverProducts(category, productsPerCategory);
      result.categories[category] = catResult.newProducts;
      result.totalProducts += catResult.newProducts;
      result.tokensUsed += catResult.tokensUsed;
      result.errors.push(...catResult.errors);

      // Small delay between categories
      await sleep(1000);
    } catch (error) {
      result.errors.push(`${category}: ${error}`);
    }
  }

  console.log(
    `[Import] Complete: ${result.totalProducts} products imported, ${result.tokensUsed} tokens used`,
  );

  return result;
}

/**
 * Upsert a product from Keepa data
 */
export async function upsertProductFromKeepa(
  keepaProduct: KeepaProductRaw,
  category?: CategorySlug,
): Promise<void> {
  const now = new Date();

  // Extract price data from Keepa stats
  const currentStats = keepaProduct.stats?.current || [];
  const amazonPrice = keepaPriceToDecimal(currentStats[0]); // Amazon price
  const newPrice = keepaPriceToDecimal(currentStats[1]); // Marketplace new
  const usedPrice = keepaPriceToDecimal(currentStats[2]); // Marketplace used
  const listPrice = keepaPriceToDecimal(currentStats[4]); // MSRP/List price

  // Extract ratings, sales rank, and offer counts
  const salesRank =
    currentStats[3] && currentStats[3] > 0 ? currentStats[3] : null;
  const offerCountNew =
    currentStats[11] && currentStats[11] > 0 ? currentStats[11] : null;
  const offerCountUsed =
    currentStats[12] && currentStats[12] > 0 ? currentStats[12] : null;
  const rating =
    currentStats[16] && currentStats[16] > 0
      ? currentStats[16] / 10 // Keepa stores rating * 10
      : null;
  const reviewCount =
    currentStats[17] && currentStats[17] > 0 ? currentStats[17] : null;

  // Extract price statistics
  // Extract price statistics
  // min and max are [timestamp, price] pairs in the API response
  const minStats = keepaProduct.stats?.min;
  const maxStats = keepaProduct.stats?.max;
  const avg30Stats = keepaProduct.stats?.avg30 || [];
  const avg90Stats = keepaProduct.stats?.avg90 || [];

  // Helper to get price from min/max array which might be [time, price]
  const getMinMaxPrice = (arr: any[] | undefined, index: number) => {
    if (!arr || !arr[index]) return null;
    const val = arr[index];
    if (Array.isArray(val)) return val[1]; // [time, price]
    return val;
  };

  const priceMin = keepaPriceToDecimal(getMinMaxPrice(minStats, 0)); // All-time lowest Amazon price
  const priceMax = keepaPriceToDecimal(getMinMaxPrice(maxStats, 0)); // All-time highest Amazon price
  const priceAvg30 = keepaPriceToDecimal(avg30Stats[0]); // 30-day average

  // Refined Price Logic:
  // 1. Try Current Amazon
  // 2. Try Current New
  // 3. Try Avg90 Amazon
  // 4. Try Avg90 New

  // We prefer current prices, but if OOS (-1), we look at averages to at least show *something* or a "market value"
  // However, for proper comparison, we strictly want "Buyable" prices.
  // Idealo shows "last known" sometimes.

  const avg90Amazon = keepaPriceToDecimal(avg90Stats[0]);
  const avg90New = keepaPriceToDecimal(avg90Stats[1]);

  console.log(
    `[Sync Debug] ${keepaProduct.asin} Prices - Amazon: ${amazonPrice}, New: ${newPrice}, Avg90Amz: ${avg90Amazon}, Avg90New: ${avg90New}`,
  );

  // Monthly sold and Prime eligibility
  const monthlySold = keepaProduct.monthlySold || null;
  const primeEligible = keepaProduct.fbaFees !== undefined; // FBA = Prime eligible

  // Get GTIN (prefer EAN, fallback to UPC)
  const gtin = keepaProduct.eanList?.[0] || keepaProduct.upcList?.[0] || null;

  // Get MPN
  const mpn = keepaProduct.mpn || null;

  // Get brand (fallback to manufacturer)
  const brand = keepaProduct.brand || keepaProduct.manufacturer || null;

  // Generate slug from title
  const slug = generateSlug(keepaProduct.title || keepaProduct.asin, brand);

  // Get first image URL
  let imageUrl: string | undefined;
  if (keepaProduct.imagesCSV) {
    const firstImage = keepaProduct.imagesCSV.split(",")[0];
    if (firstImage) {
      imageUrl = `https://images-na.ssl-images-amazon.com/images/I/${firstImage}`;
    }
  }

  // Upsert product with all fields
  const [product] = await db
    .insert(products)
    .values({
      asin: keepaProduct.asin,
      slug,
      title: keepaProduct.title || keepaProduct.asin,
      brand,
      gtin,
      mpn,
      category: category || ("hard-drives" as CategorySlug),
      imageUrl,
      rating,
      reviewCount,
      salesRank,
      monthlySold,
      offerCountNew,
      offerCountUsed,
      primeEligible,
      features: keepaProduct.features
        ? JSON.stringify(keepaProduct.features)
        : undefined,
      description: keepaProduct.description,
      variationCSV: keepaProduct.variationCSV,
      eanList: JSON.stringify(keepaProduct.eanList || []),
      energyLabel: null, // To be extracted from features if needed
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: products.asin,
      set: {
        title: keepaProduct.title || keepaProduct.asin,
        brand,
        gtin,
        mpn,
        imageUrl,
        rating,
        reviewCount,
        salesRank,
        monthlySold,
        offerCountNew,
        offerCountUsed,
        primeEligible,
        features: keepaProduct.features
          ? JSON.stringify(keepaProduct.features)
          : undefined,
        description: keepaProduct.description,
        variationCSV: keepaProduct.variationCSV,
        eanList: JSON.stringify(keepaProduct.eanList || []),
        updatedAt: now,
      },
    })
    .returning({ id: products.id });

  if (!product) return;

  // Upsert price for Germany with all statistics
  // Fallback to average new price if current prices are missing (OOS)
  const bestPrice = amazonPrice || newPrice || avg90New;

  if (bestPrice !== null) {
    try {
      await db
        .insert(prices)
        .values({
          productId: product.id,
          country: "de",
          amazonPrice,
          newPrice,
          usedPrice,
          listPrice,
          priceMin,
          priceMax,
          priceAvg30,
          currency: "EUR",
          source: "keepa",
          lastUpdated: now,
        })
        .onConflictDoUpdate({
          target: [prices.productId, prices.country],
          set: {
            amazonPrice,
            newPrice,
            usedPrice,
            listPrice,
            priceMin,
            priceMax,
            priceAvg30,
            lastUpdated: now,
          },
        });

      // Add to price history
      await db.insert(priceHistory).values({
        productId: product.id,
        country: "de",
        price: bestPrice,
        currency: "EUR",
        priceType: amazonPrice !== null ? "amazon" : "new",
        recordedAt: now,
      });
    } catch (error) {
      console.error(`[Sync] Price error for ${keepaProduct.asin}:`, error);
    }
  }
}

/**
 * Convert Keepa price (in cents) to decimal
 */
function keepaPriceToDecimal(price: number | null | undefined): number | null {
  if (price === null || price === undefined || price < 0) return null;
  return price / 100;
}

/**
 * Generate URL-safe slug from title, favoring "Brand Model Specs" format
 */
function generateSlug(title: string, brand?: string | null): string {
  let slug = title.toLowerCase();

  // If brand is known, ensure it starts with brand
  if (brand) {
    const cleanBrand = brand.toLowerCase();
    if (!slug.startsWith(cleanBrand)) {
      slug = `${cleanBrand}-${slug}`;
    }
  }

  // Sanitize
  slug = slug.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Truncate intelligently
  // If > 100 chars, try to cut at the last dash before 80 chars
  if (slug.length > 80) {
    const cutoff = slug.substring(0, 80).lastIndexOf("-");
    if (cutoff > 30) {
      slug = slug.substring(0, cutoff);
    } else {
      slug = slug.substring(0, 80);
    }
  }

  return slug;
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Legacy exports for compatibility
export const PRODUCT_TIERS = {
  hot: {
    name: "All Products",
    productsPerCategory: 500,
    refreshIntervalMs: 24 * 60 * 60 * 1000,
    priority: 1,
  },
  active: {
    name: "All Products",
    productsPerCategory: 500,
    refreshIntervalMs: 24 * 60 * 60 * 1000,
    priority: 1,
  },
  longTail: {
    name: "All Products",
    productsPerCategory: 500,
    refreshIntervalMs: 24 * 60 * 60 * 1000,
    priority: 1,
  },
} as const;

export type ProductTier = keyof typeof PRODUCT_TIERS;

export async function syncTier(_tier: ProductTier) {
  return runDailySync();
}
