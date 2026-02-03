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
  getNonEmptyCategorySlugs as getNonEmptyCategorySlugsSync,
  getProductBySlug as getProductBySlugSync,
  getProductVariants as getProductVariantsSync,
  getSimilarProducts as getSimilarProductsSync,
  type Product,
} from "../product-registry";
import { mergeLivePrices } from "./live-data";

/**
 * --- PRIVATE CACHED DATA FETCHERS ---
 * These handle the "static" or long-term data like specs, images, and basic info.
 */

async function getCachedBestDeals(
  limit: number,
  countryCode: string,
  condition?: any,
  _version: string = "v1",
) {
  "use cache";
  cacheLife("category");
  return getBestDealsSync(limit, countryCode, condition);
}

async function getCachedMostPopular(
  limit: number,
  countryCode: string,
  condition?: any,
  _version: string = "v1",
) {
  "use cache";
  cacheLife("category");
  return getMostPopularSync(limit, countryCode, condition);
}

async function getCachedNewArrivals(
  limit: number,
  countryCode: string,
  condition?: any,
  _version: string = "v1",
) {
  "use cache";
  cacheLife("category");
  return getNewArrivalsSync(limit, countryCode, condition);
}

async function getCachedDiverseMostPopular(
  itemsPerCategory: number,
  countryCode: string,
  _version: string = "v1",
) {
  "use cache";
  cacheLife("category");
  return getDiverseMostPopularSync(itemsPerCategory, countryCode);
}

import { redis } from "../redis";

async function getCachedProductBySlug(slug: string, includeHistory: boolean) {
  const cacheKey = `product:${slug}:${includeHistory}`;

  // 1. Try "Hot" Redis Cache (Fastest for shared worker/web)
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Product;
    }
  } catch (error) {
    console.warn("Redis cache miss/error:", error);
  }

  // 2. Next.js native "use cache" layer
  const fetcher = async () => {
    "use cache";
    cacheLife("product");
    return getProductBySlugSync(slug, includeHistory);
  };

  const product = await fetcher();

  // 3. Populate Redis if product exists
  if (product) {
    try {
      await redis.set(cacheKey, JSON.stringify(product), "EX", 3600); // 1 hour hot cache
    } catch (e) {
      // Ignore Redis set errors
    }
  }

  return product;
}

async function getCachedProductVariantsInternal(
  product: Product,
  countryCode: string,
) {
  // [TESTING] Cache Disabled
  return getProductVariantsSync(product, countryCode);

  /*
  // Use parentAsin or slug for cache key stability
  const idKey = product.parentAsin
    ? `asin:${product.parentAsin}`
    : `slug:${product.slug}`;
  const cacheKey = `variants:${idKey}:${countryCode}`;

  // 1. Try "Hot" Redis Cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Product[];
    }
  } catch (error) {
    console.warn("Redis variants cache miss/error:", error);
  }

  // 2. Next.js native "use cache" layer
  const fetcher = async () => {
    "use cache";
    cacheLife("product");
    return getProductVariantsSync(product, countryCode);
  };

  const variants = await fetcher();

  // 3. Populate Redis
  if (variants && variants.length > 0) {
    try {
      await redis.set(cacheKey, JSON.stringify(variants), "EX", 3600); // 1 hour hot cache
    } catch (e) {
      // Ignore Redis set errors
    }
  }

  return variants;
  */
}

async function getCachedSimilarProducts(
  category: string,
  excludedSlug: string,
  targetPrice: number,
  limit: number,
  countryCode: string,
) {
  "use cache";
  cacheLife("product");
  // We call the sync version directly to avoid double wrapping
  return getSimilarProductsSync(
    {
      category,
      slug: excludedSlug,
      prices: { [countryCode]: targetPrice },
    } as any,
    limit,
    countryCode,
  );
}
export async function getAllProductSlugs(): Promise<
  {
    id: number;
    slug: string;
    category: string;
    enrichmentStatus?: string | null;
    updatedAt: Date;
  }[]
> {
  return getAllProductSlugsSync();
}

export async function getNonEmptyCategorySlugs(): Promise<string[]> {
  return getNonEmptyCategorySlugsSync();
}

export async function getAllProducts(): Promise<Product[]> {
  return getAllProductsSync();
}

export async function getBestDeals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: any,
): Promise<Product[]> {
  const products = await getCachedBestDeals(
    limit,
    countryCode,
    condition,
    "v4",
  );
  return mergeLivePrices(products, countryCode);
}

export async function getMostPopular(
  limit: number = 8,
  countryCode: string = "de",
  condition?: any,
): Promise<Product[]> {
  const products = await getCachedMostPopular(
    limit,
    countryCode,
    condition,
    "v4",
  );
  return mergeLivePrices(products, countryCode);
}

export async function getNewArrivals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: any,
): Promise<Product[]> {
  const products = await getCachedNewArrivals(
    limit,
    countryCode,
    condition,
    "v4",
  );
  return mergeLivePrices(products, countryCode);
}

export async function getDiverseMostPopular(
  itemsPerCategory: number = 10,
  countryCode: string = "de",
): Promise<Product[]> {
  const products = await getCachedDiverseMostPopular(
    itemsPerCategory,
    countryCode,
    "v4",
  );
  return mergeLivePrices(products, countryCode);
}

export async function getProductBySlug(
  slug: string,
  includeHistory: boolean = false,
  skipLiveMerge: boolean = false,
): Promise<Product | undefined> {
  const product = await getCachedProductBySlug(slug, includeHistory);
  if (!product || skipLiveMerge) return product;

  const merged = await mergeLivePrices([product], "de");
  return merged[0];
}

// Note: getProductPriceHistory removed in lean schema.
// Price history is now stored in prices.historyJson and parsed by mapDbProduct.

export async function getUnifiedProduct(
  asin: string,
  countryCode: CountryCode,
) {
  "use cache";
  cacheLife("fast"); // Live product data from Keepa/PA-API should use 'fast' (1 min)
  return dataAggregator.fetchProduct(asin, countryCode);
}

export async function getSimilarProducts(
  product: Product,
  limit: number = 4,
  countryCode: string = "de",
): Promise<Product[]> {
  // Use current (potentially fresh) price for similarity lookup
  const currentPrice = product.prices[countryCode] || 0;
  const products = await getCachedSimilarProducts(
    product.category,
    product.slug,
    currentPrice,
    limit,
    countryCode,
  );
  return mergeLivePrices(products, countryCode);
}

export async function getProductVariants(
  product: Product,
  countryCode: string = "de",
  skipLiveMerge: boolean = false,
): Promise<Product[]> {
  const variants = await getCachedProductVariantsInternal(product, countryCode);
  if (skipLiveMerge) return variants;
  return mergeLivePrices(variants, countryCode);
}
