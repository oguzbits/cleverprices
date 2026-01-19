"use cache";

import { type PriceHistoryRecord } from "@/db/schema";
import { cacheLife } from "next/cache";
import { type CountryCode } from "../countries";
import { dataAggregator } from "../data-sources";
import {
  getAllProductSlugs as getAllProductSlugsSync,
  getAllProducts as getAllProductsSync,
  getBestDeals as getBestDealsSync,
  getDiverseMostPopular as getDiverseMostPopularSync,
  getMostPopular as getMostPopularSync,
  getNewArrivals as getNewArrivalsSync,
  getProductBySlug as getProductBySlugSync,
  getProductPriceHistory as getProductPriceHistorySync,
  getSimilarProducts as getSimilarProductsSync,
  type Product,
} from "../product-registry";

/**
 * Cached server-side wrappers for product registry functions
 * These are used in Server Components to benefit from Next.js 16 caching
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
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
  cacheLife("category" as any);
  return getBestDealsSync(limit, countryCode, condition);
}

export async function getMostPopular(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
  cacheLife("category" as any);
  return getMostPopularSync(limit, countryCode, condition);
}

export async function getNewArrivals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
  cacheLife("category" as any);
  return getNewArrivalsSync(limit, countryCode, condition);
}

export async function getDiverseMostPopular(
  itemsPerCategory: number = 10,
  countryCode: string = "de",
): Promise<Product[]> {
  cacheLife("category" as any);
  return getDiverseMostPopularSync(itemsPerCategory, countryCode);
}

export async function getProductBySlug(
  slug: string,
  includeHistory: boolean = false,
): Promise<Product | undefined> {
  cacheLife("product" as any);
  return getProductBySlugSync(slug, includeHistory);
}

export async function getProductPriceHistory(
  productId: number,
): Promise<PriceHistoryRecord[]> {
  cacheLife("product" as any);
  return getProductPriceHistorySync(productId);
}

export async function getUnifiedProduct(
  asin: string,
  countryCode: CountryCode,
) {
  cacheLife("product" as any); // Use the same 6h cache life
  return dataAggregator.fetchProduct(asin, countryCode);
}

export async function getSimilarProducts(
  product: Product,
  limit: number = 4,
  countryCode: string = "de",
): Promise<Product[]> {
  cacheLife("product" as any);
  return getSimilarProductsSync(product, limit, countryCode);
}
