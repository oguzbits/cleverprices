import { cacheLife } from "next/cache";
import { cache } from "react";


import { type Category } from "../categories";

import { getCategoryBySlug, stripCategoryIcon } from "../categories";
import { type FilterParams, type Product } from "../product-definitions";
import { assertSerializable, serializeSafe } from "../utils/serialization";
import { getFamilyIdentity as getFamilyIdentitySync } from "../product-families";
import {
  findProductBySyntheticId as findProductBySyntheticIdSync,
  findProductSlugByAsinSuffix as findProductSlugByAsinSuffixSync,
  getAllProductSlugs as getAllProductSlugsSync,
  getBestDeals as getBestDealsSync,
  getCanonicalFamilyId,
  getDiverseMostPopular as getDiverseMostPopularSync,
  getNewArrivals as getNewArrivalsSync,
  getNonEmptyCategorySlugs as getNonEmptyCategorySlugsSync,
  getProductById as getProductByIdSync,
  getProductBySlug as getProductBySlugSync,
  getProductVariants as getProductVariantsSync,
  getSimilarProducts as getSimilarProductsSync,
} from "../product-registry";
import { getProductPath } from "../utils/url";
import { getCategoryProducts } from "./category-products";
import { mergeLivePrices, mergeLivePricesSelective } from "./live-data";

/**
 * --- PRIVATE CACHED DATA FETCHERS ---
 * These handle the "static" or long-term data like specs, images, and basic info.
 * Caching is TTL-only via cacheLife profiles — no tags, no manual salts.
 */

/**
 * getCategoryRenderData
 * Cached wrapper for category product retrieval.
 * Optimizes the most hit routes in the application.
 */
export async function getCategoryRenderData(
  categorySlug: string,
  countryCode: string,
  filterParams: FilterParams,
) {
  "use cache";
  // getCategoryProducts already calls serializeSafe, but we wrap it here too for double safety
  return serializeSafe(
    await getCategoryProducts(categorySlug, countryCode, filterParams),
  );
}

async function getCachedBestDeals(
  limit: number,
  countryCode: string,
  condition?: string | string[],
) {
  return await getBestDealsSync(
    limit,
    countryCode,
    condition as "New" | "Used" | "Renewed" | undefined,
  );
}

async function getCachedNewArrivals(
  limit: number,
  countryCode: string,
  condition?: string | string[],
) {
  return await getNewArrivalsSync(
    limit,
    countryCode,
    condition as "New" | "Used" | "Renewed" | undefined,
  );
}

async function getCachedDiverseMostPopular(
  itemsPerCategory: number,
  countryCode: string,
) {
  return await getDiverseMostPopularSync(itemsPerCategory, countryCode);
}

async function getCachedProductBySlug(slug: string, includeHistory: boolean) {
  return await getProductBySlugSync(slug, includeHistory);
}

async function getCachedProductById(id: number) {
  return await getProductByIdSync(id);
}

async function getCachedProductVariantsInternal(
  parentAsin: string,
  countryCode: string,
  skipFullMapping: boolean = false,
) {
  return await getProductVariantsSync(
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
  return await getSimilarProductsSync(
    {
      category,
      slug: excludedSlug,
      prices: { [countryCode]: targetPrice },
    } as Product,
    limit,
    countryCode,
  );
}

async function getCachedProductSlugByAsinSuffix(oldSlug: string) {
  return await findProductSlugByAsinSuffixSync(oldSlug);
}

async function getCachedProductBySyntheticId(id: number, depth: number = 0) {
  // Safety: Prevent infinite recursion if canonical resolution loops
  if (depth > 5) {
    console.error(`[SEO CRITICAL] Infinite recursion detected for ID ${id}`);
    return undefined;
  }
  return await findProductBySyntheticIdSync(id, depth);
}

async function getCachedNonEmptyCategorySlugs() {
  "use cache";
  cacheLife("hours");
  return getNonEmptyCategorySlugsSync();
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

export async function getAllProductSlugs(
  includeVariants: boolean = true,
  fastMode: boolean = false,
): Promise<
  {
    id: number;
    slug: string;
    category: string;
    enrichmentStatus?: string | null;
    updatedAt: string;
  }[]
> {
  return getAllProductSlugsSync(undefined, includeVariants, fastMode);
}

export async function getNonEmptyCategorySlugs(): Promise<string[]> {
  return getCachedNonEmptyCategorySlugs();
}

export async function getBestDeals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed" | ("New" | "Used" | "Renewed")[],
): Promise<Product[]> {
  const products = await getCachedBestDeals(limit, countryCode, condition);
  return mergeLivePrices(products, countryCode);
}

export async function getNewArrivals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed" | ("New" | "Used" | "Renewed")[],
): Promise<Product[]> {
  const products = await getCachedNewArrivals(limit, countryCode, condition);
  return mergeLivePrices(products, countryCode);
}

export async function getDiverseMostPopular(
  itemsPerCategory: number = 10,
  countryCode: string = "de",
): Promise<Product[]> {
  const products = await getCachedDiverseMostPopular(
    itemsPerCategory,
    countryCode,
  );
  return mergeLivePrices(products, countryCode);
}

export async function getSimilarProducts(
  product: Product,
  limit: number = 4,
  countryCode: string = "de",
): Promise<Product[]> {
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

/**
 * ATOMIC PAGE DATA - The "Millisecond" Optimization
 * This function handles the entire data assembly for a PDP page in one cached block.
 * When a crawler hits multiple times, or metadata + page both need data, this returns instantly.
 */
type PDPRenderData =
  | { redirect: string; isPermanent: boolean }
  | {
      product: Product;
      variants: Product[];
      category: any;
      similarSidebar: Product[];
      similarCarousel: Product[];
      isParentView: boolean;
      canonicalId: number;
      canonicalSlug: string;
    };

export const getPDPRenderData = cache(
  async (
    slug: string,
    countryInput: string = "de",
  ): Promise<PDPRenderData | null> => {
    const countryCode = countryInput.toLowerCase();


  // 1. Resolve Product (ID-based, Slug-based, or Legacy)
  let product: Product | undefined;
  let isParentView = false;
  let variants: Product[] = [];
  let category: Category | null = null;

  // ID-Based Routing (e.g. 200000XXX_-apple-iphone)
  const idMatch = slug.match(/^(\d+)_-(.*)$/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);
    if (id >= 900000000) {
      product = await getCachedProductBySyntheticId(id, 0);
      if (product) isParentView = true;
    } else {
      const realId = id >= 200000000 ? id - 200000000 : id;
      product = await getCachedProductById(realId);
      isParentView = false;
    }
  }

  // Fallback to Slug if no ID match found
  if (!product) {
    product = await getCachedProductBySlug(slug, false);
    if (product) {
      const { slug: newSlug } = getFamilyIdentitySync(product, []);
      return {
        redirect: getProductPath(product.id, newSlug),
        isPermanent: true,
      };
    }
    // ASIN Suffix check
    const asinResult = await getCachedProductSlugByAsinSuffix(slug);
    if (asinResult) {
      return {
        redirect: getProductPath(asinResult.id, asinResult.slug),
        isPermanent: true,
      };
    }
    return null;
  }

  // 2. Parallel Data Fetching (Variants + Category + Initial Residuals)
  const [catResult, variantsResult, sidebarResult, carouselResult] =
    await Promise.all([
      getCategoryBySlug(product.category),
      product.parentAsin
        ? getCachedProductVariantsInternal(
            product.parentAsin,
            countryCode,
            true,
          )
        : Promise.resolve([]),
      getCachedSimilarProducts(
        product.category,
        product.slug,
        product.prices[countryCode] || 0,
        5,
        countryCode,
      ),
      getCachedSimilarProducts(
        product.category,
        product.slug,
        product.prices[countryCode] || 0,
        12,
        countryCode,
      ),
    ]);

  category = (catResult || null) as Category | null;
  variants = variantsResult;

  // 3. Selective Price Merging (CRITICAL FOR PDP STABILITY)
  // We ONLY merge live prices for the main product in the blocking shell.
  // Variants, Sidebar, and Carousel products will use their cached prices
  // from the 'products' table. This drastically reduces DB locks and TTFB.
  // IdealoLivePrice will still hydrate the latest prices on the client.
  const [mergedProduct] = await mergeLivePrices(
    [product],
    countryCode,
    true, // Include history for the main product chart
  );

  if (!mergedProduct) {
    console.error(`[Data Error] Main product missing after merge for ${slug}`);
    return null;
  }

  // Use cached versions for the rest of the shell
  const mergedVariants = variants;
  const mergedSidebar = sidebarResult;
  const mergedCarousel = carouselResult;

  // 4. Identity & Canonical Resolution
  const hubIdVal = await getCanonicalFamilyId(
    mergedProduct.parentAsin || mergedProduct.asin,
    mergedProduct.id || 0,
    mergedProduct.modelTitle,
  );
  const canonicalId = 900000000 + (hubIdVal % 100000000);

  const { slug: canonicalSlug } = getFamilyIdentitySync(
    { ...mergedProduct, id: canonicalId, isParentView: true } as Product,
    [mergedProduct, ...mergedVariants],
  );

  // 5. Final Path Validation (Redirect if slug is wrong)
  const idValue = mergedProduct.id || 0;
  const isSynthetic = idValue >= 900000000;
  const canonicalPath = isSynthetic
    ? getProductPath(idValue, canonicalSlug)
    : getProductPath(idValue, mergedProduct.slug);

  const urlSlug = canonicalPath.replace("/p/", "");
  if (slug !== urlSlug && !idMatch) {
    return { redirect: canonicalPath, isPermanent: true };
  }

  return serializeSafe(
    assertSerializable(
      {
        product: mergedProduct,
        variants: mergedVariants,
        category: category ? (stripCategoryIcon(category) as any) : null,
        similarSidebar: mergedSidebar,
        similarCarousel: mergedCarousel,
        isParentView: isParentView || isSynthetic,
        canonicalId,
        canonicalSlug,
      } as PDPRenderData,
      "getPDPRenderData",
    ),
  );
}
);


