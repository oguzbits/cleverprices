import { cacheLife } from "next/cache";
import { type CountryCode } from "../countries";
import { dataAggregator } from "../data-sources";
import { getFamilyIdentity as getFamilyIdentitySync } from "../product-families";
import {
  findProductByParentAsinSuffix as findProductByParentAsinSuffixSync,
  findProductBySyntheticId as findProductBySyntheticIdSync,
  findProductSlugByAsinSuffix as findProductSlugByAsinSuffixSync,
  getAllProductSlugs as getAllProductSlugsSync,
  getAllProducts as getAllProductsSync,
  getBestDeals as getBestDealsSync,
  getDiverseMostPopular as getDiverseMostPopularSync,
  getMostPopular as getMostPopularSync,
  getNewArrivals as getNewArrivalsSync,
  getNonEmptyCategorySlugs as getNonEmptyCategorySlugsSync,
  getProductById as getProductByIdSync,
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

async function getCachedProductById(id: number) {
  "use cache";
  cacheLife("product");
  return getProductByIdSync(id);
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

async function getCachedProductSlugByAsinSuffix(oldSlug: string) {
  "use cache";
  cacheLife("category"); // Redirects can be cached for a long time
  return findProductSlugByAsinSuffixSync(oldSlug);
}

async function getCachedProductByParentAsinSuffix(slug: string) {
  "use cache";
  cacheLife("category");
  return findProductByParentAsinSuffixSync(slug);
}

async function getCachedProductBySyntheticId(id: number) {
  "use cache";
  cacheLife("product");
  return findProductBySyntheticIdSync(id);
}

export async function getProductById(
  id: number,
  skipLiveMerge: boolean = false,
): Promise<Product | undefined> {
  const product = await getCachedProductById(id);
  if (!product || skipLiveMerge) return product;

  const merged = await mergeLivePrices([product], "de");
  return merged[0];
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
    "v6",
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
    "v6",
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
    "v6",
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
    "v6",
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

export async function findProductSlugByAsinSuffix(
  oldSlug: string,
): Promise<string | undefined> {
  return getCachedProductSlugByAsinSuffix(oldSlug);
}

export async function findProductByParentAsinSuffix(
  slug: string,
): Promise<Product | undefined> {
  return getCachedProductByParentAsinSuffix(slug);
}

/**
 * ATOMIC PAGE DATA - The "Millisecond" Optimization
 * This function handles the entire data assembly for a PDP page in one cached block.
 * When a crawler hits multiple times, or metadata + page both need data, this returns instantly.
 */
export async function getPDPRenderData(
  slug: string,
  countryCode: string = "de",
) {
  "use cache";
  cacheLife("product");

  // 1. Resolve Product (ID-based, Slug-based, or Legacy)
  let product: Product | undefined;
  let isParentView = false;
  let redirect: string | null = null;
  let isPermanent = false;

  // ID-Based Routing (e.g. 900123456_-apple-iphone)
  const idMatch = slug.match(/^(\d+)_-(.*)$/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);
    if (id >= 900000000) {
      // Hub Mode
      product = await getCachedProductBySyntheticId(id);
      if (product) {
        // Singleton Check
        const variants = await getCachedProductVariantsInternal(
          product.parentAsin!,
          countryCode,
          true,
        );
        if (variants.length <= 1) {
          const realId = id - 900000000;
          const singletonProduct = { ...product, id: realId };
          const { slug: singletonSlug } = getFamilyIdentitySync(
            singletonProduct,
            variants,
          );
          redirect = `/p/${singletonSlug}`;
          isPermanent = product.enrichmentStatus === "optimized";
          product = undefined;
        } else {
          isParentView = true;
          const { slug: canonical } = getFamilyIdentitySync(product, variants);
          if (slug !== canonical) {
            redirect = `/p/${canonical}`;
            isPermanent = product.enrichmentStatus === "optimized";
          }
        }
      }
    } else {
      // Standard ID mode
      const realId = id >= 200000000 ? id - 200000000 : id;
      product = await getCachedProductById(realId);
      if (product) {
        const canonical = product.slug;
        if (slug !== canonical) {
          redirect = `/p/${canonical}`;
          isPermanent = product.enrichmentStatus === "optimized";
        }
      }
    }
  }

  // Fallback to Slug-based resolution if not found via ID
  if (!product && !redirect) {
    product = await getCachedProductBySlug(slug, false);
    if (product) {
      // Migrate to ID-based slug
      const { slug: newSlug } = getFamilyIdentitySync(product, []);
      redirect = `/p/${newSlug}`;
      isPermanent = true;
    } else {
      // Legacy ASIN/Parent Suffix checks
      const asinSlug = await getCachedProductSlugByAsinSuffix(slug);
      if (asinSlug && asinSlug !== slug) {
        redirect = `/p/${asinSlug}`;
        isPermanent = true;
      } else {
        product = await getCachedProductByParentAsinSuffix(slug);
        if (product) {
          product.isParentView = true;
          const { slug: newSlug } = getFamilyIdentitySync(product, []);
          redirect = `/p/${newSlug}`;
          isPermanent = true;
          product = undefined;
        }
      }
    }
  }

  if (!product && !redirect) return null;

  // 2. Fetch Dependent Data in Parallel
  let variants: Product[] = [];
  if (product && product.parentAsin) {
    variants = await getCachedProductVariantsInternal(
      product.parentAsin,
      countryCode,
      true,
    );
  }

  return {
    product,
    variants,
    isParentView,
    redirect,
    isPermanent,
  };
}

export async function findProductBySyntheticId(
  id: number,
): Promise<Product | undefined> {
  return getCachedProductBySyntheticId(id);
}
