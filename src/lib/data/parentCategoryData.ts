/**
 * Parent Category Data Functions
 * Functions to fetch products for parent category page sections:
 * - Bestsellers (highest rated/most offers)
 * - New Products (recently added)
 * - Deals (best discounts)
 */

import { getChildCategories, type CategorySlug } from "@/lib/categories";
import { getProductsByCategory, type Product } from "@/lib/product-registry";
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
 * Strips common variant modifiers (colors, capacities, etc.)
 */
function getProductGroupKey(p: Product): string {
  if (p.parentAsin) return p.parentAsin;

  const title = (p.title || "").toLowerCase();
  // Strip common variant noise
  return title
    .split(/[\(\)\[\]\|,\-]/)[0] // Take first part before delimiters
    .replace(
      /\b(schwarz|weiß|grau|blau|rot|grün|gelb|rosa|gold|silber|black|white|grey|gray|blue|red|green|yellow|pink|gold|silver)\b/g,
      "",
    )
    .replace(/\b\d+\s?(gb|tb|mb|gb|tb|core|kerne|zoll|inch)\b/g, "")
    .replace(/\b(v[23456]|gen\s?\d+|202\d)\b/g, "")
    .trim()
    .substring(0, 30); // Use first 30 chars of cleaned title as group ID
}

export async function getCategoryBestsellers(
  parentSlug: CategorySlug,
  limit: number = 12,
  countryCode: string = "de",
  maxPerBrand: number = 2, // Limit products per brand for diversity
  excludeIds: number[] = [],
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

  // Apply brand diversity and variant deduplication
  const brandCounts = new Map<string, number>();
  const seenGroups = new Set<string>();
  const diverseProducts: Product[] = [];

  for (const product of sorted) {
    const brand = product.brand.toLowerCase();
    const currentCount = brandCounts.get(brand) || 0;
    const groupKey = getProductGroupKey(product);

    if (seenGroups.has(groupKey)) continue;

    if (currentCount < maxPerBrand) {
      diverseProducts.push(product);
      brandCounts.set(brand, currentCount + 1);
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
export async function getCategoryNewProducts(
  parentSlug: CategorySlug,
  limit: number = 8,
  countryCode: string = "de",
  maxPerBrand: number = 2, // Limit products per brand for diversity
  excludeIds: number[] = [],
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
  const validProducts = allProducts.filter(
    (p) =>
      p.prices[countryCode] !== undefined &&
      p.prices[countryCode] >= MIN_PRICE &&
      !excludeIds.includes(p.id!),
  );

  // Sort by Recency-first composite score
  const sorted = validProducts.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (Math.abs(dateB - dateA) > 1000 * 60 * 60 * 24 * 7) {
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

  // Apply brand diversity and variant deduplication
  const brandCounts = new Map<string, number>();
  const seenGroups = new Set<string>();
  const diverseProducts: Product[] = [];

  for (const product of sorted) {
    const brand = product.brand.toLowerCase();
    const currentCount = brandCounts.get(brand) || 0;
    const groupKey = getProductGroupKey(product);

    if (seenGroups.has(groupKey)) continue;

    if (currentCount < maxPerBrand) {
      diverseProducts.push(product);
      brandCounts.set(brand, currentCount + 1);
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
export async function getCategoryDeals(
  parentSlug: CategorySlug,
  limit: number = 8,
  countryCode: string = "de",
  maxPerBrand: number = 2, // Limit products per brand for diversity
  excludeIds: number[] = [],
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

  // Apply brand diversity and variant deduplication
  const brandCounts = new Map<string, number>();
  const seenGroups = new Set<string>();
  const diverseProducts: Product[] = [];

  for (const product of sorted) {
    const brand = product.brand.toLowerCase();
    const currentCount = brandCounts.get(brand) || 0;
    const groupKey = getProductGroupKey(product);

    if (seenGroups.has(groupKey)) continue;

    if (currentCount < maxPerBrand) {
      product.savings = calculateProductDiscount(product, countryCode) / 100;
      diverseProducts.push(product);
      brandCounts.set(brand, currentCount + 1);
      seenGroups.add(groupKey);

      if (diverseProducts.length >= limit) {
        break;
      }
    }
  }

  return diverseProducts;
}

/**
 * Get total product count for a parent category (sum of all child categories).
 */
export async function getCategoryProductCount(
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
