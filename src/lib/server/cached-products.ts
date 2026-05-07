import { type CategorySlug, getCategoryBySlug } from "../categories";
import { type UnitType } from "../category-types";
import { type PDPRenderData, type Product } from "../product-definitions";
import { getFamilyIdentity as getFamilyIdentitySync } from "../product-families";
import {
  fetchSimilarProducts,
  findProductBySyntheticId as findProductBySyntheticIdSync,
  findProductSlugByAsinSuffix as findProductSlugByAsinSuffixSync,
  getAllProductSlugs,
  getCanonicalFamilyId,
  getNonEmptyCategorySlugs,
  getProductById as getProductByIdSync,
  getProductBySlug as getProductBySlugSync,
  getProductVariants as getProductVariantsSync,
} from "../product-registry";
import { CACHE_VERSION } from "../site-config";
import { getProductPath } from "../utils/url";
import { getCategoryProducts } from "./category-products";
import {
  getLivePricesForProducts,
  mergeLivePricesSelective,
} from "./live-data";

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
 */
export async function getPDPRenderData(
  slug: string,
  countryCode: string = "de",
): Promise<PDPRenderData | null> {
  // Temporarily disabled "use cache" to stabilize 500 errors on cold starts
  // "use cache";
  // cacheLife("minutes");

  try {
    // 1. Database Safety Guard
    const { dbReady } = await import("../../db");
    await dbReady;

    // 2. Resolve the main product
    const productData = await getCachedMainProduct(slug, countryCode);
    if (!productData) return null;

    // Handle redirects
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
          product.prices?.[countryCode] || 0,
          10,
          countryCode,
        ),
        getCachedSimilar(
          product.category,
          product.slug,
          product.prices?.[countryCode] || 0,
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

    // 4. Live Price Merging (Freshness) - Wrapped in try/catch to ensure availability
    let mergedProduct = product;
    let mergedVariants = variants;
    let mergedSidebar = sidebar;
    let mergedCarousel = carousel;

    try {
      // BATCH ALL PRODUCTS for live price merging (Rule: main.md)
      const allToMerge = [product, ...variants, ...sidebar, ...carousel];
      const mergedAll = await mergeLivePricesSelective(
        allToMerge,
        countryCode,
        true,
      );

      mergedProduct = mergedAll[0] || product;
      let offset = 1;

      mergedVariants = mergedAll.slice(offset, offset + variants.length);
      offset += variants.length;

      mergedSidebar = mergedAll.slice(offset, offset + sidebar.length);
      offset += sidebar.length;

      mergedCarousel = mergedAll.slice(offset, offset + carousel.length);
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

    // 6. Final POJO Serialization
    return toSafePOJO({
      product: mergedProduct,
      variants: mergedVariants.filter(
        (v: Product) => v.id !== (mergedProduct as Product).id,
      ),
      category: category ?? null,
      similarSidebar: mergedSidebar,
      similarCarousel: mergedCarousel,
      isParentView: isParentView || (mergedProduct.id || 0) >= 900000000,
      canonicalId,
      canonicalSlug,
      now: Date.now(),
    });
  } catch (error) {
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
  // "use cache";
  // cacheLife("minutes");

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
      if (product && product.id) {
        const { slug: newSlug } = getFamilyIdentitySync(product, []);
        // Redirect to HUB (900M prefix) for slug-only URLs to centralize indexation
        const hubId = 900000000 + (product.id % 100000000);
        return {
          redirect: getProductPath(hubId, newSlug),
          isPermanent: true,
        };
      }
      const asinResult = await findProductSlugByAsinSuffixSync(slug);
      if (asinResult && asinResult.id) {
        const hubId = 900000000 + (asinResult.id % 100000000);
        return {
          redirect: getProductPath(hubId, asinResult.slug),
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
  // "use cache";
  // cacheLife("minutes");
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
  // "use cache";
  // cacheLife("minutes");
  try {
    const items = await fetchSimilarProducts(
      category,
      slug,
      price,
      limit,
      countryCode,
    );
    return items.map((v: Product) => toSafePOJO(v));
  } catch (e) {
    console.warn(`[getCachedSimilar Error] ${category}:`, e);
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
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;

  const seen = new WeakSet();

  const strip = (o: unknown, depth = 0): unknown => {
    if (depth > 10) return null; // Safety cap for deep trees
    if (o === null || o === undefined || typeof o !== "object") {
      if (typeof o === "bigint") return Number(o); // Handle BigInt
      return o;
    }
    if (o instanceof Date) return o.toISOString();
    if (o instanceof Buffer) return null;
    if (typeof o === "function") return null;

    // Handle Map and Set for serialization safety
    if (o instanceof Map) {
      const res: Record<string, unknown> = {};
      for (const [key, val] of o.entries()) {
        res[String(key)] = strip(val, depth + 1);
      }
      return res;
    }
    if (o instanceof Set) {
      return Array.from(o).map((v) => strip(v, depth + 1));
    }

    if (seen.has(o as object)) return null; // Prevent circular references
    seen.add(o as object);

    if (Array.isArray(o)) {
      return o.map((v) => strip(v, depth + 1));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(o as object)) {
      // Skip private keys, icons, large blobs, and Next.js internal props
      if (
        key === "historyJson" ||
        key === "icon" ||
        key.startsWith("_") ||
        key.startsWith("$$") ||
        key === "query" // SQLite query objects
      ) {
        continue;
      }
      result[key] = strip(value, depth + 1);
    }
    return result;
  };

  try {
    return strip(obj) as T;
  } catch (_e) {
    console.error("[Serialization Deep Error]:", _e);
    // Absolute fallback: shallow clone if deep fails
    try {
      return JSON.parse(
        JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? Number(v) : v)),
      );
    } catch {
      return (Array.isArray(obj) ? [] : {}) as unknown as T;
    }
  }
}

// --- SITEMAP & DISCOVERY EXPORTS ---
export async function getCachedNonEmptyCategorySlugs(): Promise<string[]> {
  // "use cache";
  // cacheLife("minutes");
  return getNonEmptyCategorySlugs();
}

export { getAllProductSlugs };

/**
 * Orchestrator for Category and Deals pages.
 */
export async function getCategoryRenderData(
  categorySlug: string,
  countryCode: string,
  filterParams: Record<string, string | string[] | undefined>,
) {
  const _start = Date.now();
  console.log(`[Category Render Start] ${categorySlug} (${countryCode})`);

  try {
    const { dbReady } = await import("../../db");
    await dbReady;

    const data = await getCategoryProducts(
      categorySlug,
      countryCode,
      filterParams,
    );
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
}

/**
 * High-level orchestrator for category routes to prevent bailouts.
 */
export async function getCategoryOrchestrationData(categorySlug: string) {
  console.log(`[Category Orchestration Start] ${categorySlug}`);
  try {
    const { dbReady } = await import("../../db");
    await dbReady;

    const [category, nonEmptySlugs] = await Promise.all([
      getCategoryBySlug(categorySlug),
      getNonEmptyCategorySlugs(),
    ]);

    return toSafePOJO({
      category,
      nonEmptySlugs,
    });
  } catch (e) {
    console.error(`[Orchestration Error] category ${categorySlug}:`, e);
    return toSafePOJO({
      category: null,
      nonEmptySlugs: [],
    });
  }
}

/**
 * Orchestrator for Parent Category Hub pages.
 */
export async function getCachedParentCategoryData(
  categorySlug: string,
  countryCode: string = "de",
) {
  // "use cache";
  // cacheLife("minutes");

  try {
    const { getParentCategoryData } =
      await import("../data/parentCategoryData");
    const data = await getParentCategoryData(
      categorySlug as CategorySlug,
      countryCode,
    );

    return toSafePOJO(data);
  } catch (e) {
    console.error(`[Parent Category Error] ${categorySlug}:`, e);
    return null;
  }
}

/**
 * Cached version of live price fetching for batch operations (e.g., Home Page).
 * Uses Record instead of Map for cache serialization compatibility.
 */
export async function getCachedLivePrices(
  productIds: number[],
  countryCode: string,
) {
  // "use cache";
  // cacheLife("minutes");
  const _v = CACHE_VERSION;

  const priceMap = await getLivePricesForProducts(productIds, countryCode);
  return Object.fromEntries(priceMap.entries());
}
