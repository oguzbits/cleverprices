import {
  getAllProductSlugs as getAllProductSlugsSync,
  getAllProducts as getAllProductsSync,
  getBestDeals as getBestDealsSync,
  getMostPopular as getMostPopularSync,
  getNewArrivals as getNewArrivalsSync,
  type Product,
} from "../product-registry";

/**
 * Cached server-side wrappers for product registry functions
 * These are used in Server Components to benefit from Next.js caching
 */

export async function getAllProductSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  return getAllProductSlugsSync();
}

// Bypass cache for large registry calls to avoid string limit issues during build
export async function getAllProducts(): Promise<Product[]> {
  return getAllProductsSync();
}

export async function getBestDeals(
  limit: number = 8,
  countryCode: string = "de",
): Promise<Product[]> {
  return getBestDealsSync(limit, countryCode);
}

export async function getMostPopular(
  limit: number = 8,
  countryCode: string = "de",
): Promise<Product[]> {
  return getMostPopularSync(limit, countryCode);
}

export async function getNewArrivals(
  limit: number = 8,
  countryCode: string = "de",
): Promise<Product[]> {
  return getNewArrivalsSync(limit, countryCode);
}
