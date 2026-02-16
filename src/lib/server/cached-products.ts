import { cacheLife } from "next/cache";
import { getCategoryBySlug } from "../categories";
import { type CountryCode } from "../countries";
import { dataAggregator } from "../data-sources";
import {
  getFamilyIdentity as getFamilyIdentitySync,
  getFamilyRepresentative,
} from "../product-families";
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
import { mergeLivePrices, mergeLivePricesSelective } from "./live-data";

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

  // ID-Based Routing (e.g. 200000XXX_-apple-iphone)
  const idMatch = slug.match(/^(\d+)_-(.*)$/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);
    if (id >= 900000000) {
      // Hub Mode
      product = await getCachedProductBySyntheticId(id);
      if (product) {
        if (product.slug === slug) {
          const variants = await getCachedProductVariantsInternal(
            product.parentAsin || product.asin,
            countryCode,
            true,
          );
          const merged = await mergeLivePricesSelective(
            [product, ...variants],
            countryCode,
            true,
          );

          let effectiveProduct = merged[0];
          const rep = getFamilyRepresentative(merged);
          if (rep && rep.id !== effectiveProduct.id) {
            effectiveProduct = {
              ...effectiveProduct,
              prices: rep.prices,
              priceHistory: rep.priceHistory,
              savings: rep.savings,
              pricesLastUpdated: rep.pricesLastUpdated,
              condition: rep.condition,
            };
          }

          return {
            product: effectiveProduct,
            variants: merged.filter((p) => p.id !== effectiveProduct.id),
            isParentView: true,
            redirect: null,
            isPermanent: false,
            // Add a salt to bust any stale caches from previous weeks
            _v: "v47-optimized",
          };
        }

        // Singleton or Canonical Mismatch Check
        const variants = await getCachedProductVariantsInternal(
          product.parentAsin!,
          countryCode,
          true,
        );
        if (variants.length <= 1) {
          const { slug: canonical } = getFamilyIdentitySync(
            { ...product, id: id - 900000000 },
            variants,
          );
          return { redirect: `/p/${canonical}`, isPermanent: true };
        } else {
          const { slug: canonical } = getFamilyIdentitySync(product, variants);
          if (slug !== canonical) {
            return {
              redirect: `/p/${canonical}`,
              isPermanent: product.enrichmentStatus === "optimized",
            };
          }
          isParentView = true;
        }
      }
    } else {
      // Standard ID mode
      const realId = id >= 200000000 ? id - 200000000 : id;
      product = await getCachedProductById(realId);
      if (product) {
        let variants = product.parentAsin
          ? await getCachedProductVariantsInternal(
              product.parentAsin,
              countryCode,
              true,
            )
          : [];

        const rep = getFamilyRepresentative([product, ...variants]) || product;
        const familyIdentity = getFamilyIdentitySync(rep, [
          product,
          ...variants,
        ]);
        const familySlugText =
          familyIdentity.slug.split("_-")[1] || familyIdentity.slug;

        const urlSlugText = slug.includes("_-") ? slug.split("_-")[1] : slug;
        const productSlugText = product.slug;

        const isFamilySlug = urlSlugText === familySlugText;
        const isSpecificSlug = urlSlugText === productSlugText;

        if (isFamilySlug && !isSpecificSlug) {
          let effectiveProduct =
            getFamilyRepresentative([product, ...variants]) || product;
          if (effectiveProduct.id !== product.id) {
            // It's a Hub Redirect: redirect directly to the canonical hub slug
            return { redirect: `/p/${familyIdentity.slug}`, isPermanent: true };
          }
        }

        // Check if current URL is the canonical id-prefixed specific slug
        const canonicalUrlSlug = product.slug.includes("_-")
          ? product.slug
          : `${200000000 + realId}_-${product.slug}`;
        if (slug !== canonicalUrlSlug) {
          return {
            redirect: `/p/${canonicalUrlSlug}`,
            isPermanent: product.enrichmentStatus === "optimized",
          };
        }

        // If we reach here, we have the correct product and correct slug
        const merged = await mergeLivePricesSelective(
          [product, ...variants],
          countryCode,
          true,
        );
        return {
          product: merged.find((p) => p.id === realId) || merged[0],
          variants: merged.filter((p) => p.id !== realId),
          isParentView: false,
          redirect: null,
          isPermanent: false,
          _v: "v47-optimized",
        };
      }
    }
  }

  // Fallback to Slug-based resolution if not found via ID pattern
  if (!product) {
    product = await getCachedProductBySlug(slug, false);
    if (product) {
      // Migrate immediately to ID-based slug
      const { slug: newSlug } = getFamilyIdentitySync(product, []);
      return { redirect: `/p/${newSlug}`, isPermanent: true };
    } else {
      // Legacy ASIN/Parent Suffix checks
      const asinSlug = await getCachedProductSlugByAsinSuffix(slug);
      if (asinSlug && asinSlug !== slug) {
        const fullNewSlug = asinSlug.includes("_-")
          ? asinSlug
          : await getCachedProductById(
              parseInt(asinSlug.match(/\d+/)?.toString() || "0"),
            ).then((p) => (p ? getFamilyIdentitySync(p, []).slug : asinSlug));
        return { redirect: `/p/${fullNewSlug}`, isPermanent: true };
      }
      product = await getCachedProductByParentAsinSuffix(slug);
      if (product) {
        const { slug: newSlug } = getFamilyIdentitySync(product, []);
        return { redirect: `/p/${newSlug}`, isPermanent: true };
      }
    }
  }

  if (!product) return null;

  // 2. Fetch Dependent Data in Parallel (Only if still here)
  let variants: Product[] = [];
  let category: any = null;

  if (product) {
    const results = await Promise.all([
      getCategoryBySlug(product.category),
      product.parentAsin
        ? getCachedProductVariantsInternal(
            product.parentAsin,
            countryCode,
            true,
          )
        : Promise.resolve([]),
    ]);
    category = results[0];
    const v = results[1] as Product[];

    // Ensure PDP is fresh (Prices + History)
    const merged = await mergeLivePricesSelective(
      [product, ...v],
      countryCode,
      true,
    );
    product = merged[0];
    variants = merged.slice(1);

    // If falling back to parent view logic (e.g. via slug resolution), apply representative logic too
    if (isParentView) {
      const rep = getFamilyRepresentative(merged);
      if (rep && rep.id !== product.id) {
        product = {
          ...product,
          prices: rep.prices,
          priceHistory: rep.priceHistory,
          savings: rep.savings,
          pricesLastUpdated: rep.pricesLastUpdated,
          condition: rep.condition,
        };
      }
    }
  }

  return {
    product: product!,
    variants,
    category,
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
