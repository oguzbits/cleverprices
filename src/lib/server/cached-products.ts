import { cacheLife } from "next/cache";
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
 * Caching is TTL-only via cacheLife profiles — no tags, no manual salts.
 */

async function getCachedBestDeals(
  limit: number,
  countryCode: string,
  condition?: any,
) {
  "use cache";
  cacheLife("category");
  const _v = "v249"; // Hidden Cache Buster
  return await getBestDealsSync(limit, countryCode, condition);
}

async function getCachedNewArrivals(
  limit: number,
  countryCode: string,
  condition?: any,
) {
  "use cache";
  cacheLife("category");
  const _v = "v249"; // Hidden Cache Buster
  return await getNewArrivalsSync(limit, countryCode, condition);
}

async function getCachedDiverseMostPopular(
  itemsPerCategory: number,
  countryCode: string,
) {
  "use cache";
  cacheLife("category");
  const _v = "v249"; // Hidden Cache Buster
  return await getDiverseMostPopularSync(itemsPerCategory, countryCode);
}

async function getCachedProductBySlug(slug: string, includeHistory: boolean) {
  "use cache";
  cacheLife("product_v5");
  const _v = "v249"; // Hidden Cache Buster
  return await getProductBySlugSync(slug, includeHistory);
}

async function getCachedProductById(id: number) {
  "use cache";
  cacheLife("product_v5");
  const _v = "v249"; // Hidden Cache Buster
  return await getProductByIdSync(id);
}

async function getCachedProductVariantsInternal(
  parentAsin: string,
  countryCode: string,
  skipFullMapping: boolean = false,
) {
  "use cache";
  cacheLife("product_v5");
  const _v = "v249"; // Hidden Cache Buster
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
  "use cache";
  cacheLife("product_v5");
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

async function getCachedProductSlugByAsinSuffix(oldSlug: string) {
  "use cache";
  cacheLife("category"); // Redirects can be cached for a long time
  return await findProductSlugByAsinSuffixSync(oldSlug);
}

async function getCachedProductByParentAsinSuffix(slug: string) {
  "use cache";
  cacheLife("category");
  return await findProductByParentAsinSuffixSync(slug);
}

async function getCachedProductBySyntheticId(id: number, depth: number = 0) {
  "use cache";
  cacheLife("product_v5");
  // Safety: Prevent infinite recursion if canonical resolution loops
  if (depth > 5) {
    console.error(`[SEO CRITICAL] Infinite recursion detected for ID ${id}`);
    return undefined;
  }
  return await findProductBySyntheticIdSync(id, depth);
}

async function getCachedNonEmptyCategorySlugs() {
  "use cache";
  cacheLife("category");
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
): Promise<any[]> {
  "use cache";
  cacheLife("static");
  return getAllProductSlugsSync(undefined, includeVariants, fastMode);
}

export async function getNonEmptyCategorySlugs(): Promise<string[]> {
  return getCachedNonEmptyCategorySlugs();
}

export async function getBestDeals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: any,
): Promise<Product[]> {
  const products = await getCachedBestDeals(limit, countryCode, condition);
  return mergeLivePrices(products, countryCode);
}

export async function getNewArrivals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: any,
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
export async function getPDPRenderData(
  slug: string,
  countryInput: string = "de",
) {
  "use cache";
  const _v = "v248"; // Global Schema Flush
  const countryCode = countryInput.toLowerCase();
  cacheLife("product_v5");

  // 1. Resolve Product (ID-based, Slug-based, or Legacy)
  let product: Product | undefined;
  let isParentView = false;
  const redirect: string | null = null;
  const isPermanent = false;

  // ID-Based Routing (e.g. 200000XXX_-apple-iphone)
  const idMatch = slug.match(/^(\d+)_-(.*)$/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);
    if (id >= 900000000) {
      product = await getCachedProductBySyntheticId(id, 0);

      if (!product) {
        console.warn(`[SEO 404] Synthetic Hub ID ${id} not found: ${slug}`);
        return null;
      }

      if (product) {
        // Resolve siblings and prices
        const rawVariants = await getCachedProductVariantsInternal(
          product.parentAsin || product.asin,
          countryCode,
          true,
        );
        const identity = getProductIdentity(product);
        const hubModelKey = (identity.modelTitle || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");
        const variants = rawVariants.filter((v: Product) => {
          const vIdx = getProductIdentity(v);
          return (
            (vIdx.modelTitle || "").toLowerCase().replace(/[^a-z0-9]+/g, "") ===
            hubModelKey
          );
        });

        const mergedAll = await mergeLivePrices(
          [product, ...variants],
          countryCode,
          false,
        );
        const rep = getFamilyRepresentative(mergedAll);
        let effectiveProduct = mergedAll[0];

        if (rep) {
          const liveData = await getLivePriceForProduct(
            rep.id!,
            countryCode,
            true,
          );
          if (liveData?.history) {
            rep.priceHistory = liveData.history;
            const { calculateProductSavings } =
              await import("../utils/products");
            rep.savings = calculateProductSavings({
              price: rep.prices[countryCode] || 0,
              usedPrice: rep.usedPrices?.[countryCode] || 0,
              warehousePrice: rep.warehousePrices?.[countryCode] || 0,
              avg90: liveData.priceAvg90 || 0,
            });
          }
        }

        const canIdResult = await getCanonicalFamilyId(
          product.parentAsin || product.asin,
          product.id || 0,
          product.modelTitle,
        );
        const canonicalId = 900000000 + (canIdResult % 100000000);
        const { slug: canonicalSlug } = getFamilyIdentitySync(
          { ...product, id: canonicalId, isParentView: true } as any,
          mergedAll,
        );

        // Final Hub Enrichment: Inherit best data from family representative
        if (rep && rep.id !== effectiveProduct.id) {
          effectiveProduct = {
            ...effectiveProduct,
            prices: rep.prices,
            priceHistory: rep.priceHistory,
            savings: rep.savings,
            pricesLastUpdated: rep.pricesLastUpdated,
            condition: rep.condition,
            image: rep.image || effectiveProduct.image,
            imageUrl: rep.imageUrl || effectiveProduct.imageUrl,
          };
        }

        return {
          product: effectiveProduct,
          variants: mergedAll.slice(1),
          isParentView: true,
          canonicalId,
          canonicalSlug,
          redirect: null,
          isPermanent: false,
        };
      }
    } else {
      // Standard ID mode (Variant)
      const id = parseInt(idMatch[1]);
      const realId = id >= 200000000 ? id - 200000000 : id;
      product = await getCachedProductById(realId);
      if (product) {
        const rawVariants = product.parentAsin
          ? await getCachedProductVariantsInternal(
              product.parentAsin,
              countryCode,
              true,
            )
          : [];

        const identity = getProductIdentity(product);
        const targetModelKey = (identity.modelTitle || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");

        const variants = rawVariants.filter((v: Product) => {
          const vIdx = getProductIdentity(v);
          return (
            (vIdx.modelTitle || "").toLowerCase().replace(/[^a-z0-9]+/g, "") ===
            targetModelKey
          );
        });

        const rep = getFamilyRepresentative([product, ...variants]) || product;
        const familyIdentity = getFamilyIdentitySync(
          { ...rep, id: 900000000 + (rep.id || 0), isParentView: true },
          [product, ...variants],
        );
        const canonicalFamilySlug = familyIdentity.slug;
        const canonicalProductSlug = product.slug;

        const familySlugText =
          canonicalFamilySlug.split("_-")[1] || canonicalFamilySlug;
        const productSlugText =
          canonicalProductSlug.split("_-")[1] || canonicalProductSlug;
        const urlSlugText = slug.includes("_-") ? slug.split("_-")[1] : slug;

        const isFamilySlug = urlSlugText === familySlugText;
        const isSpecificSlug = urlSlugText === productSlugText;

        if (isFamilySlug && !isSpecificSlug) {
          const eff =
            getFamilyRepresentative([product, ...variants]) || product;
          if (eff.id !== product.id) {
            return {
              redirect: getProductPath(
                900000000 + (rep.id || 0),
                familyIdentity.slug,
              ),
              isPermanent: true,
            };
          }
        }

        const canonicalPath = getProductPath(product.id!, product.slug);
        const urlSlug = canonicalPath.replace("/p/", "");

        if (slug !== urlSlug) {
          return { redirect: canonicalPath, isPermanent: true };
        }

        const merged = await mergeLivePricesSelective(
          [product, ...variants],
          countryCode,
          true,
        );
        const hubIdVal = await getCanonicalFamilyId(
          product.parentAsin || product.asin,
          product.id || 0,
          product.modelTitle,
        );

        // GSC Fix: Promote EVERY canonical target to a Hub ID (900M) for Sitemap Parity.
        // Standalone products (orphans) become "Hubs of one" to ensure a consistent URL strategy.
        const canonicalId = 900000000 + (hubIdVal % 100000000);

        const { slug: canonicalSlug } = getFamilyIdentitySync(
          {
            ...product,
            id: canonicalId,
            isParentView: true, // Force Hub view for all canonical targets
          } as any,
          [product, ...variants],
        );

        let renderProduct = merged.find((p) => p.id === realId) || merged[0];

        // Variant Check: We do NOT enrich variants with Hub data to preserve individual variations (images/specs)
        if (id >= 200000000 && id < 900000000) {
          isParentView = false;
        }

        return {
          product: renderProduct,
          variants: merged.filter((p) => p.id !== realId),
          isParentView: false, // Explicitly false for matched Variant IDs
          canonicalId,
          canonicalSlug,
          redirect: null,
          isPermanent: false,
        };
      }
    }
  }

  // Fallback to Slug-based resolution
  if (!product) {
    product = await getCachedProductBySlug(slug, false);
    if (product) {
      const { slug: newSlug } = getFamilyIdentitySync(product, []);
      return {
        redirect: getProductPath(product.id, newSlug),
        isPermanent: true,
      };
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

  // Parallel Fetch for residuals
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
    const merged = await mergeLivePricesSelective(
      [product, ...v],
      countryCode,
      true,
    );
    product = merged[0];
    variants = merged.slice(1);

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
          image: rep.image || product.image,
          imageUrl: rep.imageUrl || product.imageUrl,
        };
      }
    }

    // EXTRA SECURITY: Even in fallback paths, explicitly block isParentView for 200M/700M IDs
    const idValue = product.id || 0;
    if (idValue >= 200000000 && idValue < 900000000) {
      isParentView = false;
    }
  }

  const hubIdVal = await getCanonicalFamilyId(
    product.parentAsin || product.asin,
    product.id || 0,
    product.modelTitle,
  );
  const canonicalId = 900000000 + (hubIdVal % 100000000);
  const { slug: canonicalSlug } = getFamilyIdentitySync(
    { ...product, id: canonicalId, isParentView: true } as any,
    [product, ...variants],
  );

  return {
    product: product || (null as any),
    variants,
    category,
    isParentView, // Use the strictly calculated local variable
    canonicalId,
    canonicalSlug,
    redirect,
    isPermanent,
  };
}
