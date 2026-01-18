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
 * Ensures brand diversity by limiting max products per brand.
 */
export async function getCategoryBestsellers(
  parentSlug: CategorySlug,
  limit: number = 12,
  countryCode: string = "de",
  maxPerBrand: number = 2, // Limit products per brand for diversity
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
  // Then by salesRank if available, then by alphabetical brand
  const sorted = validProducts.sort((a, b) => {
    const priceCountA = Object.keys(a.prices).length;
    const priceCountB = Object.keys(b.prices).length;
    if (priceCountB !== priceCountA) {
      return priceCountB - priceCountA;
    }
    // Prefer products with better sales rank
    const rankA = a.salesRank ?? 999999;
    const rankB = b.salesRank ?? 999999;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.brand.localeCompare(b.brand);
  });

  // Apply brand diversity: limit max products per brand
  const brandCounts = new Map<string, number>();
  const diverseProducts: Product[] = [];

  for (const product of sorted) {
    const brand = product.brand.toLowerCase();
    const currentCount = brandCounts.get(brand) || 0;

    if (currentCount < maxPerBrand) {
      diverseProducts.push(product);
      brandCounts.set(brand, currentCount + 1);

      if (diverseProducts.length >= limit) {
        break;
      }
    }
  }

  return diverseProducts;
}
/**
 * Get newest products in a parent category.
 * Filters for quality products (not cheap accessories).
 * Prioritizes products with ratings and from known brands.
 */
export async function getCategoryNewProducts(
  parentSlug: CategorySlug,
  limit: number = 8,
  countryCode: string = "de",
  maxPerBrand: number = 2, // Limit products per brand for diversity
): Promise<Product[]> {
  const childCategories = getChildCategories(parentSlug);

  // Fetch products from all child categories
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug),
  );
  const productArrays = await Promise.all(productPromises);
  const allProducts = productArrays.flat();

  // Filter for quality products:
  // 1. Valid price in country
  // 2. Minimum price threshold (filter out cheap accessories)
  // 3. Prefer products with ratings
  const MIN_PRICE = 30; // Filter out €5-€20 accessories
  const validProducts = allProducts.filter(
    (p) =>
      p.prices[countryCode] !== undefined && p.prices[countryCode] >= MIN_PRICE,
  );

  // Sort by quality signals: rating, then createdAt, then price
  const sorted = validProducts.sort((a, b) => {
    // First: prefer products with ratings (rated > unrated)
    const hasRatingA = (a.rating ?? 0) > 0 ? 1 : 0;
    const hasRatingB = (b.rating ?? 0) > 0 ? 1 : 0;
    if (hasRatingB !== hasRatingA) {
      return hasRatingB - hasRatingA;
    }

    // Second: higher ratings first
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }

    // Third: more reviews = more trustworthy
    const reviewsA = a.reviewCount ?? 0;
    const reviewsB = b.reviewCount ?? 0;
    if (reviewsB !== reviewsA) {
      return reviewsB - reviewsA;
    }

    // Fourth: by createdAt (newest first)
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  // Apply brand diversity: limit max products per brand
  const brandCounts = new Map<string, number>();
  const diverseProducts: Product[] = [];

  for (const product of sorted) {
    const brand = product.brand.toLowerCase();
    const currentCount = brandCounts.get(brand) || 0;

    if (currentCount < maxPerBrand) {
      diverseProducts.push(product);
      brandCounts.set(brand, currentCount + 1);

      if (diverseProducts.length >= limit) {
        break;
      }
    }
  }

  return diverseProducts;
}
/**
 * Get best deal products in a parent category.
 * "Deal" = products with actual savings (current price < list price or avg price).
 * Filters for quality products (not cheap accessories).
 */
export async function getCategoryDeals(
  parentSlug: CategorySlug,
  limit: number = 8,
  countryCode: string = "de",
  maxPerBrand: number = 2, // Limit products per brand for diversity
): Promise<Product[]> {
  const childCategories = getChildCategories(parentSlug);

  // Fetch products from all child categories
  const productPromises = childCategories.map((child) =>
    getProductsByCategory(child.slug),
  );
  const productArrays = await Promise.all(productPromises);
  const allProducts = productArrays.flat();

  // Helper: Calculate savings percentage from list price or avg90 price
  const getSavings = (p: Product): number => {
    const price = p.prices[countryCode];
    if (!price || price <= 0) return 0;
    // Use list price if available
    const listPrice = p.listPrice?.[countryCode];
    if (listPrice && listPrice > price) {
      return (listPrice - price) / listPrice;
    }
    // Fallback to avg90 price comparison
    const avgPrice = p.priceAvg90?.[countryCode];
    if (avgPrice && avgPrice > price) {
      return (avgPrice - price) / avgPrice;
    }
    return 0;
  };

  // Filter for quality deal products:
  // 1. Valid price in country
  // 2. Minimum price threshold (filter out cheap accessories)
  // 3. Has some indicator of being a "deal" (savings, list price, or good rating)
  const MIN_PRICE = 30; // Filter out cheap accessories
  const validProducts = allProducts.filter((p) => {
    const price = p.prices[countryCode];
    if (price === undefined || price < MIN_PRICE) return false;

    // Prefer products with actual savings data or good ratings
    const hasSavings = getSavings(p) > 0.05; // At least 5% discount
    const hasGoodRating = (p.rating ?? 0) >= 4;
    const hasReviews = (p.reviewCount ?? 0) > 10;

    // Must have at least one quality signal
    return hasSavings || hasGoodRating || hasReviews;
  });

  // Sort by deal quality: savings %, then rating, then price
  const sorted = validProducts.sort((a, b) => {
    // First: actual savings percentage (higher = better deal)
    const savingsA = getSavings(a);
    const savingsB = getSavings(b);
    if (savingsB !== savingsA) {
      return savingsB - savingsA;
    }

    // Second: prefer products with ratings
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }

    // Third: more reviews = more trustworthy
    const reviewsA = a.reviewCount ?? 0;
    const reviewsB = b.reviewCount ?? 0;
    if (reviewsB !== reviewsA) {
      return reviewsB - reviewsA;
    }

    // Fourth: lower price (for tie-breaking)
    return (
      (a.prices[countryCode] || 999999) - (b.prices[countryCode] || 999999)
    );
  });

  // Apply brand diversity: limit max products per brand
  const brandCounts = new Map<string, number>();
  const diverseProducts: Product[] = [];

  for (const product of sorted) {
    const brand = product.brand.toLowerCase();
    const currentCount = brandCounts.get(brand) || 0;

    if (currentCount < maxPerBrand) {
      diverseProducts.push(product);
      brandCounts.set(brand, currentCount + 1);

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
