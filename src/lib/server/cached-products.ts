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
  _version: string = "v215",
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

export async function getAllProductSlugs(
  limit?: number,
  includeVariants: boolean = false,
): Promise<
  {
    id: number;
    slug: string;
    category: string;
    enrichmentStatus?: string | null;
    updatedAt: Date;
  }[]
> {
  return getCachedProductSlugs(limit, includeVariants);
}

export async function getNonEmptyCategorySlugs(
  _version: string = "v214",
): Promise<string[]> {
  const cachedFetch = async () => {
    "use cache";
    cacheLife("category");
    const [_v] = [_version];
    return getNonEmptyCategorySlugsSync();
  };
  return cachedFetch();
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
    "v8",
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
    "v8",
  );
  return mergeLivePrices(products, countryCode);
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

/**
 * ATOMIC PAGE DATA - The "Millisecond" Optimization
 * This function handles the entire data assembly for a PDP page in one cached block.
 * When a crawler hits multiple times, or metadata + page both need data, this returns instantly.
 */
export async function getPDPRenderData(
  slug: string,
  countryCode: string = "de",
  _version: string = "v214",
) {
  "use cache";
  cacheLife("product");
  const _v = "v80-unified-flow";

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
      product = await getCachedProductBySyntheticId(id, 0);

      if (!product) {
        console.warn(`[SEO 404] Synthetic Hub ID ${id} not found: ${slug}`);
        return null;
      }

      // TRACE: Product 5301 has been causing hangs/timeouts in sitemap audit.
      const isTargetTrack =
        id === 900005301 ||
        (product.id && product.id >= 200005301 && product.id <= 200005304);
      if (isTargetTrack) {
        console.log(
          `[TRACE 5301] Rendering Hub/Product ${id} with slug ${slug}`,
        );
      }
      if (product) {
        // Strict slug check for Hubs: ensure the text part matches the canonical version
        const isSlugMatch = product.slug === slug;

        if (id === 900003105) {
          console.log(
            `[TRACE 3105 Hub] URL Slug: ${slug}, Canonical Slug: ${product.slug}, Match: ${isSlugMatch}`,
          );
        }

        if (isSlugMatch) {
          const rawVariants = await getCachedProductVariantsInternal(
            product.parentAsin || product.asin,
            countryCode,
            true, // isLean
          );

          // 1. Filter variants by series (modelTitle) to avoid mixing e.g. ASUS Prime and ROG Strix
          const hubIdentity = getProductIdentity(product);
          const hubModelKey = (hubIdentity.modelTitle || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "");

          const variants = rawVariants.filter((v) => {
            const vIden = getProductIdentity(v as any);
            const vModelKey = (vIden.modelTitle || "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "");
            return vModelKey === hubModelKey;
          });

          // 1. Merge prices for all (No history yet)
          const mergedAll = await mergeLivePrices(
            [product, ...variants],
            countryCode,
            false,
          );

          // 2. Identify the TRUE representative (cheapest) from live data
          const rep = getFamilyRepresentative(mergedAll);
          let effectiveProduct = mergedAll[0];

          // 3. Fetch History for the chosen representative
          // This ensures the chart on the Hub page reflects the cheapest variant
          if (rep) {
            const liveData = await getLivePriceForProduct(
              rep.id!,
              countryCode,
              true, // includeHistory
            );

            if (liveData?.history) {
              // Sync history to both the rep and the effective Hub product
              rep.priceHistory = liveData.history;

              // Recalculate savings/metrics for rep if history updated
              const { calculateProductSavings } =
                await import("../utils/products");
              rep.savings = calculateProductSavings({
                price: rep.prices[countryCode] || 0,
                usedPrice: rep.usedPrices?.[countryCode] || 0,
                warehousePrice: rep.warehousePrices?.[countryCode] || 0,
                avg90: liveData.priceAvg90 || 0,
              });
            } else if (effectiveProduct.priceHistory) {
              // Fallback to history already in effectiveProduct if live fetch failed
              rep.priceHistory = effectiveProduct.priceHistory;
            }
          }

          // 4. Resolve the STABLE canonical ID
          const canonicalId = await getCanonicalFamilyId(
            product.parentAsin,
            product.id || 0,
            product.modelTitle,
          );

          // 5. Align Hub product with Representative metadata
          if (rep && rep.id !== effectiveProduct.id) {
            effectiveProduct = {
              ...effectiveProduct,
              prices: rep.prices,
              priceHistory: rep.priceHistory,
              savings: rep.savings,
              pricesLastUpdated: rep.pricesLastUpdated,
              condition: rep.condition,
            };
          } else if (rep) {
            // Even if same product, ensure history is attached
            effectiveProduct.priceHistory = rep.priceHistory;
          }

          return {
            product: effectiveProduct,
            variants: mergedAll.slice(1),
            isParentView: true,
            canonicalId,
            redirect: null,
            isPermanent: false,
            // Add a salt to bust any stale caches
            _v: "v73-stable-hub-id",
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
          return { redirect: getProductPath(id, canonical), isPermanent: true };
        } else {
          const { slug: canonical } = getFamilyIdentitySync(product, variants);
          if (slug !== canonical) {
            return {
              redirect: getProductPath(product.id, canonical),
              isPermanent: true,
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
        const familyIdentity = getFamilyIdentitySync(
          { ...rep, id: 900000000 + (rep.id || 0), isParentView: true },
          [product, ...variants],
        );
        // We use the stable slugs already computed with full sibling access via mapDbProduct
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
          let effectiveProduct =
            getFamilyRepresentative([product, ...variants]) || product;
          if (effectiveProduct.id !== product.id) {
            // It's a Hub Redirect: redirect directly to the canonical hub slug
            return {
              redirect: getProductPath(
                900000000 + (rep.id || 0),
                familyIdentity.slug,
              ),
              isPermanent: true,
            };
          }
        }

        // Check if current URL is the canonical id-prefixed specific slug
        // We use the already fully consensus-aware slug from mapDbProduct.
        const canonicalFullSlug = product.slug;
        const canonicalPath = getProductPath(product.id!, canonicalFullSlug);
        const urlSlugWithoutLeadingSlash = canonicalPath.replace("/p/", "");

        if (slug !== urlSlugWithoutLeadingSlash) {
          return {
            redirect: canonicalPath,
            isPermanent: true,
          };
        }

        // If we reach here, we have the correct product and correct slug
        const merged = await mergeLivePricesSelective(
          [product, ...variants],
          countryCode,
          true,
        );
        // 5. Resolve the STABLE canonical ID for the Hub
        const hubId = await getCanonicalFamilyId(
          product.parentAsin,
          product.id || 0,
          product.modelTitle,
        );
        const canonicalId = 900000000 + (hubId % 100000000);

        return {
          product: merged.find((p) => p.id === realId) || merged[0],
          variants: merged.filter((p) => p.id !== realId),
          isParentView: false,
          canonicalId,
          redirect: null,
          isPermanent: false,
          _v: "v49-optimized",
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
      return {
        redirect: getProductPath(product.id, newSlug),
        isPermanent: true,
      };
    } else {
      // Legacy ASIN/Parent Suffix checks (REPAIRING: Ensure we redirect to ID-prefixed canonical)
      const asinSlug = await getCachedProductSlugByAsinSuffix(slug);
      if (asinSlug && asinSlug !== slug) {
        // Resolve the ID if possible to get a fully-prefixed URL
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
      // If it looks like a canonical ID but is not in our DB, it's a hard 404
      if (idValue >= 200000000 && idValue < 1000000000) {
        console.warn(`[SEO 404] Canonical ID not in DB: ${slug}`);
        return null;
      }
    }
    return null;
  }

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
    product: product || (null as any),
    variants,
    category,
    isParentView,
    redirect,
    isPermanent,
    _v,
  };
}
