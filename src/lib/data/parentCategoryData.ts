/**
 * Parent Category Data Functions
 * Functions to fetch products for parent category page sections:
 * - Bestsellers (highest rated/most offers)
 * - New Products (recently added)
 * - Deals (best discounts)
 */

import { type CategorySlug,getChildCategories } from "@/lib/categories";
import { type Product } from "@/lib/product-definitions";
import { getProductsByCategory } from "@/lib/product-registry";
import { mergeLivePrices } from "@/lib/server/live-data";
import { calculateDesirabilityScore } from "@/lib/server/scoring";
import { calculateProductDiscount } from "@/lib/utils/products";

/**
 * Get bestselling products across all child categories of a parent category.
 * "Bestseller" is determined by having the most offers/price availability.
 * Ensures brand diversity by limiting max products per brand.
 */
/**
 * Generate a deduplication key to identify variants even if parentAsin is missing.
 * Strips common variant modifiers (colors, capacities, etc.) and normalizes gaming consoles.
 */
function getProductGroupKey(p: Product): string {
  if (p.parentAsin) return p.parentAsin;

  let title = (p.title || "").toLowerCase();

  // 1. Aggressive Console Normalization
  if (title.includes("playstation 5") || title.includes("ps5")) return "ps5";
  if (title.includes("playstation 4") || title.includes("ps4")) return "ps4";
  if (title.includes("xbox series x")) return "xbox series x";
  if (title.includes("xbox series s")) return "xbox series s";
  if (title.includes("nintendo switch")) return "switch";

  // 2. Strip Brand Prefixes (e.g. "Sony PlayStation..." -> "PlayStation...")
  const brand = (p.brand || "").toLowerCase();
  if (brand && title.startsWith(brand)) {
    title = title.substring(brand.length).trim();
  }

  // 3. Strip common variant noise
  // Remove technical/marketing filler words (but keep "Pro", "Max", "Ultra" as they distinguish models)
  return title
    .split(/[\(\)\[\]\|,\-]/)[0] // Take first part before delimiters
    .replace(
      /\b(schwarz|weiß|grau|blau|rot|grün|gelb|rosa|gold|silber|black|white|grey|gray|blue|red|green|yellow|pink|gold|silver)\b/g,
      "",
    )
    .replace(
      /\b(kompakt|compact|wireless|kabellos|bluetooth|trueplay|smart|edition|subwoofer|lautsprecher|speaker|soundbar|portable|tragbar)\b/g,
      "",
    )
    .replace(/\b\d+\s?(gb|tb|mb|gb|tb|core|kerne|zoll|inch)\b/g, "")
    .replace(/\b(v[23456]|gen\s?\d+|202\d)\b/g, "")
    .trim()
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .substring(0, 30); // Use first 30 chars of cleaned title as group ID
}

import { getSafeNow } from "../server/deterministic-time";

const CURRENT_YEAR = new Date(getSafeNow()).getFullYear();


async function getCategoryBestsellers(
  parentSlug: CategorySlug,
  limit: number = 12,
  countryCode: string = "de",
  maxPerBrand: number = 2, // Limit products per brand for diversity
  excludeIds: number[] = [],
  maxPerCategory: number = 3, // Limit products per sub-category for diversity
): Promise<Product[]> {
  const childCategories = getChildCategories(parentSlug);

  // Fetch products from all child categories
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug),
  );
  const productArrays = await Promise.all(productPromises);
  const allProductsRaw = productArrays.flat();

  // Merge live prices to ensure accurate display
  const allProducts = await mergeLivePrices(allProductsRaw, countryCode);

  // Filter products with valid prices and sort by "popularity"
  const validProducts = allProducts.filter(
    (p) =>
      p.prices[countryCode] !== undefined &&
      p.prices[countryCode] > 0 &&
      !excludeIds.includes(p.id!),
  );

  // Sort by advanced desirability score
  const sorted = validProducts.sort((a, b) => {
    const scoreA = calculateDesirabilityScore(
      a,
      a.prices[countryCode] || 0,
      a.title,
      "landing",
    ).popularityScore;
    const scoreB = calculateDesirabilityScore(
      b,
      b.prices[countryCode] || 0,
      b.title,
      "landing",
    ).popularityScore;
    return scoreB - scoreA;
  });

  // Apply brand & category diversity + variant deduplication
  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const seenGroups = new Set<string>();
  const diverseProducts: Product[] = [];

  for (const product of sorted) {
    const brand = (product.brand || "").toLowerCase();
    const category = product.category;
    const currentBrandCount = brandCounts.get(brand) || 0;
    const currentCatCount = categoryCounts.get(category) || 0;
    const groupKey = getProductGroupKey(product);

    if (seenGroups.has(groupKey)) continue;

    if (currentBrandCount < maxPerBrand && currentCatCount < maxPerCategory) {
      diverseProducts.push(product);
      brandCounts.set(brand, currentBrandCount + 1);
      categoryCounts.set(category, currentCatCount + 1);
      seenGroups.add(groupKey);

      if (diverseProducts.length >= limit) {
        break;
      }
    }
  }

  return diverseProducts;
}

/**
 * Get newest products in a parent category.
 * Prioritizes recently added items from reputable brands.
 */
async function getCategoryNewProducts(
  parentSlug: CategorySlug,
  limit: number = 8,
  countryCode: string = "de",
  maxPerBrand: number = 2, // Limit products per brand for diversity
  excludeIds: number[] = [],
  maxPerCategory: number = 2, // Stricter for "New" to avoid "all soundbars"
): Promise<Product[]> {
  const childCategories = getChildCategories(parentSlug);

  // Fetch products from all child categories
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug),
  );
  const productArrays = await Promise.all(productPromises);
  const allProductsRaw = productArrays.flat();

  // Merge live prices to ensure accurate display
  const allProducts = await mergeLivePrices(allProductsRaw, countryCode);

  // Filter for quality products
  const MIN_PRICE = 30; // Filter out €5-€20 accessories
  const validProducts = allProducts.filter((p) => {
    const hasPrice =
      p.prices[countryCode] !== undefined && p.prices[countryCode] >= MIN_PRICE;
    const notExcluded = !excludeIds.includes(p.id!);

    // Extract year from title or createdAt
    const titleMatch = p.title.match(/\b(20[12][0-9])\b/);
    const yearFromTitle = titleMatch ? parseInt(titleMatch[1]) : 0;
    const yearFromDate = p.createdAt ? new Date(p.createdAt).getFullYear() : 0;
    const productYear = Math.max(yearFromTitle, yearFromDate);

    // Hard filter: anything older than 2023 is definitely not "New" in tech
    const isActuallyOld = productYear > 0 && productYear < CURRENT_YEAR - 1;

    return hasPrice && notExcluded && !isActuallyOld;
  });

  // Sort by Recency-first composite score
  const sorted = validProducts.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    // Primary sort: Date (within 30 days)
    if (Math.abs(dateB - dateA) > 1000 * 60 * 60 * 24 * 30) {
      return dateB - dateA;
    }

    const scoreA = calculateDesirabilityScore(
      a,
      a.prices[countryCode] || 0,
      a.title,
      "landing",
    ).popularityScore;
    const scoreB = calculateDesirabilityScore(
      b,
      b.prices[countryCode] || 0,
      b.title,
      "landing",
    ).popularityScore;
    return scoreB - scoreA;
  });

  // Apply brand & category diversity + variant deduplication
  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const seenGroups = new Set<string>();
  const diverseProducts: Product[] = [];

  for (const product of sorted) {
    const brand = (product.brand || "").toLowerCase();
    const category = product.category;
    const currentBrandCount = brandCounts.get(brand) || 0;
    const currentCatCount = categoryCounts.get(category) || 0;
    const groupKey = getProductGroupKey(product);

    if (seenGroups.has(groupKey)) continue;

    if (currentBrandCount < maxPerBrand && currentCatCount < maxPerCategory) {
      diverseProducts.push(product);
      brandCounts.set(brand, currentBrandCount + 1);
      categoryCounts.set(category, currentCatCount + 1);
      seenGroups.add(groupKey);

      if (diverseProducts.length >= limit) {
        break;
      }
    }
  }

  return diverseProducts;
}

/**
 * Get best deal products in a parent category.
 * STRICTLY filters for products with actual savings (>5% vs 90d avg).
 */
async function getCategoryDeals(
  parentSlug: CategorySlug,
  limit: number = 8,
  countryCode: string = "de",
  maxPerBrand: number = 2, // Limit products per brand for diversity
  excludeIds: number[] = [],
  maxPerCategory: number = 3,
): Promise<Product[]> {
  const childCategories = getChildCategories(parentSlug);

  // Fetch products from all child categories
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug),
  );
  const productArrays = await Promise.all(productPromises);
  const allProductsRaw = productArrays.flat();

  // Merge live prices to ensure accurate display
  const allProducts = await mergeLivePrices(allProductsRaw, countryCode);

  // Filter for genuine deal products
  const MIN_PRICE = 30;
  const validProducts = allProducts.filter((p) => {
    const price = p.prices[countryCode];
    if (price === undefined || price < MIN_PRICE) return false;
    if (excludeIds.includes(p.id!)) return false;

    const discountRate = calculateProductDiscount(p, countryCode);
    return discountRate >= 5;
  });

  // Sort by Deal Magnitude x Brand Power
  const sorted = validProducts.sort((a, b) => {
    const discountA = calculateProductDiscount(a, countryCode);
    const discountB = calculateProductDiscount(b, countryCode);

    const scoreA = calculateDesirabilityScore(
      a,
      a.prices[countryCode] || 0,
      a.title,
      "landing",
    ).popularityScore;
    const scoreB = calculateDesirabilityScore(
      b,
      b.prices[countryCode] || 0,
      b.title,
      "landing",
    ).popularityScore;

    const finalA = scoreA * (discountA / 100);
    const finalB = scoreB * (discountB / 100);

    return finalB - finalA;
  });

  // Apply brand & category diversity + variant deduplication
  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const seenGroups = new Set<string>();
  const diverseProducts: Product[] = [];

  for (const product of sorted) {
    const brand = (product.brand || "").toLowerCase();
    const category = product.category;
    const currentBrandCount = brandCounts.get(brand) || 0;
    const currentCatCount = categoryCounts.get(category) || 0;
    const groupKey = getProductGroupKey(product);

    if (seenGroups.has(groupKey)) continue;

    if (currentBrandCount < maxPerBrand && currentCatCount < maxPerCategory) {
      product.savings = calculateProductDiscount(product, countryCode) / 100;
      diverseProducts.push(product);
      brandCounts.set(brand, currentBrandCount + 1);
      categoryCounts.set(category, currentCatCount + 1);
      seenGroups.add(groupKey);

      if (diverseProducts.length >= limit) {
        break;
      }
    }
  }

  return diverseProducts;
}

/**
 * Get all sections for a parent category page in a single round trip.
 * Eliminates redundant fetching and price merging.
 */
export async function getParentCategoryData(
  parentSlug: CategorySlug,
  countryCode: string = "de",
): Promise<{
  bestsellers: Product[];
  newProducts: Product[];
  deals: Product[];
}> {
  const childCategories = getChildCategories(parentSlug);

  // 1. Fetch TOP products for ALL child categories ONCE
  // Using a limit (e.g. 60) per sub-category is the key optimization for hub pages.
  // It provides enough volume for brand/diversity filtering without processing 1000s of items.
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug, true, 60),
  );
  const productArrays = await Promise.all(productPromises);
  const allProductsRaw = productArrays.flat();

  // 2. Filter for valid products based on cached database prices
  const validProducts = allProductsRaw.filter(
    (p) => p.prices[countryCode] !== undefined && p.prices[countryCode] > 0,
  );

  // Helper for diversity
  const filterSection = (
    products: Product[],
    limit: number,
    excludeIds: number[],
    maxPerBrand: number = 2,
    maxPerCategory: number = 3,
  ) => {
    const brandCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const seenGroups = new Set<string>();
    const result: Product[] = [];

    for (const product of products) {
      if (excludeIds.includes(product.id!)) continue;
      const brand = (product.brand || "").toLowerCase();
      const category = product.category;
      const groupKey = getProductGroupKey(product);

      if (seenGroups.has(groupKey)) continue;

      if (
        (brandCounts.get(brand) || 0) < maxPerBrand &&
        (categoryCounts.get(category) || 0) < maxPerCategory
      ) {
        result.push(product);
        brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        seenGroups.add(groupKey);
        if (result.length >= limit) break;
      }
    }
    return result;
  };

  // 4. Calculate Bestsellers
  const bestsellersSorted = [...validProducts].sort((a, b) => {
    const scoreA = calculateDesirabilityScore(
      a,
      a.prices[countryCode] || 0,
      a.title,
      "landing",
    ).popularityScore;
    const scoreB = calculateDesirabilityScore(
      b,
      b.prices[countryCode] || 0,
      b.title,
      "landing",
    ).popularityScore;
    return scoreB - scoreA;
  });
  const bestsellers = filterSection(bestsellersSorted, 24, []);
  const bestsellerIds = bestsellers.map((p) => p.id!);

  // 5. Calculate New Products
  const newSorted = [...validProducts]
    .filter((p) => {
      const titleMatch = p.title.match(/\b(20[12][0-9])\b/);
      const yearFromTitle = titleMatch ? parseInt(titleMatch[1]) : 0;
      const yearFromDate = p.createdAt
        ? new Date(p.createdAt).getFullYear()
        : 0;
      const productYear = Math.max(yearFromTitle, yearFromDate);
      return (
        p.prices[countryCode] >= 30 &&
        !(productYear > 0 && productYear < CURRENT_YEAR - 1)
      );
    })
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (Math.abs(dateB - dateA) > 1000 * 60 * 60 * 24 * 30)
        return dateB - dateA;
      const scoreA = calculateDesirabilityScore(
        a,
        a.prices[countryCode] || 0,
        a.title,
        "landing",
      ).popularityScore;
      const scoreB = calculateDesirabilityScore(
        b,
        b.prices[countryCode] || 0,
        b.title,
        "landing",
      ).popularityScore;
      return scoreB - scoreA;
    });
  const newProducts = filterSection(newSorted, 8, bestsellerIds, 2, 2);
  const newIds = newProducts.map((p) => p.id!);

  // 6. Calculate Deals
  const dealsSorted = [...validProducts]
    .filter((p) => {
      const price = p.prices[countryCode];
      return price >= 30 && calculateProductDiscount(p, countryCode) >= 5;
    })
    .sort((a, b) => {
      const discountA = calculateProductDiscount(a, countryCode);
      const discountB = calculateProductDiscount(b, countryCode);
      const scoreA =
        calculateDesirabilityScore(
          a,
          a.prices[countryCode] || 0,
          a.title,
          "landing",
        ).popularityScore *
        (discountA / 100);
      const scoreB =
        calculateDesirabilityScore(
          b,
          b.prices[countryCode] || 0,
          b.title,
          "landing",
        ).popularityScore *
        (discountB / 100);
      return scoreB - scoreA;
    });
  const deals = filterSection(
    dealsSorted,
    8,
    [...bestsellerIds, ...newIds],
    2,
    3,
  );
  // 7. MERGE LIVE PRICES ONLY FOR SELECTED PRODUCTS
  // This is the performance "Silver Bullet": We only fetch live data for the ~40 actual items shown,
  // not the 1000s of products in the entire parent category tree.
  // [STABILITY SHIELD] Unified path for Shared Cache stability.
  const finalProducts = await mergeLivePrices(
    [...bestsellers, ...newProducts, ...deals],
    countryCode,
  );

  // Re-map the merged products back to their respective sections
  const productMap = new Map(finalProducts.map((p) => [p.id, p]));

  const bestsellersFinal = bestsellers.map((p) => productMap.get(p.id!) || p);
  const newProductsFinal = newProducts.map((p) => productMap.get(p.id!) || p);
  const dealsFinal = deals.map((p) => {
    const merged = productMap.get(p.id!) || p;
    // Re-calculate savings with fresh prices
    merged.savings = calculateProductDiscount(merged, countryCode) / 100;
    return merged;
  });

  return {
    bestsellers: bestsellersFinal,
    newProducts: newProductsFinal,
    deals: dealsFinal,
  };
}

/**
 * Get total product count for a parent category (sum of all child categories).
 */
async function getCategoryProductCount(
  parentSlug: CategorySlug,
  countryCode: string = "de",
): Promise<number> {
  const childCategories = getChildCategories(parentSlug);

  // Fetch products from all child categories
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug),
  );
  const productArrays = await Promise.all(productPromises);
  const allProducts = productArrays.flat();

  // Count only products with valid prices
  return allProducts.filter(
    (p) => p.prices[countryCode] !== undefined && p.prices[countryCode] > 0,
  ).length;
}
