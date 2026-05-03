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

import { and, asc, eq, lt, sql } from "drizzle-orm";

import { allCategories, type CategorySlug } from "@/lib/categories";
import {
  compressHistory,
  parseHistoryBlob,
  pruneHistory,
} from "@/lib/history-compression";
import { getFamilyIdentity } from "@/lib/product-families";
import { getSafeDate, getSafeNow } from "@/lib/server/deterministic-time";

import { db } from "../../db";
import { prices, products } from "../../db/schema";
import {
  getBestsellers,
  getDeals,
  getProducts,
  type KeepaProductRaw,
} from "./product-discovery";
import {
  checkBudget,
  getMaxProductsToday,
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
  return Object.values(allCategories)
    .filter((cat) => !cat.hidden)
    .map((cat) => cat.slug);
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
  const cutoff = new Date(getSafeNow() - interval);
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
          deals.forEach((asin: string) => allAsins.add(asin));
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
  const now = getSafeDate();

  // Extract price data from Keepa stats
  const currentStats = keepaProduct.stats?.current || [];
  const amazonPrice = keepaPriceToDecimal(currentStats[0]); // Amazon price
  const newPrice = keepaPriceToDecimal(currentStats[1]); // Marketplace new
  const usedPrice = keepaPriceToDecimal(currentStats[2]); // Marketplace used
  const _listPrice = keepaPriceToDecimal(currentStats[4]); // MSRP/List price

  // Extract ratings, sales rank, and offer counts
  const salesRank =
    currentStats[3] && currentStats[3] > 0 ? currentStats[3] : null;
  const _offerCountNew =
    currentStats[11] && currentStats[11] > 0 ? currentStats[11] : null;
  const _offerCountUsed =
    currentStats[12] && currentStats[12] > 0 ? currentStats[12] : null;
  const rating =
    currentStats[16] && currentStats[16] > 0
      ? currentStats[16] / 10 // Keepa stores rating * 10
      : null;
  const reviewCount =
    currentStats[17] && currentStats[17] > 0 ? currentStats[17] : null;

  const avg90Stats = keepaProduct.stats?.avg90 || [];

  // Removed unused helper getMinMaxPrice

  const priceAvg90 = keepaPriceToDecimal(avg90Stats[0]); // 90-day average

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
  const _primeEligible = keepaProduct.fbaFees !== undefined; // FBA = Prime eligible

  // Get GTIN (prefer EAN, fallback to UPC)
  const gtin = keepaProduct.eanList?.[0] || keepaProduct.upcList?.[0] || null;

  // Get MPN
  const mpn = keepaProduct.mpn || null;

  // Get brand (fallback to manufacturer)
  const brand = keepaProduct.brand || keepaProduct.manufacturer || null;

  // Determine condition based on title
  const lowerTitle = (keepaProduct.title || "").toLowerCase();
  let condition = "New"; // Default

  if (
    lowerTitle.includes("generalüberholt") ||
    lowerTitle.includes("erneuert") ||
    lowerTitle.includes("renewed") ||
    lowerTitle.includes("refurbished")
  ) {
    condition = "Renewed";
  }

  // Parse variant information from Keepa
  const parentAsin = keepaProduct.parentAsin || null;
  const variationAttributes = parseVariationCSV(keepaProduct.variationCSV);

  // Extract critical attributes for slug generation
  const variationMap: Record<string, string> = {};
  if (keepaProduct.variationCSV) {
    keepaProduct.variationCSV.split(",").forEach((pair: string) => {
      const [key, val] = pair.split("|");
      if (key && val) variationMap[key.trim()] = val.trim();
    });
  }

  // Standardize keys for slug generator
  // Common Keys: "Color", "Size", "Style", "Pattern", "Configuration", "Edition"
  const _slugAttributes = {
    storage:
      variationMap["Size"] ||
      variationMap["Capacity"] ||
      variationMap["Storage"] ||
      variationMap["Speicher"] ||
      variationMap["Kapazität"],
    color: variationMap["Color"] || variationMap["Farbe"],
    ram: variationMap["RAM"] || variationMap["Arbeitsspeicher"],
    size: variationMap["Display Size"] || variationMap["Bildschirmgröße"],
    connectivity:
      variationMap["Connectivity"] ||
      variationMap["Konnektivität"] ||
      variationMap["Style"] || // Sometimes "Wi-Fi" is in Style
      variationMap["Edition"], // Sometimes in Edition
  };

  // Get first image URL
  let imageUrl: string | undefined;
  if (keepaProduct.imagesCSV) {
    const firstImage = keepaProduct.imagesCSV.split(",")[0];
    if (firstImage) {
      imageUrl = `https://images-na.ssl-images-amazon.com/images/I/${firstImage}`;
    }
  }

  // 1. Initial Draft Slug (Internal use only, will be overwritten by reconcile below)
  const draftSlug = `${keepaProduct.asin}-${keepaProduct.title?.slice(0, 50)}`;

  // 2. Upsert product with all fields
  const [product] = await db
    .insert(products)
    .values({
      asin: keepaProduct.asin,
      slug: draftSlug, // Temporary, will be fixed by reconcileFamilySlugs
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
      parentAsin,
      variationAttributes,
      energyLabel: null,
      condition,
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
        parentAsin,
        variationAttributes,
        condition,
        updatedAt: now,
      },
    })
    .returning({
      id: products.id,
      asin: products.asin,
      parentAsin: products.parentAsin,
    });

  if (!product) return;

  // 3. RECONCILE FAMILY SLUGS (The PERFORMANCE BOOSTER)
  // This ensures the DB slug column is always canonical and ID-prefixed
  await reconcileFamilySlugs(product.parentAsin || product.asin);

  // ... (Price update logic follows)
  const cleverPrice = amazonPrice ?? newPrice ?? usedPrice ?? avg90New;

  if (cleverPrice !== null && cleverPrice > 0) {
    try {
      // Get existing historyJson to append to it
      const existing = await db
        .select({ historyJson: prices.historyJson })
        .from(prices)
        .where(and(eq(prices.productId, product.id), eq(prices.country, "de")))
        .limit(1);

      // Parse existing history or start fresh (handles both legacy TEXT and compressed BLOB)
      let historyObj: Record<string, number> = parseHistoryBlob(
        existing[0]?.historyJson,
      );

      // Add today's price (in cents)
      const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      historyObj[todayStr] = Math.round(cleverPrice * 100);

      // Prune to last 365 days
      historyObj = pruneHistory(historyObj, 365);

      // Compress for storage
      const historyJson = compressHistory(JSON.stringify(historyObj));

      await db
        .insert(prices)
        .values({
          productId: product.id,
          country: "de",
          price: cleverPrice,
          usedPrice,
          priceAvg90,
          historyJson,
          currency: "EUR",
          source: "keepa",
          lastUpdated: now,
        })
        .onConflictDoUpdate({
          target: [prices.productId, prices.country],
          set: {
            price: cleverPrice,
            usedPrice,
            priceAvg90,
            historyJson,
            lastUpdated: now,
          },
        });
    } catch (error) {
      console.error(`[Sync] Price error for ${keepaProduct.asin}:`, error);
    }
  }
}

/**
 * RECONCILE FAMILY SLUGS
 *
 * This is the core of the PDP performance optimization.
 * It ensures that every product in a family (siblings) stores its
 * final, canonical, ID-prefixed slug in the DB column.
 */
async function reconcileFamilySlugs(parentAsin: string): Promise<void> {
  try {
    // 1. Fetch all products in this family
    const family = await db
      .select()
      .from(products)
      .where(eq(products.parentAsin, parentAsin));

    if (family.length === 0) {
      // Single product family (no parentAsin, or only one item)
      const single = await db
        .select()
        .from(products)
        .where(eq(products.asin, parentAsin))
        .limit(1);

      if (single[0]) {
        const { slug: canonical } = getFamilyIdentity(
          single[0] as unknown as Record<string, unknown>,
          [],
        );
        await db
          .update(products)
          .set({ slug: canonical })
          .where(eq(products.id, single[0].id));
      }
      return;
    }

    // 2. Identify Hub / Representative
    // We use getProductVariants helper to ensure we follow standard loading rules
    // but we already have the raw products if we want to be fast.
    // However, getFamilyIdentity expects real ID-prefixed consensus.
    // 2. Identify Hub / Representative
    for (const member of family) {
      const {
        slug: canonical,
        title,
        variantSuffix,
      } = getFamilyIdentity(
        member as unknown as Record<string, unknown>,
        family as unknown as Record<string, unknown>[],
      );

      // Construct Premium Title: "Brand Model Variant"
      const cleanTitle = variantSuffix ? `${title} ${variantSuffix}` : title;

      if (member.slug !== canonical || member.title !== cleanTitle) {
        await db
          .update(products)
          .set({
            slug: canonical,
            title: cleanTitle,
          })
          .where(eq(products.id, member.id));
      }
    }

    // 3. Update the Hub (Synthetic) if necessary
    // Hubs are virtual, but we might eventually want to store them too.
    // For now, only physical products in the DB get slugs.
  } catch (error) {
    console.error(`[Reconcile] Failed for ${parentAsin}:`, error);
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
 * Parse Keepa variationCSV into readable attribute string
 * Keepa format: "dimensionName1|dimensionValue1,dimensionName2|dimensionValue2"
 * Output: "dimensionName1: dimensionValue1; dimensionName2: dimensionValue2"
 */
function parseVariationCSV(csv: string | undefined): string | null {
  if (!csv) return null;
  try {
    return csv
      .split(",")
      .map((pair) => {
        const [name, value] = pair.split("|");
        if (!name || !value) return null;
        return `${name.trim()}: ${value.trim()}`;
      })
      .filter(Boolean)
      .join("; ");
  } catch {
    return null;
  }
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
