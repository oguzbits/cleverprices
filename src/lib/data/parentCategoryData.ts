/**
 * Parent Category Data Functions
 * Functions to fetch products for parent category page sections:
 * - Bestsellers (highest rated/most offers)
 * - New Products (recently added)
 * - Deals (best discounts)
 */

import { getChildCategories, type CategorySlug } from "@/lib/categories";
import { getProductsByCategory, type Product } from "@/lib/product-registry";

/**
 * Get bestselling products across all child categories of a parent category.
 * "Bestseller" is determined by having the most offers/price availability.
 */
export async function getCategoryBestsellers(
  parentSlug: CategorySlug,
  limit: number = 12,
  countryCode: string = "de",
): Promise<Product[]> {
  const childCategories = getChildCategories(parentSlug);

  // Fetch products from all child categories
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug),
  );
  const productArrays = await Promise.all(productPromises);
  const allProducts = productArrays.flat();

  // Filter products with valid prices and sort by "popularity" (price availability as proxy)
  const validProducts = allProducts.filter(
    (p) => p.prices[countryCode] !== undefined && p.prices[countryCode] > 0,
  );

  // Sort by number of price entries (more markets = more popular)
  // Then by alphabetical brand (as a tiebreaker for consistent ordering)
  const sorted = validProducts.sort((a, b) => {
    const priceCountA = Object.keys(a.prices).length;
    const priceCountB = Object.keys(b.prices).length;
    if (priceCountB !== priceCountA) {
      return priceCountB - priceCountA;
    }
    return a.brand.localeCompare(b.brand);
  });

  return sorted.slice(0, limit);
}

/**
 * Get newest products in a parent category.
 * Note: If products don't have createdAt, fallback to random selection.
 */
export async function getCategoryNewProducts(
  parentSlug: CategorySlug,
  limit: number = 8,
  countryCode: string = "de",
): Promise<Product[]> {
  const childCategories = getChildCategories(parentSlug);

  // Fetch products from all child categories
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug),
  );
  const productArrays = await Promise.all(productPromises);
  const allProducts = productArrays.flat();

  // Filter products with valid prices
  const validProducts = allProducts.filter(
    (p) => p.prices[countryCode] !== undefined && p.prices[countryCode] > 0,
  );

  // Shuffle and take first N (pseudo-random for "new" without timestamps)
  // This provides variety on each page load
  // Updated: Removed random sort to prevent build errors and non-determinism during SSG
  const shuffled = validProducts;

  return shuffled.slice(0, limit);
}

/**
 * Get best deal products in a parent category.
 * "Deal" is determined by lowest price or best price-per-unit.
 */
export async function getCategoryDeals(
  parentSlug: CategorySlug,
  limit: number = 8,
  countryCode: string = "de",
): Promise<Product[]> {
  const childCategories = getChildCategories(parentSlug);

  // Fetch products from all child categories
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug),
  );
  const productArrays = await Promise.all(productPromises);
  const allProducts = productArrays.flat();

  // Filter products with valid prices
  const validProducts = allProducts.filter(
    (p) => p.prices[countryCode] !== undefined && p.prices[countryCode] > 0,
  );

  // Sort by price-per-unit if available, otherwise by absolute price
  const sorted = validProducts.sort((a, b) => {
    // If both have pricePerUnit, use that
    if (a.pricePerUnit && b.pricePerUnit) {
      return a.pricePerUnit - b.pricePerUnit;
    }
    // Otherwise use absolute price
    return (
      (a.prices[countryCode] || 999999) - (b.prices[countryCode] || 999999)
    );
  });

  return sorted.slice(0, limit);
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
