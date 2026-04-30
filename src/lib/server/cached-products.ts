import { cacheLife } from "next/cache";
import { cache } from "react";

import {
  getCategoryBySlug,
  stripCategoryIcon,
  type Category,
} from "../categories";
import { type FilterParams, type Product } from "../product-definitions";
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
import { mergeLivePrices } from "./live-data";

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
  return await getCategoryProducts(categorySlug, countryCode, filterParams);
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
      category: Category | null;
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

    try {
      // 1. Resolve Product (ID-based, Slug-based, or Legacy)
      let product: Product | undefined;
      let isParentView = false;
      const idMatch = slug.match(/^(\d+)_-(.*)$/);

      if (idMatch) {
        const id = parseInt(idMatch[1]);
        if (id >= 900000000) {
          product = await getCachedProductBySyntheticId(id, 0);
          if (product) isParentView = true;
        } else {
          const realId = id >= 200000000 ? id - 200000000 : id;
          product = await getCachedProductById(realId);
        }
      }

      if (!product) {
        product = await getCachedProductBySlug(slug, false);
        if (product) {
          const { slug: newSlug } = getFamilyIdentitySync(product, []);
          return {
            redirect: getProductPath(product.id, newSlug),
            isPermanent: true,
          };
        }
        const asinResult = await getCachedProductSlugByAsinSuffix(slug);
        if (asinResult) {
          return {
            redirect: getProductPath(asinResult.id, asinResult.slug),
            isPermanent: true,
          };
        }
        return null;
      }

      // 2. Data Enrichment (Non-Critical Parallel Fetches)
      // Wrap in independent try-catch to ensure one failure doesn't crash the page
      let category = null;
      let variants: Product[] = [];
      let sidebar: Product[] = [];
      let carousel: Product[] = [];

      try {
        const [catRes, varRes, sideRes, carRes] = await Promise.allSettled([
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

        category = catRes.status === "fulfilled" ? catRes.value : null;
        variants = varRes.status === "fulfilled" ? varRes.value : [];
        sidebar = sideRes.status === "fulfilled" ? sideRes.value : [];
        carousel = carRes.status === "fulfilled" ? carRes.value : [];
      } catch (e) {
        console.warn(`[PDP Enrichment Error] ${slug}:`, e);
      }

      // 3. Live Price Merging (Independent Fallback)
      let mergedProduct = product;
      try {
        const [fresh] = await mergeLivePrices([product], countryCode, true);
        if (fresh) mergedProduct = fresh;
      } catch (e) {
        console.warn(`[PDP Live Price Fallback] ${slug}:`, e);
      }

      // 4. Identity & Canonical Resolution
      let canonicalId: number = product.id || 0;
      let canonicalSlug = product.slug;
      try {
        const hubIdVal = await getCanonicalFamilyId(
          mergedProduct.parentAsin || mergedProduct.asin,
          mergedProduct.id || 0,
          mergedProduct.modelTitle,
        );
        canonicalId = 900000000 + (hubIdVal % 100000000);
        const { slug: cSlug } = getFamilyIdentitySync(
          { ...mergedProduct, id: canonicalId, isParentView: true } as Product,
          [mergedProduct, ...variants],
        );
        canonicalSlug = cSlug;
      } catch (e) {
        console.warn(`[PDP Identity Error] ${slug}:`, e);
      }

      // 5. Canonical Path Check
      const isSynthetic = (mergedProduct.id || 0) >= 900000000;
      const canonicalPath = isSynthetic
        ? getProductPath(mergedProduct.id || 0, canonicalSlug)
        : getProductPath(mergedProduct.id || 0, mergedProduct.slug);

      const urlSlug = canonicalPath.replace("/p/", "");
      if (slug !== urlSlug && !idMatch) {
        return { redirect: canonicalPath, isPermanent: true };
      }

      // Clean, Serializable POJO
      return {
        product: JSON.parse(JSON.stringify(mergedProduct)),
        variants: JSON.parse(JSON.stringify(variants)),
        category: category ? stripCategoryIcon(category) : null,
        similarSidebar: JSON.parse(JSON.stringify(sidebar)),
        similarCarousel: JSON.parse(JSON.stringify(carousel)),
        isParentView: isParentView || isSynthetic,
        canonicalId,
        canonicalSlug,
      };
    } catch (criticalError) {
      console.error(`[PDP CRITICAL FAILURE] ${slug}:`, criticalError);
      return null;
    }
  },
);
