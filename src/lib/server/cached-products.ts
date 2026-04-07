import { cacheLife, cacheTag } from "next/cache";
import { getCategoryBySlug } from "../categories";
import { type Product } from "../product-definitions";
import {
  getFamilyIdentity as getFamilyIdentitySync,
  getFamilyRepresentative,
} from "../product-families";
import {
  findProductByParentAsinSuffix as findProductByParentAsinSuffixSync,
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
import { getProductIdentity } from "../utils/product-identity";
import { getProductPath } from "../utils/url";
import {
  getLivePriceForProduct,
  mergeLivePrices,
  mergeLivePricesSelective,
} from "./live-data";

/**
 * --- PRIVATE CACHED DATA FETCHERS ---
 * These handle the "static" or long-term data like specs, images, and basic info.
 */

async function getCachedBestDeals(
  limit: number,
  countryCode: string,
  condition?: any,
  _version: string = "v214",
) {
  "use cache";
  cacheLife("category");
  return await getBestDealsSync(limit, countryCode, condition);
}

async function getCachedNewArrivals(
  limit: number,
  countryCode: string,
  condition?: any,
  _version: string = "v214",
) {
  "use cache";
  cacheLife("category");
  return await getNewArrivalsSync(limit, countryCode, condition);
}

async function getCachedDiverseMostPopular(
  itemsPerCategory: number,
  countryCode: string,
  _version: string = "v214",
) {
  "use cache";
  cacheLife("category");
  return await getDiverseMostPopularSync(itemsPerCategory, countryCode);
}

async function getCachedProductBySlug(
  slug: string,
  includeHistory: boolean,
  _version: string = "v214",
) {
  "use cache";
  cacheLife("product");
  return await getProductBySlugSync(slug, includeHistory);
}

async function getCachedProductById(id: number, _version: string = "v214") {
  "use cache";
  cacheLife("product");
  return await getProductByIdSync(id);
}

async function getCachedProductVariantsInternal(
  parentAsin: string,
  countryCode: string,
  skipFullMapping: boolean = false,
  _version: string = "v214",
) {
  "use cache";
  cacheLife("product");
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
  _version: string = "v214",
) {
  "use cache";
  cacheLife("product");
  // We call the sync version directly to avoid double wrapping
  return await getSimilarProductsSync(
    {
      category,
      slug: excludedSlug,
      prices: { [countryCode]: targetPrice },
    } as any,
    limit,
    countryCode,
  );
}

async function getCachedProductSlugByAsinSuffix(
  oldSlug: string,
  _version: string = "v214",
) {
  "use cache";
  cacheLife("category"); // Redirects can be cached for a long time
  return await findProductSlugByAsinSuffixSync(oldSlug);
}

async function getCachedProductByParentAsinSuffix(
  slug: string,
  _version: string = "v214",
) {
  "use cache";
  cacheLife("category");
  return await findProductByParentAsinSuffixSync(slug);
}

async function getCachedProductBySyntheticId(
  id: number,
  depth: number = 0,
  _version: string = "v217",
) {
  "use cache";
  cacheLife("product");
  // Safety: Prevent infinite recursion if canonical resolution loops
  if (depth > 5) {
    console.error(`[SEO CRITICAL] Infinite recursion detected for ID ${id}`);
    return undefined;
  }
  return await findProductBySyntheticIdSync(id, depth);
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

async function getCachedProductSlugs(
  limit?: number,
  includeVariants: boolean = false,
) {
  "use cache";
  cacheLife("product");
  cacheTag("sitemap-slugs");
  return getAllProductSlugsSync(limit, includeVariants);
}

/**
 * Cache Salt: Bump this to force a global flush of ALL product/sitemap metadata.
 */
export const GLOBAL_SALT = "v231-VARIANT-RESTORED-V1";

export async function getAllProductSlugs(
  _version: string = GLOBAL_SALT,
  includeVariants: boolean = true,
  fastMode: boolean = false,
): Promise<any[]> {
  const cachedFetch = async (v: boolean, f: boolean, salt: string) => {
    "use cache";
    cacheLife("product");
    cacheTag("sitemap-slugs", salt);
    // Bind the salt to the cache key
    const [_s] = [salt];
    return getAllProductSlugsSync(undefined, v, f);
  };
  return cachedFetch(includeVariants, fastMode, _version);
}

export async function getNonEmptyCategorySlugs(
  _version: string = "v217",
): Promise<string[]> {
  const cachedFetch = async () => {
    "use cache";
    cacheLife("category");
    const [_v] = [_version];
    return getNonEmptyCategorySlugsSync();
  };
  return cachedFetch();
}

/**
 * [SEO CONSISTENCY] Promotes all products in a list to the 900M+ Hub synthetic ID space.
 * This ensures that homepage, category, and sitemap URLs are perfectly aligned.
 */
function promoteListToHubIds(products: Product[]): Product[] {
  return products.map((p) => {
    if (!p.id || p.id >= 900000000) return p;
    // Synthetic ID strategy: 900M + (original ID % 100M)
    const promotedId = 900000000 + (p.id % 100000000);
    return { ...p, id: promotedId };
  });
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
    "v8",
  );
  return mergeLivePrices(promoteListToHubIds(products), countryCode);
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
    "v8",
  );
  return mergeLivePrices(promoteListToHubIds(products), countryCode);
}

export async function getDiverseMostPopular(
  itemsPerCategory: number = 10,
  countryCode: string = "de",
): Promise<Product[]> {
  const products = await getCachedDiverseMostPopular(
    itemsPerCategory,
    countryCode,
    "v8",
  );
  return mergeLivePrices(promoteListToHubIds(products), countryCode);
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
  return mergeLivePrices(promoteListToHubIds(products), countryCode);
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
export async function getPDPRenderData(
  slug: string,
  countryCode: string = "de",
  _version: string = GLOBAL_SALT,
) {
  "use cache";
  cacheLife("product");
  const [_salt] = [_version];
  cacheTag("pdp-" + _version, "pdp-" + slug, _salt);

  console.log(`[Cache Sync Check] Generating PDP for: ${slug} (Mode: ${_version})`);

  // 1. Resolve Product (ID-based, Slug-based, or Legacy)
  let product: Product | undefined;
  let isParentView = false;
  let redirect: string | null = null;
  let isPermanent = false;

  // ID-Based Routing (e.g. 900000XXX_-apple-iphone)
  const idMatch = slug.match(/^(\d+)_-(.*)$/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);
    
    // [SEO HARDENING] Standardize ID resolution logic
    const realId = id >= 900000000 ? id - 900000000 : id >= 200000000 ? id - 200000000 : id;

    if (id >= 900000000) {
      product = await getCachedProductBySyntheticId(id, 0);

      if (!product) {
        console.warn(`[SEO 404] Synthetic Hub ID ${id} not found: ${slug}`);
        return null;
      }

      // Resolve siblings and prices
      const rawVariants = await getCachedProductVariantsInternal(
        product.parentAsin || product.asin,
        countryCode,
        true,
      );
      
      const hubIden = getProductIdentity(product);
      const hubModelKey = (hubIden.modelTitle || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      const variants = rawVariants.filter(v => {
        const vIdx = getProductIdentity(v as any);
        return (vIdx.modelTitle || "").toLowerCase().replace(/[^a-z0-9]+/g, "") === hubModelKey;
      });

      const mergedAll = await mergeLivePrices([product, ...variants], countryCode, false);
      const rep = getFamilyRepresentative(mergedAll);
      let effectiveProduct = mergedAll[0];

      if (rep) {
        const liveData = await getLivePriceForProduct(rep.id!, countryCode, true);
        if (liveData?.history) {
          rep.priceHistory = liveData.history;
          const { calculateProductSavings } = await import("../utils/products");
          rep.savings = calculateProductSavings({
            price: rep.prices[countryCode] || 0,
            usedPrice: rep.usedPrices?.[countryCode] || 0,
            warehousePrice: rep.warehousePrices?.[countryCode] || 0,
            avg90: liveData.priceAvg90 || 0,
          });
        }
      }

      const canIdResult = await getCanonicalFamilyId(product.parentAsin || product.asin, product.id || 0, product.modelTitle);
      const canonicalId = 900000000 + (canIdResult % 100000000);
      const { slug: canonicalSlug } = getFamilyIdentitySync({ ...product, id: canonicalId, isParentView: true } as any, mergedAll);
      const targetPath = getProductPath(canonicalId, canonicalSlug);

      // Render or Redirect check
      if (`/p/${slug}` === targetPath) {
        return {
          product: effectiveProduct,
          variants: mergedAll.slice(1),
          isParentView: true,
          canonicalId,
          canonicalSlug,
          redirect: null,
          isPermanent: false,
          _v: "v228.1-STRICT-HUB-PARITY",
        };
      }

      return { redirect: targetPath, isPermanent: true };
    } else {
      // Standard ID mode (Variant or Legacy)
      product = await getCachedProductById(realId);
      if (product) {
        let variants = product.parentAsin
          ? await getCachedProductVariantsInternal(
              product.parentAsin,
              countryCode,
              true,
            )
          : [];

        // [SEO PARITY] Resolve the canonical Hub for metadata, but allow this specific variant page to exist for UX.
        // Google will see the rel="canonical" pointing to the Hub and consolidate signals accordingly.
        const hubIdVal = await getCanonicalFamilyId(product.parentAsin || product.asin, realId, product.modelTitle);
        const canonicalId = 900000000 + (hubIdVal % 100000000);
        const { slug: canonicalSlug } = getFamilyIdentitySync(
          { ...product, id: canonicalId, isParentView: true } as any, 
          [product, ...variants]
        );

        // [SLUG CORRECTION] 
        // We detect if the current URL is a variant (200M+) or a legacy/other ID.
        // If it's a variant, we ensure the slug is correct for that variant ID (200M+).
        // If it's legacy, we redirect to the Hub (900M+).
        const currentPrefix = parseInt(idMatch[1]);
        const isCurrentlyVariant = currentPrefix >= 200000000 && currentPrefix < 900000000;
        
        const selfIdentity = getFamilyIdentitySync(product, [product, ...variants]);
        const correctPath = getProductPath(product.id!, selfIdentity.slug, isCurrentlyVariant);
        
        if (`/p/${slug}` !== correctPath) {
          return {
            redirect: correctPath,
            isPermanent: true,
          };
        }

        return {
          product,
          variants,
          isParentView: false,
          canonicalId,
          canonicalSlug,
          redirect: null,
          isPermanent: false,
          _v: "v228.2-VARIANT-RENDER-ENABLED",
        };
      }
    }
  }

  // Fallback to Slug-based resolution (legacy / search results)
  if (!product) {
    product = await getCachedProductBySlug(slug, false);
    if (product) {
      const { slug: newSlug } = getFamilyIdentitySync(product, []);
      return { redirect: getProductPath(product.id, newSlug), isPermanent: true };
    } else {
      const asinSlug = await getCachedProductSlugByAsinSuffix(slug);
      if (asinSlug && asinSlug !== slug) {
        const tmpProd = await getCachedProductBySlug(asinSlug, false);
        return {
          product: tmpProd || (null as any),
          variants: [],
          category: null,
          isParentView: false,
          redirect: getProductPath(tmpProd?.id, asinSlug),
          isPermanent: true,
        };
      }
      product = await getCachedProductByParentAsinSuffix(slug);
      if (product) {
        const { slug: newSlug } = getFamilyIdentitySync(product, []);
        return {
          product,
          variants: [],
          category: null,
          isParentView: false,
          redirect: getProductPath(product.id, newSlug),
          isPermanent: true,
        };
      }
    }
  }

  if (!product) {
    if (idMatch) {
      const idValue = parseInt(idMatch[1]);
      if (idValue >= 200000000 && idValue < 1000000000) return null;
    }
    return null;
  }

  // Final catch-all for variants/slugs that aren't routed by ID above
  let v: Product[] = [];
  let category: any = null;

  if (product) {
    const results = await Promise.all([
      getCategoryBySlug(product.category),
      product.parentAsin
        ? getCachedProductVariantsInternal(product.parentAsin, countryCode, true)
        : Promise.resolve([]),
    ]);
    category = results[0];
    v = results[1] as Product[];
    const merged = await mergeLivePricesSelective([product, ...v], countryCode, true);
    product = merged[0];
    const variants = merged.slice(1);

    const hubIdVal = await getCanonicalFamilyId(product.parentAsin || product.asin, product.id || 0, product.modelTitle);
    const canonicalId = 900000000 + (hubIdVal % 100000000);
    const { slug: canonicalSlug } = getFamilyIdentitySync({ ...product, id: canonicalId, isParentView: true } as any, [product, ...variants]);

    // [SEO PARITY] Correct slug if needed for this specific variant
    const selfIdentity = getFamilyIdentitySync(product, [product, ...variants]);
    const correctSelfPath = getProductPath(product.id!, selfIdentity.slug);
    if (`/p/${slug}` !== correctSelfPath) {
      return {
        redirect: correctSelfPath,
        isPermanent: true,
      };
    }

    return {
      product: product || (null as any),
      variants,
      category,
      isParentView: (product?.id || 0) >= 900000000,
      canonicalId,
      canonicalSlug,
      redirect: null,
      isPermanent: false,
      _v: "v228.2-VARIANT-RENDER-ENABLED",
    };
  }

  return null;
}
