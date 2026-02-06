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

async function getCachedProductBySlug(slug: string, includeHistory: boolean) {
  "use cache";
  cacheLife("product");
  return getProductBySlugSync(slug, includeHistory);
}

async function getCachedProductVariantsInternal(
  parentAsin: string,
  countryCode: string,
  skipFullMapping: boolean = false,
) {
  "use cache";
  cacheLife("product");
  // We need a dummy product to start the registry fetch
  return getProductVariantsSync(
    { parentAsin } as Product,
    countryCode,
    skipFullMapping,
  );
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
export async function getAllProductSlugs(limit?: number): Promise<
  {
    id: number;
    slug: string;
    category: string;
    enrichmentStatus?: string | null;
    updatedAt: Date;
  }[]
> {
  return getAllProductSlugsSync(limit);
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
    "v5",
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
    "v5",
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
    "v5",
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
    "v5",
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
  skipFullMapping: boolean = false,
): Promise<Product[]> {
  if (!product.parentAsin) return [product];

  const variants = await getCachedProductVariantsInternal(
    product.parentAsin,
    countryCode,
    skipFullMapping,
  );
  if (skipLiveMerge) return variants;
  return mergeLivePrices(variants, countryCode);
}
