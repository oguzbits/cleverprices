import { cacheLife } from "next/cache";
import { cache } from "react";

import { dbReady } from "@/db";

import { getCategoryBySlug } from "../categories";
import { type UnitType } from "../category-types";
import { type PDPRenderData, type Product } from "../product-definitions";
import { getFamilyIdentity as getFamilyIdentitySync } from "../product-families";
import {
  findProductBySyntheticId as findProductBySyntheticIdSync,
  findProductSlugByAsinSuffix as findProductSlugByAsinSuffixSync,
  getAllProductSlugs,
  getCanonicalFamilyId,
  getNonEmptyCategorySlugs,
  getProductById as getProductByIdSync,
  getProductBySlug as getProductBySlugSync,
  getProductVariants as getProductVariantsSync,
  getSimilarProducts as getSimilarProductsSync,
} from "../product-registry";
import { getProductPath } from "../utils/url";
import { getCategoryProducts } from "./category-products";
import { mergeLivePrices } from "./live-data";

/**
 * --- PDP DATA ORCHESTRATION ---
 *
 * This file handles the data fetching for the Product Detail Page (PDP).
 * It uses a layered caching strategy to ensure fast TTFB while maintaining data freshness.
 */

// Local helpers to detect Next.js internal errors safely
function isNextNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { digest?: string; message?: string; $$typeof?: string };
  return Boolean(
    e?.digest?.includes?.("NEXT_NOT_FOUND") ||
      e?.message?.includes?.("NEXT_NOT_FOUND") ||
      e?.$$typeof === "next.not-found",
  );
}

function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { digest?: string; message?: string };
  return Boolean(
    e?.digest?.includes?.("NEXT_REDIRECT") ||
      e?.message?.includes?.("NEXT_REDIRECT"),
  );
}

/**
 * getPDPRenderData
 * The main orchestrator for PDP data.
 *
 * STRATEGY:
 * 1. This function is NOT wrapped in "use cache" at the top level to avoid monolithic failures.
 * 2. It calls individual "use cache" functions for different parts of the data.
 * 3. It handles redirects and 404s gracefully.
 */
export async function getPDPRenderData(
  slug: string,
  countryCode: string = "de",
): Promise<PDPRenderData | null> {
  try {
    // 1. Database Safety Guard (with timeout to prevent 500 timeouts)
    try {
      await Promise.race([
        dbReady,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DB_TIMEOUT")), 5000),
        ),
      ]);
    } catch (dbError) {
      console.warn(`[PDP DB WARNING] ${slug} (Proceeding anyway):`, dbError);
    }

    // 2. Resolve the main product
    const productData = await getCachedMainProduct(slug, countryCode);
    if (!productData) return null;

    // Handle redirects (checking if it's NOT null and HAS redirect)
    if ("redirect" in productData) {
      return productData as unknown as PDPRenderData;
    }

    const { product, isParentView } = productData as {
      product: Product;
      isParentView: boolean;
    };

    // 3. Parallel fetch of secondary data
    const [variantsRes, categoryRes, sidebarRes, carouselRes] =
      await Promise.allSettled([
        product.parentAsin
          ? getCachedVariants(product.parentAsin, countryCode)
          : Promise.resolve([]),
        getCategoryBySlug(product.category),
        getCachedSimilar(
          product.category,
          product.slug,
          product.prices[countryCode] || 0,
          10,
          countryCode,
        ),
        getCachedSimilar(
          product.category,
          product.slug,
          product.prices[countryCode] || 0,
          12,
          countryCode,
        ),
      ]);

    const variants =
      variantsRes.status === "fulfilled" ? variantsRes.value : [];
    const category =
      categoryRes.status === "fulfilled" ? categoryRes.value : null;
    const sidebar = sidebarRes.status === "fulfilled" ? sidebarRes.value : [];
    const carousel =
      carouselRes.status === "fulfilled" ? carouselRes.value : [];

    // 4. Live Price Merging (Freshness)
    let mergedProduct = product;
    try {
      const [fresh] = await mergeLivePrices([product], countryCode, true);
      if (fresh) mergedProduct = fresh;
    } catch (e) {
      console.warn(`[PDP Live Price Fallback] ${slug}:`, e);
    }

    // 5. Canonical & Identity Resolution
    let canonicalId = product.id || 0;
    let canonicalSlug = product.slug;

    try {
      const hubIdVal = await getCanonicalFamilyId(
        mergedProduct.parentAsin || mergedProduct.asin,
        mergedProduct.id || 0,
        mergedProduct.modelTitle,
      );
      const safeHubId =
        typeof hubIdVal === "number" ? hubIdVal : product.id || 0;
      canonicalId = 900000000 + (safeHubId % 100000000);

      const idenResult = getFamilyIdentitySync(
        { ...mergedProduct, id: canonicalId, isParentView: true } as Product,
        [mergedProduct, ...variants],
      );
      canonicalSlug = idenResult?.slug || product.slug;
    } catch (e) {
      console.warn(`[PDP Identity Error] ${slug}:`, e);
    }

    // 6. Final POJO Serialization (Bulletproof for RSC)
    return toSafePOJO({
      product: mergedProduct,
      variants: variants.filter(
        (v: Product) => v.id !== (mergedProduct as Product).id,
      ),
      category,
      similarSidebar: sidebar,
      similarCarousel: carousel,
      isParentView: isParentView || (mergedProduct.id || 0) >= 900000000,
      canonicalId,
      canonicalSlug,
      renderTimestamp: Date.now(),
    });
  } catch (error) {
    // Re-throw Next.js internal errors
    if (isNextNotFoundError(error) || isNextRedirectError(error)) throw error;

    console.error(`[PDP ORCHESTRATION FAILURE] ${slug}:`, error);
    return null;
  }
}

/**
 * --- INTERNAL CACHED FETCHERS ---
 * Using "use cache" for granular parts of the data.
 */

async function getCachedMainProduct(slug: string, _countryCode: string) {
  "use cache";
  cacheLife("minutes");

  try {
    let product: Product | undefined;
    let isParentView = false;
    const idMatch = slug.match(/^(\d+)_-(.*)$/);

    if (idMatch) {
      const id = parseInt(idMatch[1]);
      if (id >= 900000000) {
        product = await findProductBySyntheticIdSync(id, 0);
        if (product) isParentView = true;
      } else {
        const realId = id >= 200000000 ? id - 200000000 : id;
        product = await getProductByIdSync(realId);
      }
    }

    if (!product) {
      product = await getProductBySlugSync(slug, false);
      if (product) {
        const { slug: newSlug } = getFamilyIdentitySync(product, []);
        return {
          redirect: getProductPath(product.id, newSlug),
          isPermanent: true,
        };
      }
      const asinResult = await findProductSlugByAsinSuffixSync(slug);
      if (asinResult) {
        return {
          redirect: getProductPath(asinResult.id, asinResult.slug),
          isPermanent: true,
        };
      }
      return null;
    }

    // Canonical Path Check
    const idenResult = getFamilyIdentitySync(product, []);
    const canonicalSlug = idenResult?.slug || product.slug;
    const canonicalPath = getProductPath(product.id || 0, canonicalSlug);
    const urlSlug = canonicalPath.replace("/p/", "");

    if (slug !== urlSlug && !idMatch) {
      return { redirect: canonicalPath, isPermanent: true };
    }

    return { product: toSafePOJO(product), isParentView };
  } catch (e) {
    console.error(`[getCachedMainProduct Error] ${slug}:`, e);
    return null;
  }
}

async function getCachedVariants(parentAsin: string, countryCode: string) {
  "use cache";
  cacheLife("minutes");
  try {
    const vars = await getProductVariantsSync(
      { parentAsin } as Product,
      countryCode,
      true,
    );
    return vars.map((v: Product) => toSafePOJO(v));
  } catch (_e) {
    return [];
  }
}

async function getCachedSimilar(
  category: string,
  slug: string,
  price: number,
  limit: number,
  countryCode: string,
) {
  "use cache";
  cacheLife("minutes");
  try {
    const items = await getSimilarProductsSync(
      category,
      slug,
      price,
      limit,
      countryCode,
    );
    return items.map((v: Product) => toSafePOJO(v));
  } catch (_e) {
    return [];
  }
}

/**
 * toSafePOJO
 *
 * Ensures an object is a pure, serializable POJO for RSC.
 * It recursively strips non-serializable fields and handles circular references.
 */
function toSafePOJO<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  const seen = new WeakSet();

  const strip = (o: unknown): unknown => {
    if (!o || typeof o !== "object") return o;
    if (o instanceof Date) return o.toISOString();
    if (o instanceof Buffer) return null;
    if (typeof o === "function") return null;

    if (seen.has(o as object)) return null; // Prevent circular references
    seen.add(o as object);

    if (Array.isArray(o)) {
      return o.map(strip);
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(o as object)) {
      // Skip private keys, icons, large blobs, and Next.js internal props
      if (
        key === "historyJson" ||
        key === "icon" ||
        key.startsWith("_") ||
        key.startsWith("$$")
      ) {
        continue;
      }
      result[key] = strip(value);
    }
    return result;
  };

  try {
    return strip(obj) as T;
  } catch (_e) {
    console.error("[Serialization Deep Error]:", _e);
    // Absolute fallback: JSON cycle
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return null as unknown as T;
    }
  }
}

// --- SITEMAP & DISCOVERY EXPORTS ---
export { getAllProductSlugs, getNonEmptyCategorySlugs };

/**
 * Orchestrator for Category and Deals pages.
 * Fetches, filters, sorts and localizes products for a given category.
 * Uses toSafePOJO to ensure Next.js RSC serialization safety.
 */
export const getCategoryRenderData = cache(async function getCategoryRenderData(
  categorySlug: string,
  countryCode: string,
  filterParams: Record<string, string | string[] | undefined>,
) {
  try {
    const data = await getCategoryProducts(
      categorySlug,
      countryCode,
      filterParams,
    );

    // Ensure the entire tree is serializable for RSC
    return toSafePOJO(data);
  } catch (e) {
    console.error(`[Render Error] getCategoryRenderData failed:`, e);
    return toSafePOJO({
      products: [],
      totalCount: 0,
      filteredCount: 0,
      unitLabel: "TB" as UnitType,
      hasProducts: false,
      filters: {
        socket: [],
        cores: [],
        condition: [],
        brand: [],
      },
      filterCounts: {},
      minPriceInCategory: 0,
      maxPriceInCategory: 1000,
      priceRanges: [],
      lastUpdated: null,
      pagination: {
        currentPage: 1,
        totalPages: 0,
        pageSize: 24,
        totalItems: 0,
      },
    });
  }
});
