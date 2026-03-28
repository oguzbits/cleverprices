import { client, db, dbReady, IS_BUILD } from "@/db";
import {
  prices,
  products,
  type Product as DbProduct,
  type Price,
} from "@/db/schema";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  like,
  lt,
  lte,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import { withRetry } from "../db/utils";

// Lightweight price columns - lean schema (Drizzle ORM skill: query-select-columns)
import {
  filteringProductColumns,
  litePriceColumns,
  liteProductColumns,
  superLitePriceColumns,
  VIRTUAL_CATEGORY_MAP,
} from "./product-definitions";

export {
  filteringProductColumns,
  litePriceColumns,
  liteProductColumns,
  superLitePriceColumns,
};

import { getFamilyIdentity, getFamilyRepresentative } from "./product-families";
import {
  calculateSiblingConsensus,
  getProductIdentity,
} from "./utils/product-identity";
import { mapDbProduct } from "./utils/product-mapping";

/**
 * Product Registry - DB Adapter
 * Fetches data from SQLite database seeded with realistic data.
 */

import type { LitePrice, Product } from "./product-definitions";

export type { LitePrice, Product };

// Re-export mapping logic for backward compatibility
export { mapDbProduct } from "./utils/product-mapping";

import {
  enrichWithFullSiblings,
  getProductsByCategory,
  getProductsByIds,
  getRawProductsByCategory,
  indexPricesById,
} from "./server/product-queries";

export {
  enrichWithFullSiblings,
  getProductsByCategory,
  getProductsByIds,
  getRawProductsByCategory,
  indexPricesById,
};

export const getProductById = cache(async function getProductById(
  id: number,
  _country = "de", // Parameter kept for signature compatibility
): Promise<Product | undefined> {
  if (IS_BUILD) return undefined;
  await dbReady;
  // Handle 200m offset from slugs
  const realId =
    id >= 900000000 ? id - 900000000 : id >= 200000000 ? id - 200000000 : id;

  const [p] = await withRetry(() =>
    db.select().from(products).where(eq(products.id, realId)).limit(1),
  );

  if (!p) return undefined;

  // [CONSISTENCY FIX] Fetch prices and siblings together to maintain slug consensus
  const [prs, siblings] = await withRetry(async () => {
    return await Promise.all([
      db.select().from(prices).where(eq(prices.productId, p.id)),
      p.parentAsin
        ? db
            .select(liteProductColumns)
            .from(products)
            .where(eq(products.parentAsin, p.parentAsin))
        : Promise.resolve([]),
    ]);
  });

  // Use centralized mapping logic which correctly handles historyJson and identity
  const product = mapDbProduct(
    p as DbProduct,
    prs as Price[],
    siblings as any[],
    false,
  );

  // Preserve the synthetic/offset ID if provided
  if (id >= 200000000) {
    return { ...product, id };
  }
  return product;
});

async function fetchCanonicalIdInternal(
  parentAsin?: string | null,
  currentId?: number,
  modelTitle?: string,
  depth: number = 0,
) {
  "use cache";
  cacheLife("product");
  const _v = "v4"; // Version bump

  if (depth > 5 || !parentAsin) return currentId!;

  await dbReady;
  const allVariants = await db
    .select({
      id: products.id,
      title: products.title,
      brand: products.brand,
      category: products.category,
      officialTitle: products.officialTitle,
      officialSpecifications: products.officialSpecifications,
      variationAttributes: products.variationAttributes,
      specificationsSource: products.specificationsSource,
    })
    .from(products)
    .where(eq(products.parentAsin, parentAsin))
    .orderBy(asc(products.id));

  if (allVariants.length === 0) return currentId!;

  // If no modelTitle provided, use the first ID overall for that family
  if (!modelTitle) return allVariants[0].id;

  // Split based on specific series (matches category page expansion logic)
  const targetKey = modelTitle.toLowerCase().replace(/[^a-z0-9]+/g, "");

  for (const v of allVariants) {
    const iden = getProductIdentity(v as any);
    const key = (iden.modelTitle || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
    if (key === targetKey) {
      return v.id;
    }
  }

  return allVariants[0].id;
}

/**
 * Get the stable canonical ID for a family (Smallest ID in the family).
 * This ensures all variants point to the same Hub ID regardless of price/condition.
 */
export const getCanonicalFamilyId = cache(async function getCanonicalFamilyId(
  parentAsin: string | undefined,
  currentId: number,
  modelTitle?: string,
  depth: number = 0,
): Promise<number> {
  const isScript =
    typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;

  if (isScript) {
    if (!parentAsin) return currentId;
    await dbReady;
    const allVariants = await db
      .select({
        id: products.id,
        title: products.title,
        brand: products.brand,
        category: products.category,
        officialTitle: products.officialTitle,
        officialSpecifications: products.officialSpecifications,
        variationAttributes: products.variationAttributes,
        specificationsSource: products.specificationsSource,
      })
      .from(products)
      .where(eq(products.parentAsin, parentAsin))
      .orderBy(asc(products.id));

    if (allVariants.length === 0) return currentId;
    if (!modelTitle) return allVariants[0].id;
    const targetKey = modelTitle.toLowerCase().replace(/[^a-z0-9]+/g, "");
    for (const v of allVariants) {
      const iden = getProductIdentity(v as any);
      const key = (iden.modelTitle || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
      if (key === targetKey) return v.id;
    }
    return allVariants[0].id;
  }

  return (await fetchCanonicalIdInternal(
    parentAsin,
    currentId,
    modelTitle,
    depth,
  )) as number;
});

async function fetchHistoryInternal(productId: number, countryCode: string) {
  "use cache";
  cacheLife("product");
  const _v = "v2"; // Version bump
  await dbReady;
  const [pr] = await db
    .select({ historyJson: prices.historyJson })
    .from(prices)
    .where(
      and(eq(prices.productId, productId), eq(prices.country, countryCode)),
    )
    .limit(1);

  if (!pr?.historyJson) return [];
  const { parseHistoryJson } = await import("./utils/product-mapping");
  return parseHistoryJson(pr.historyJson);
}

/**
 * Fetch only price history for a specific product and country.
 * Optimized for Hub pages where we just need the history of the cheapest variant.
 */
async function getProductPriceHistory(
  productId: number,
  countryCode: string = "de",
): Promise<{ date: string; price: number }[]> {
  const isScript =
    typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;

  if (isScript) {
    await dbReady;
    const [pr] = await db
      .select({ historyJson: prices.historyJson })
      .from(prices)
      .where(
        and(eq(prices.productId, productId), eq(prices.country, countryCode)),
      )
      .limit(1);

    if (!pr?.historyJson) return [];
    const { parseHistoryJson } = await import("./utils/product-mapping");
    return parseHistoryJson(pr.historyJson);
  }

  return fetchHistoryInternal(productId, countryCode);
}

/**
 * Handle synthetic IDs for "Alle Varianten" / Parent Views.
 * ID = 900,000,000 + Real_Child_ID
 */
export async function findProductBySyntheticId(
  syntheticId: number,
  depth: number = 0,
): Promise<Product | undefined> {
  if (syntheticId < 900000000) return undefined;

  const realId = syntheticId - 900000000;

  // 1. Fetch requested product (used for ID stability)
  const canonicalProduct = await getProductById(realId);
  if (!canonicalProduct) return undefined;

  // 1.5 Series Identification
  const identity = getProductIdentity(canonicalProduct);
  const modelTitle = identity.modelTitle;

  // 2. CANONICAL HUB ENFORCEMENT
  if (canonicalProduct.parentAsin) {
    const canonicalRealId = await getCanonicalFamilyId(
      canonicalProduct.parentAsin,
      realId,
      modelTitle,
    );
    const canonicalSyntheticId = 900000000 + canonicalRealId;

    if (canonicalRealId !== realId && depth < 5) {
      const actualCanonical = await getProductById(canonicalRealId);
      if (actualCanonical) {
        return findProductBySyntheticId(canonicalSyntheticId, depth + 1);
      }
    }
  }

  // 3. DYNAMIC REPRESENTATIVE SELECTION (Robustness Layer)
  // We fetch matching siblings (same series) to pick the best face for the hub
  let representative = canonicalProduct;
  let variants: Product[] = [];

  if (canonicalProduct.parentAsin) {
    const rawVariants = await getProductVariants(canonicalProduct, "de");

    if (rawVariants.length > 0) {
      const targetModelKey = (modelTitle || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");

      variants = rawVariants.filter((v) => {
        const vIden = getProductIdentity(v);
        const vModelKey = (vIden.modelTitle || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");
        return vModelKey === targetModelKey;
      });

      const bestVariant = getFamilyRepresentative(variants as any);
      if (bestVariant) {
        representative = bestVariant;
      }
    }
  }

  // 4. Return the "Best" representative, but MASKED with the Synthetic ID
  const history = await getProductPriceHistory(representative.id!, "de");

  const familyIdentity = getFamilyIdentity(
    { ...canonicalProduct, id: syntheticId, isParentView: true },
    variants || [],
  );

  return {
    ...representative,
    id: syntheticId,
    slug: familyIdentity.slug,
    priceHistory: history,
    isParentView: true,
    modelTitle: familyIdentity.modelTitle,
    variantSuffix: familyIdentity.variantSuffix,
  } as any;
}

export async function getAllProductSlugs(
  limit?: number,
  includeVariants: boolean = false,
  fastMode: boolean = false,
): Promise<
  {
    id: number;
    slug: string;
    category: string;
    enrichmentStatus?: string | null;
    updatedAt: Date;
  }[]
> {
  try {
    // 1. Fetch products with identity-critical columns
    // [PERFORMANCE] Filters in SQL to avoid mapping thousands of non-critical products
    let query = db
      .select({
        id: products.id,
        asin: products.asin,
        slug: products.slug,
        title: products.title,
        brand: products.brand,
        category: products.category,
        parentAsin: products.parentAsin,
        variationAttributes: products.variationAttributes,
        officialTitle: products.officialTitle,
        enrichmentStatus: products.enrichmentStatus,
        updatedAt: products.updatedAt,
        specifications: products.specifications,
        officialSpecifications: products.officialSpecifications,
        salesRank: products.salesRank,
        capacity: products.capacity,
        capacityUnit: products.capacityUnit,
        normalizedCapacity: products.normalizedCapacity,
        technology: products.technology,
        condition: products.condition,
        rating: products.rating,
        reviewCount: products.reviewCount,
        imageUrl: products.imageUrl,
        mpn: products.mpn,
      })
      .from(products)
      .where(
        inArray(products.enrichmentStatus, [
          "optimized",
          "processed",
          "pending",
        ]),
      )
      .orderBy(
        sql`CASE WHEN enrichment_status = 'optimized' THEN 0 ELSE 1 END`,
        asc(products.salesRank),
        desc(products.updatedAt),
      );

    if (limit) {
      // @ts-ignore
      query = query.limit(limit);
    }

    const rawAllProducts = await query;

    // 2. Fetch prices (optimized map)
    const priceRecords = await db
      .select({
        productId: prices.productId,
        price: prices.price,
        usedPrice: prices.usedPrice,
      })
      .from(prices);

    const priceMap = new Map();
    for (const p of priceRecords) {
      if (!priceMap.has(p.productId))
        priceMap.set(p.productId, { price: 0, usedPrice: 0 });
      const current = priceMap.get(p.productId);
      current.price = Math.max(current.price, p.price || 0);
      current.used_price = Math.max(current.used_price, p.usedPrice || 0);
    }

    // 3. Group ALL products by family first (Critical for slug consensus)
    const fullFamilies = new Map<string, any[]>();
    for (const p of rawAllProducts) {
      if (p.parentAsin) {
        if (!fullFamilies.has(p.parentAsin)) fullFamilies.set(p.parentAsin, []);
        fullFamilies.get(p.parentAsin)!.push(p);
      }
    }

    const results: {
      id: number;
      slug: string;
      category: string;
      enrichmentStatus?: string | null;
      updatedAt: Date;
    }[] = [];

    // 4. Filter and Map Products
    const processedFamilies = new Set<string>();

    for (const p of rawAllProducts) {
      // Basic quality check (Same as PDP)
      const hasMeaningfulTitle =
        p.title && p.title.length > 2 && p.title !== p.asin;
      if (!hasMeaningfulTitle) continue;

      const pr = priceMap.get(p.id);
      const hasPrice = pr && (pr.price > 0 || pr.used_price > 0);
      const hasSpecs = p.officialSpecifications || p.specifications;

      // Unify with PDP logic: Include if it has a price OR high-quality specs
      if (!hasPrice && !hasSpecs) continue;

      if (fastMode) {
        // [PERFORMANCE] Fast mode returns the database slugs directly.
        // Extremely fast, ideal for sitemaps where 301 redirects to canonical are acceptable.
        results.push({
          id: p.id!,
          slug: p.slug,
          category: p.category,
          enrichmentStatus: p.enrichmentStatus,
          updatedAt: p.updatedAt || new Date(),
        });
        continue;
      }

      if (!p.parentAsin) {
        // Singleton
        const mapped = mapDbProduct(p as DbProduct, [], [], true);
        results.push({
          id: p.id!,
          slug: mapped.slug,
          category: p.category,
          enrichmentStatus: p.enrichmentStatus,
          updatedAt: p.updatedAt || new Date(),
        });
      } else {
        // Part of a family - handle the entire family AT ONCE and skip subsequent members
        if (processedFamilies.has(p.parentAsin)) continue;
        processedFamilies.add(p.parentAsin);

        const variants = fullFamilies.get(p.parentAsin)!;

        // Optimization: Map all siblings once per family to share consensus
        const allMapped = variants.map((v) => {
          const vPr = priceMap.get(v.id!);
          const priceArray = vPr
            ? [{ price: vPr.price, usedPrice: vPr.used_price, country: "de" }]
            : [];
          // Pass the FULL variants list here for CORRECT consensus
          return mapDbProduct(v as any, priceArray as any, variants, true);
        });

        if (includeVariants) {
          // Add ALL mapped variants from this family
          allMapped.forEach((m, idx) => {
            const v = variants[idx];
            results.push({
              id: v.id!,
              slug: m.slug,
              category: v.category,
              enrichmentStatus: v.enrichmentStatus,
              updatedAt: v.updatedAt || new Date(),
            });
          });
        }

        // Add the Hub (Parent) page if multiple good variants exist
        const goodVariantsIndices = variants
          .map((v, i) => {
            const m = allMapped[i];
            const mPr = m.prices["de"];
            const mUsedPr = m.usedPrices?.["de"];
            const isGood =
              (mPr && mPr > 0) ||
              (mUsedPr && mUsedPr > 0) ||
              m.officialSpecifications ||
              m.specifications;
            return isGood ? i : -1;
          })
          .filter((i) => i !== -1);

        if (goodVariantsIndices.length > 1) {
          const goodMapped = goodVariantsIndices.map((i) => allMapped[i]);
          const rep = getFamilyRepresentative(goodMapped as any);
          const repId = (rep as any).id || 0;
          const syntheticId = 900000000 + (repId % 100000000);
          const repIndex = variants.findIndex((v) => v.id === repId);
          const { slug: hubSlug } = getFamilyIdentity(
            { ...rep, id: syntheticId, isParentView: true } as any,
            allMapped, // Use full list for Hub identity too
          );

          results.push({
            id: syntheticId,
            slug: hubSlug,
            category: (rep as any).category || "unknown",
            enrichmentStatus: variants.some(
              (v) => v.enrichmentStatus === "processed",
            )
              ? "processed"
              : "pending",
            updatedAt:
              (repIndex !== -1 ? variants[repIndex].updatedAt : null) ||
              new Date(),
          });
        } else if (goodVariantsIndices.length === 1 && !includeVariants) {
          // If only one good product and we aren't including variants, just add that one product
          const idx = goodVariantsIndices[0];
          results.push({
            id: variants[idx].id!,
            slug: allMapped[idx].slug,
            category: variants[idx].category,
            enrichmentStatus: variants[idx].enrichmentStatus,
            updatedAt: variants[idx].updatedAt || new Date(),
          });
        }
      }
    }

    return results;
  } catch (e) {
    if (!IS_BUILD) {
      console.warn(
        "[Product Registry] Database missing or inaccessible in getAllProductSlugs.",
      );
    }
    return [];
  }
}

// Process-level cache for non-empty categories to avoid Redis roundtrips on every page load
let MEMORY_NON_EMPTY_CATEGORIES: { data: string[]; timestamp: number } | null =
  null;
const MEMORY_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Get all category slugs that have at least one product with "optimized" status.
 * Used for filtering the sitemap and preventing thin content.
 */
async function fetchNonEmptyInternal() {
  await dbReady;
  try {
    const results = await db
      .select({ category: products.category })
      .from(products)
      .where(
        inArray(products.enrichmentStatus, [
          "optimized",
          "processed",
          "scavenged",
          "pending",
        ]),
      )
      .groupBy(products.category);

    if (results.length === 0 && process.env.NODE_ENV === "production") {
      throw new Error(
        "No non-empty categories found. Database might be empty or syncing.",
      );
    }

    const categories = results.map((r) => r.category);

    // [GSC FIX] Add virtual categories (e.g. apple-iphone) if their base DB category (e.g. smartphones) is non-empty.
    // This ensures they appear in the sitemap and pass the "isEmpty" check in the app.
    Object.entries(VIRTUAL_CATEGORY_MAP).forEach(([virtualSlug, config]) => {
      if (
        categories.includes(config.dbCategory) &&
        !categories.includes(virtualSlug)
      ) {
        categories.push(virtualSlug);
      }
    });

    // Update memory cache
    MEMORY_NON_EMPTY_CATEGORIES = { data: categories, timestamp: Date.now() };

    return categories;
  } catch (e) {
    if (!IS_BUILD) {
      console.error(
        `[DB Error] getNonEmptyCategorySlugs failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw e;
    }
    return [];
  }
}

export async function getNonEmptyCategorySlugs(): Promise<string[]> {
  if (IS_BUILD) {
    // During build, we return all non-hidden categories from the manifest
    const { allCategories } = await import("./categories");
    return Object.values(allCategories)
      .filter((c) => !c.hidden)
      .map((c) => c.slug);
  }

  // Check Memory Cache first (Instant, process-level)
  const now = Date.now();
  if (
    MEMORY_NON_EMPTY_CATEGORIES &&
    now - MEMORY_NON_EMPTY_CATEGORIES.timestamp < MEMORY_CACHE_TTL_MS
  ) {
    return MEMORY_NON_EMPTY_CATEGORIES.data;
  }

  const isScript =
    typeof globalThis === "undefined" ||
    (!(globalThis as any).__incrementalCache && !process.env.NEXT_RUNTIME);

  if (isScript) {
    return fetchNonEmptyInternal();
  }

  const cachedFetch = async () => {
    "use cache";
    cacheLife("category");
    const version = "v205"; // Version bump
    return fetchNonEmptyInternal();
  };

  return cachedFetch();
}

/**
 * Parse variation attributes string into key-value pairs
 * Input: "Color: Cosmic Orange; Storage: 2000GB"
 * Output: { Color: "Cosmic Orange", Storage: "2000GB" }
 */

/**
 * Get all variants for a product (products sharing the same parentAsin)
 * Returns products sorted by price (cheapest first)
 */
export const getProductVariants = cache(async function getProductVariants(
  product: Product,
  countryCode: string = "de",
  skipLiveMerge: boolean = false, // Added back to match usage
  skipFullMapping: boolean = false, // If true, skips expensive consensus/identity logic
): Promise<Product[]> {
  if (IS_BUILD) return [];
  await dbReady;
  // 1. PRIMARY: Fetch by parentAsin (Ideal Path)
  const fetchByAsin = async (parentAsin: string) => {
    // [OPTIMIZATION] Single Query JOIN strategy using LEAN columns
    const columnsToUse = skipFullMapping
      ? {
          id: products.id,
          asin: products.asin,
          slug: products.slug,
          title: products.title,
          brand: products.brand,
          mpn: products.mpn,
          parentAsin: products.parentAsin,
          imageUrl: products.imageUrl,
          variationAttributes: products.variationAttributes,
          condition: products.condition,
          // specifications: products.specifications, // Skipped for speed
          // officialSpecifications: products.officialSpecifications, // Skipped for speed
        }
      : liteProductColumns;

    const rows = await withRetry(async () => {
      return await db
        .select({
          product: columnsToUse,
          price: superLitePriceColumns,
        })
        .from(products)
        .leftJoin(
          prices,
          and(
            eq(prices.productId, products.id),
            eq(prices.country, countryCode),
          ),
        )
        .where(eq(products.parentAsin, parentAsin));
    });

    if (rows.length <= 1) return [];

    // Grouping: effectively replicate "LiteProduct + associated LitePrice" structure
    const siblings = rows.map((r) => r.product as DbProduct);

    // Skip consensus if lean mode is requested (huge speedup for many variants)
    const consensus = skipFullMapping
      ? undefined
      : calculateSiblingConsensus(siblings);

    return rows
      .map(({ product: p, price }) => {
        const priceArray = price ? [price] : [];
        return mapDbProduct(
          p as DbProduct,
          priceArray as any[],
          siblings,
          skipFullMapping, // Also strip heavy data if lean
          consensus,
        );
      })
      .filter(
        (v) =>
          (v.prices[countryCode] || 0) > 0 ||
          (v.usedPrices?.[countryCode] || 0) > 0,
      );
  };

  if (product.parentAsin) {
    const variants = await fetchByAsin(product.parentAsin);
    if (variants.length > 0)
      return variants.sort(
        (a, b) => (a.prices[countryCode] || 0) - (b.prices[countryCode] || 0),
      );
  }

  // 2. SECONDARY: Smart Fallback by Model Identity (RECOVERY)
  const { getProductIdentity } = await import("./utils/product-identity");
  const identity = getProductIdentity(product);
  const targetModelKey = identity.model
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  if (targetModelKey && targetModelKey.length > 2) {
    const siblings = await getProductsByCategory(product.category, true);

    const matched = siblings.filter((s) => {
      if (s.brand.toLowerCase() !== product.brand.toLowerCase()) return false;
      const sIdentity = getProductIdentity(s);
      const sKey = sIdentity.model.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return sKey === targetModelKey;
    });

    if (matched.length > 1) {
      return matched.sort(
        (a, b) => (a.prices[countryCode] || 0) - (b.prices[countryCode] || 0),
      );
    }
  }

  return [];
});

/**
 * Get all products in a family (sharing same parentAsin)
 * Used for the "Alle Varianten" hub page
 */
// [OPTIMIZATION] Single Query JOIN strategy
export const getProductFamilyMembers = cache(
  async function getProductFamilyMembers(
    parentAsin: string,
    countryCode: string = "de",
    skipFullMapping: boolean = false,
  ): Promise<Product[]> {
    await dbReady;
    // Use the optimized variant fetcher by passing a synthetic product with just the parentAsin
    const syntheticProduct = { parentAsin } as Product;
    return getProductVariants(
      syntheticProduct,
      countryCode,
      false,
      skipFullMapping,
    );
  },
);

export async function getAllProducts(): Promise<Product[]> {
  if (IS_BUILD) return [];
  await dbReady;
  const allProducts = await withRetry(() =>
    db.select(liteProductColumns).from(products),
  );
  const allPrices = await withRetry(() =>
    db.select(litePriceColumns).from(prices),
  );
  const pricesByProduct = indexPricesById(allPrices);
  return enrichWithFullSiblings(allProducts, pricesByProduct, "de");
}

const fetchProductBySlug = cache(
  async (
    slug: string,
    _includeHistory: boolean = false, // History now comes from historyJson in prices
  ): Promise<Product | undefined> => {
    if (IS_BUILD || !slug) return undefined;
    await dbReady;
    const getProductAndPrices = async (targetSlug: string) => {
      const [p] = await withRetry(() =>
        db
          .select()
          .from(products)
          .where(eq(products.slug, targetSlug))
          .limit(1),
      );

      if (!p) return undefined;

      // O(1) Fetch: Only fetch prices for the specific product.
      const prs = await withRetry(() =>
        db.select().from(prices).where(eq(prices.productId, p.id)),
      );

      return mapDbProduct(p as any, prs as any, []);
    };

    // 1. Try ID-based match first (Robust path)
    const idMatch = slug.match(/^(\d+)_-(.*)$/);
    if (idMatch) {
      const id = parseInt(idMatch[1]);
      const p = await getProductById(id);
      if (p) return p;
    }

    // 2. Try exact match (Legacy path)
    let result = await getProductAndPrices(slug);

    // If not found, try decoding the slug
    if (!result) {
      try {
        const decoded = decodeURIComponent(slug);
        if (decoded !== slug) {
          result = await getProductAndPrices(decoded);
        }
      } catch (e) {
        // Ignore decoding errors
      }
    }

    return result;
  },
);

// Note: getProductPriceHistory removed in lean schema.
// Price history is now stored in prices.historyJson and parsed by mapDbProduct.

export const getProductBySlug = cache(async function getProductBySlug(
  slug: string,
  includeHistory: boolean = false,
): Promise<Product | undefined> {
  const isScript =
    typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;

  if (isScript) {
    return fetchProductBySlug(slug, includeHistory);
  }

  const cachedFetch = async () => {
    "use cache";
    cacheLife("product");
    const [_v, _s, _h] = ["v8", slug, includeHistory]; // Version bump
    return fetchProductBySlug(slug, includeHistory);
  };

  return cachedFetch();
});

const fetchProductByAsin = async (
  asin: string,
): Promise<Product | undefined> => {
  if (IS_BUILD) return undefined;
  await dbReady;
  const [p] = await withRetry(() =>
    db
      .select()
      .from(products)
      .where(eq(products.asin, asin.toUpperCase()))
      .limit(1),
  );

  if (!p) return undefined;

  const [prs, siblings] = await withRetry(() =>
    Promise.all([
      db.select().from(prices).where(eq(prices.productId, p.id)),
      p.parentAsin
        ? db
            .select(liteProductColumns)
            .from(products)
            .where(eq(products.parentAsin, p.parentAsin))
        : Promise.resolve([]),
    ]),
  );

  return mapDbProduct(p as any, prs as any, siblings as any[]);
};

export const getProductByAsin = cache(async function getProductByAsin(
  asin: string,
): Promise<Product | undefined> {
  const isScript =
    typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;

  if (isScript) {
    return fetchProductByAsin(asin);
  }

  const cachedFetch = async () => {
    "use cache";
    cacheLife("product");
    const [_v, _a] = ["v2", asin]; // Version bump
    return fetchProductByAsin(asin);
  };

  return cachedFetch();
});

/**
 * Find a product by ASIN suffix (last 4 characters of ASIN).
 * Used for redirecting old slugs that contain ASIN info to new short slugs.
 *
 * @param oldSlug - The old slug that might contain ASIN info
 * @returns Product slug if found, undefined otherwise
 */
export async function findProductSlugByAsinSuffix(
  oldSlug: string,
): Promise<string | undefined> {
  if (IS_BUILD) return undefined;
  await dbReady;
  // Extract potential ASIN from old slug
  // 1. Try full 10-char ASIN (standard Amazon)
  const fullAsinMatch = oldSlug.match(/([a-z0-9]{10})$/i);
  if (fullAsinMatch) {
    const asin = fullAsinMatch[1].toUpperCase();
    // Indexed lookup is O(1)
    const [p] = await withRetry(() =>
      db
        .select({ id: products.id, slug: products.slug })
        .from(products)
        .where(eq(products.asin, asin))
        .limit(1),
    );
    if (p) {
      const iden = getProductIdentity(p);
      const canonicalRealId = await getCanonicalFamilyId(
        (p as any).parentAsin || undefined,
        p.id,
        iden.modelTitle,
      );
      const canonicalProduct = await getProductById(canonicalRealId);
      const { slug: canonical } = getFamilyIdentity(
        {
          ...(canonicalProduct || p),
          id: 900000000 + (canonicalProduct?.id ?? p.id),
          isParentView: true,
        },
        [],
      );
      return canonical;
    }
  }

  // 2. Try short 3-4 char suffix (common in our generated slugs)
  // ONLY do this if the slug actually looks like it has a suffix (ends in -XXX or -XXXX)
  const shortSuffixMatch = oldSlug.match(/-([a-z0-9]{3,4})$/i);
  if (shortSuffixMatch) {
    const suffix = shortSuffixMatch[1].toUpperCase();

    // Safety: LIKE '%XXXX' is a full table scan O(N).
    // However, for redirect recovery, we search both ASIN and Parent ASIN.
    const [p] = await db
      .select({
        id: products.id,
        slug: products.slug,
        parentAsin: products.parentAsin,
      })
      .from(products)
      .where(
        or(
          sql`${products.asin} LIKE ${"%" + suffix}`,
          sql`${products.parentAsin} LIKE ${"%" + suffix}`,
        ),
      )
      .limit(1);

    if (p) {
      // If it's a specific variant, we might want to redirect to the Hub or the Variant.
      // For migration recovery, redirecting to the variant's new canonical slug is safest.
      const iden = getProductIdentity(p as any);
      const canonicalRealId = await getCanonicalFamilyId(
        p.parentAsin || undefined,
        p.id,
        iden.modelTitle,
      );

      const canonicalProduct = await getProductById(canonicalRealId);
      const { slug: canonical } = getFamilyIdentity(
        {
          ...(canonicalProduct || p),
          id: 900000000 + (canonicalProduct?.id ?? p.id),
          isParentView: true,
          parentAsin: p.parentAsin ?? undefined,
        },
        [],
      );
      return canonical;
    }
  }

  // 3. Deep Fallback: Fuzzy Slug Match
  // If the old slug matches the text part of a new ID-prefixed slug
  // e.g. "apple-iphone-15" matches "200000123_-apple-iphone-15"
  const [fuzzyP] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(sql`${products.slug} LIKE ${"%_-" + oldSlug}`)
    .limit(1);

  if (fuzzyP) {
    return fuzzyP.slug;
  }

  return undefined;
}

export const findProductByParentAsinSuffix = cache(
  async function findProductByParentAsinSuffix(
    slug: string,
  ): Promise<Product | undefined> {
    if (IS_BUILD || !slug) return undefined;
    await dbReady;
    const shortSuffixMatch = slug.match(/-([a-z0-9]{3,4})-?$/i);
    if (!shortSuffixMatch) return undefined;

    const suffix = shortSuffixMatch[1].toUpperCase();
    const prefix = slug.slice(0, slug.lastIndexOf("-"));
    const keywords = prefix
      .split("-")
      .filter((k) => k.length >= 2)
      .slice(0, 3); // Take first 3 meaningful tokens (e.g. apple, iphone, 17)

    // Search by parent_asin suffix + title keywords to avoid collision (e.g. s25 vs s24)
    // We use OR to handle both exact suffix and cases where it ends with a dash (common in FAM- slugs)
    const conditions = [
      or(
        like(products.parentAsin, `%${suffix}`),
        like(products.parentAsin, `%${suffix}-`),
      ),
    ] as (SQL | undefined)[];

    // Apply keyword filters if any found
    for (const k of keywords) {
      conditions.push(like(products.title, `%${k}%`));
    }

    console.log(
      `[ParentLookup] Debug: slug=${slug}, suffix=${suffix}, keywords=${keywords.join(",")}`,
    );

    // Join with prices to ensure we pick a child that actually exists and has a price
    // This prevents 404s if the first matching substring happens to be an unavailable product
    const candidates = await withRetry(() =>
      db
        .select({
          ...liteProductColumns,
          price: prices.price,
        })
        .from(products)
        .innerJoin(prices, eq(products.id, prices.productId))
        .where(
          and(
            ...conditions,
            eq(prices.country, "de"), // Default to DE for resolving parent
            gt(prices.price, 0),
          ),
        )
        .orderBy(desc(prices.price)) // Pick expensive one (usually fully specced) or any valid one
        .limit(10),
    ); // Fetch multiple candidates to resolve collisions

    if (candidates.length === 0) return undefined;

    // ... Scoring Logic ... (Unchanged)
    const diffKeywords = ["max", "pro", "plus", "ultra", "mini", "lite", "fe"];
    const slugLower = slug.toLowerCase();

    const scoredCandidates = candidates.map((c) => {
      let score = 100;
      const titleLower = c.title.toLowerCase();

      // Check for differentiation keywords
      for (const kw of diffKeywords) {
        // 1. Ghost Keyword Check: Title has it, Slug misses it (Pro Max matching Pro query)
        if (titleLower.includes(kw) && !slugLower.includes(kw)) {
          score -= 1000;
        }

        // 2. Missing Keyword Check: Slug has it, Title misses it (Pro matching Pro Max query)
        if (slugLower.includes(kw) && !titleLower.includes(kw)) {
          score -= 1000;
        }
      }

      // Tiny boost for shorter titles (usually closer to base model) if scores equal
      score -= c.title.length * 0.01;

      return { product: c, score };
    });

    // Sort by score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    const bestMatch = scoredCandidates[0];
    const p = bestMatch.score > -500 ? bestMatch.product : candidates[0]; // Fallback if all bad

    /* 
    console.log(
      `[ParentLookup] Resolved ${slug} to ${p.title.slice(0, 30)}... (Score: ${bestMatch.score}, Suffix: ${suffix})`,
    );
    */

    if (!p) return undefined;

    // IMPORTANT: We found a child, but we mark it as parent view
    const prs = await withRetry(() =>
      db
        .select(litePriceColumns)
        .from(prices)
        .where(eq(prices.productId, p.id)),
    );

    const product = mapDbProduct(p as unknown as DbProduct, prs);
    return { ...product, isParentView: true };
  },
);

const fetchSimilarProducts = async (
  category: string,
  excludedSlug: string,
  targetPrice: number,
  limit: number,
  countryCode: string,
) => {
  if (IS_BUILD) return [];
  await dbReady;

  // 1. Calculate a price range (+/- 50% for high diversity, or tighter)
  const minPrice = targetPrice > 0 ? targetPrice * 0.5 : 1;
  const maxPrice = targetPrice > 0 ? targetPrice * 1.5 : 10000;

  // 2. Fetch candidates using an indexed range query
  // We join prices and products to get only what we need
  const candidates = await withRetry(async () => {
    return await db
      .select({
        product: liteProductColumns,
        priceVal: prices.price,
      })
      .from(products)
      .innerJoin(prices, eq(prices.productId, products.id))
      .where(
        and(
          eq(products.category, category),
          eq(prices.country, countryCode),
          gt(prices.price, minPrice),
          lt(prices.price, maxPrice),
          sql`${products.slug} != ${excludedSlug}`,
        ),
      )
      .orderBy(asc(products.salesRank)) // Suggest popular similar products
      .limit(Math.min(limit * 4, 100)); // Fetch a buffer for final sorting
  });

  if (candidates.length === 0) {
    // Fallback: If no price-filtered results, get popular in category
    const fallback = await db
      .select({
        product: liteProductColumns,
        priceVal: prices.price,
      })
      .from(products)
      .innerJoin(prices, eq(prices.productId, products.id))
      .where(
        and(
          eq(products.category, category),
          eq(prices.country, countryCode),
          sql`${products.slug} != ${excludedSlug}`,
        ),
      )
      .orderBy(asc(products.salesRank))
      .limit(limit);

    return fallback.map((c) => mapDbProduct(c.product as DbProduct, []));
  }

  // 3. Final refinement in memory for closest price matches
  const sorted = candidates.sort((a, b) => {
    const priceA = a.priceVal || 0;
    const priceB = b.priceVal || 0;
    return Math.abs(priceA - targetPrice) - Math.abs(priceB - targetPrice);
  });

  return sorted
    .slice(0, limit)
    .map((c) => mapDbProduct(c.product as DbProduct, []));
};

export const getSimilarProducts = cache(async function getSimilarProducts(
  product: Product,
  limit: number = 4,
  countryCode: string = "de",
): Promise<Product[]> {
  if (!product) return [];
  const isScript =
    typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;

  const currentPrice = product.prices[countryCode] || 0;

  if (isScript) {
    return fetchSimilarProducts(
      product.category,
      product.slug,
      currentPrice,
      limit,
      countryCode,
    );
  }

  const cachedFetch = async () => {
    "use cache";
    cacheLife("product");
    const [_v] = ["v21"]; // Version bump
    return fetchSimilarProducts(
      product.category,
      product.slug,
      currentPrice,
      limit,
      countryCode,
    );
  };

  return cachedFetch();
});

export async function searchProducts(
  query: string,
  limit: number = 20,
): Promise<Product[]> {
  if (IS_BUILD) return [];
  const sanitized = query.trim().replace(/[^\w\s]/g, "");
  if (!sanitized) return [];

  await dbReady;

  // Transform "Samsung Galaxy" into prefix matching targeted at brand and title
  const terms = sanitized
    .split(/\s+/)
    .map((term) => `${term}*`)
    .join(" ");
  // Prioritize brand match, then title match
  const matchQuery = `(brand : ${terms}) OR (title : ${terms})`;

  let ids: number[] = [];

  // 1. Try high-performance FTS5 search
  try {
    const result = await client.execute({
      sql: "SELECT id FROM products_search WHERE products_search MATCH ? ORDER BY rank LIMIT ?",
      args: [matchQuery, limit],
    });
    ids = result.rows.map((r: any) => Number(r.id));
  } catch (error) {
    console.warn(`[Search] FTS MATCH failed for "${query}", falling back...`);
  }

  // 2. Fallback: If no results from FTS or FTS failed, try a basic LIKE search
  if (ids.length === 0) {
    try {
      const fallbackResult = await db
        .select({ id: products.id })
        .from(products)
        .where(like(products.title, `%${sanitized}%`))
        .limit(limit);

      ids = fallbackResult.map((r) => Number(r.id));
      if (ids.length === 0) return [];
    } catch (fallbackErr) {
      console.error("[Search] Fallback LIKE also failed:", fallbackErr);
      return [];
    }
  }

  try {
    // 3. Fetch full product data and prices for those specific IDs
    const prods = await db
      .select(liteProductColumns)
      .from(products)
      .where(inArray(products.id, ids));

    const prs = await db
      .select(litePriceColumns)
      .from(prices)
      .where(inArray(prices.productId, ids));

    const pricesByProduct = indexPricesById(prs);

    // Sort prods back into the order returned by FTS (relevance)
    const idOrder = new Map<number, number>(
      ids.map((id: number, index: number) => [id, index]),
    );
    const sortedProds = prods.sort(
      (a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0),
    );

    // Group by parentAsin for correct sibling consensus
    const families = new Map<string, any[]>();
    for (const p of sortedProds) {
      if (p.parentAsin) {
        if (!families.has(p.parentAsin)) families.set(p.parentAsin, []);
        families.get(p.parentAsin)!.push(p);
      }
    }

    return enrichWithFullSiblings(
      sortedProds,
      pricesByProduct,
      "de", // Base country for search resolution
      true,
    );
  } catch (error) {
    console.error("FTS Search Error:", error);
    // Fallback to basic search if FTS fails for some reason
    const terms = query.trim().split(/\s+/);
    const fallbackProds = await db
      .select(liteProductColumns)
      .from(products)
      .where(or(...terms.map((t) => like(products.title, `%${t}%`))))
      .limit(limit);

    if (fallbackProds.length === 0) return [];
    const fallbackIds = fallbackProds.map((p) => p.id);
    const fallbackPrs = await db
      .select(litePriceColumns)
      .from(prices)
      .where(inArray(prices.productId, fallbackIds));

    const fallbackPricesByProduct = indexPricesById(fallbackPrs);

    // Group fallback results
    const families = new Map<string, any[]>();
    for (const p of fallbackProds) {
      if (p.parentAsin) {
        if (!families.has(p.parentAsin)) families.set(p.parentAsin, []);
        families.get(p.parentAsin)!.push(p);
      }
    }

    return enrichWithFullSiblings(
      fallbackProds,
      fallbackPricesByProduct,
      "de",
      true,
    );
  }
}

const getProductsByBrand = cache(async function getProductsByBrand(
  brand: string,
  excludeSlug?: string,
): Promise<Product[]> {
  if (IS_BUILD || !brand) return [];
  await dbReady;
  const prods = await withRetry(() =>
    db
      .select(liteProductColumns)
      .from(products)
      .where(
        and(
          eq(sql`LOWER(${products.brand})`, brand.toLowerCase()),
          excludeSlug ? sql`${products.slug} != ${excludeSlug}` : sql`1=1`,
        ),
      ),
  );

  if (prods.length === 0) return [];

  const ids = prods.map((p) => p.id);
  const prs = await withRetry(() =>
    db
      .select(litePriceColumns)
      .from(prices)
      .where(inArray(prices.productId, ids)),
  );

  const pricesByProduct = indexPricesById(prs);

  // Group by parentAsin for correct sibling consensus
  const families = new Map<string, any[]>();
  for (const p of prods) {
    if (p.parentAsin) {
      if (!families.has(p.parentAsin)) families.set(p.parentAsin, []);
      families.get(p.parentAsin)!.push(p);
    }
  }

  return enrichWithFullSiblings(prods, pricesByProduct, "de", false);
});

const getCachedDeals = async (
  limit: number,
  countryCode: string,
  condition?: string,
) => {
  "use cache";
  cacheLife("hours");
  cacheTag("deals", limit.toString(), countryCode, condition || "any");

  await dbReady;
  try {
    // ...

    // Lean schema: use consolidated `price` column instead of amazonPrice/newPrice
    const whereConditions: (SQL | undefined)[] = [
      eq(prices.country, countryCode),
      gt(prices.priceAvg90, 0),
      gt(prices.price, 0), // Consolidated "clever" price
    ];

    if (condition) {
      whereConditions.push(eq(products.condition, condition as any));
      if (condition === "New") {
        whereConditions.push(
          sql`${products.title} NOT LIKE '%Generalüberholt%'`,
        );
        whereConditions.push(sql`${products.title} NOT LIKE '%erneuert%'`);
        whereConditions.push(sql`${products.title} NOT LIKE '%Renewed%'`);
      }
    }

    const results = await withRetry(() =>
      db
        .select({
          product: liteProductColumns,
          price: litePriceColumns,
        })
        .from(products)
        .innerJoin(prices, eq(products.id, prices.productId))
        .where(and(...whereConditions))
        .orderBy(
          desc(
            // Deal percentage: (90-day avg - current price) / 90-day avg
            sql`(${prices.priceAvg90} - ${prices.price}) / ${prices.priceAvg90}`,
          ),
        )
        .limit(limit),
    );

    const prods = results.map((r) => r.product);
    const pricesByProduct = indexPricesById(results.map((r) => r.price));
    return enrichWithFullSiblings(prods, pricesByProduct, countryCode, true);
  } catch (e) {
    console.warn(
      `[DB Warning] Failed to fetch deals: ${e instanceof Error ? e.message : String(e)}`,
    );
    return [];
  }
};

export const getBestDeals = cache(async function getBestDeals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
  if (IS_BUILD) return [];
  await dbReady;
  try {
    const isScript =
      typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;
    if (isScript) {
      // Fallback for scripts where unstable_cache might not be available or needed
      const results = await withRetry(() =>
        db
          .select({ product: liteProductColumns, price: litePriceColumns })
          .from(products)
          .innerJoin(prices, eq(products.id, prices.productId))
          .where(
            and(
              eq(prices.country, countryCode),
              condition ? eq(products.condition, condition) : undefined,
            ),
          )
          .limit(limit),
      );
      const prods = results.map((r) => r.product);
      const pricesByProduct = indexPricesById(results.map((r) => r.price));
      return enrichWithFullSiblings(prods, pricesByProduct, countryCode, true);
    }
    return getCachedDeals(limit, countryCode, condition);
  } catch (e) {
    console.warn(
      `[DB Warning] Failed to fetch best deals: ${e instanceof Error ? e.message : String(e)}`,
    );
    return [];
  }
});

const getCachedPopular = async (
  limit: number,
  countryCode: string,
  condition?: string,
) => {
  "use cache";
  cacheLife("hours");
  cacheTag("popular", limit.toString(), countryCode, condition || "any");

  await dbReady;
  try {
    const whereConditions: SQL[] = [];
    if (condition) {
      whereConditions.push(eq(products.condition, condition as any));
      if (condition === "New") {
        whereConditions.push(
          sql`${products.title} NOT LIKE '%Generalüberholt%'`,
        );
        whereConditions.push(sql`${products.title} NOT LIKE '%erneuert%'`);
        whereConditions.push(sql`${products.title} NOT LIKE '%Renewed%'`);
      }
    }

    const prods = await withRetry(() =>
      db
        .select(liteProductColumns)
        .from(products)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(
          asc(sql`COALESCE(${products.salesRank}, 10000000)`),
          desc(products.reviewCount),
          desc(products.rating),
        )
        .limit(limit),
    );

    console.log(
      `[DB DEBUG] getCachedPopular found ${prods.length} products with limit ${limit}`,
    );
    if (prods.length === 0) return [];

    const ids = prods.map((p) => p.id);
    const prs = await withRetry(() =>
      db
        .select(litePriceColumns)
        .from(prices)
        .where(
          and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
        ),
    );

    const pricesByProduct = indexPricesById(prs);
    console.log(
      `[DB DEBUG] getCachedPopular: products=${prods.length}, prices=${prs.length} for ${countryCode}`,
    );

    // Group by parentAsin
    const families = new Map<string, any[]>();
    for (const p of prods) {
      if (p.parentAsin) {
        if (!families.has(p.parentAsin)) families.set(p.parentAsin, []);
        families.get(p.parentAsin)!.push(p);
      }
    }

    return enrichWithFullSiblings(prods, pricesByProduct, countryCode, true);
  } catch (e) {
    console.warn(
      `[DB Warning] Failed to fetch popular: ${e instanceof Error ? e.message : String(e)}`,
    );
    return [];
  }
};

export const getMostPopular = cache(async function getMostPopular(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
  if (IS_BUILD) return [];
  try {
    const isScript =
      typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;
    if (isScript) {
      await dbReady;
      const prods = await db
        .select(liteProductColumns)
        .from(products)
        .where(condition ? eq(products.condition, condition) : undefined)
        .orderBy(asc(sql`COALESCE(${products.salesRank}, 10000000)`))
        .limit(limit);
      if (prods.length === 0) return [];

      const ids = prods.map((p) => p.id);
      const prs = await db
        .select(litePriceColumns)
        .from(prices)
        .where(
          and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
        );

      const pricesByProduct = indexPricesById(prs);

      // Group by parentAsin
      const families = new Map<string, any[]>();
      for (const p of prods) {
        if (p.parentAsin) {
          if (!families.has(p.parentAsin)) families.set(p.parentAsin, []);
          families.get(p.parentAsin)!.push(p);
        }
      }

      return enrichWithFullSiblings(prods, pricesByProduct, countryCode, true);
    }
    return getCachedPopular(limit, countryCode, condition);
  } catch (e) {
    console.warn(
      "[Build Warning] Database missing in getMostPopular. Returning empty.",
    );
    return [];
  }
});

/**
 * FETCHING OPTIMIZATION: Get a diverse set of popular products (Top N per category)
 * This uses a SQL Window Function to ensure we get candidates from all categories
 * instead of just 200 items from the most popular category.
 */
const fetchDiversePopular = async (
  itemsPerCategory: number,
  countryCode: string,
) => {
  "use cache";
  cacheLife("hours");
  cacheTag("diverse-popular", itemsPerCategory.toString(), countryCode, "v200");
  if (IS_BUILD) return [];
  await dbReady;
  try {
    const result = await client.execute({
      sql: `
    WITH RankedProducts AS (
      SELECT 
        id,
        category,
        ROW_NUMBER() OVER (
          PARTITION BY category 
          ORDER BY COALESCE(sales_rank, 10000000) ASC, review_count DESC
        ) as rank
      FROM products
      WHERE condition = 'New'
    )
    SELECT id FROM RankedProducts WHERE rank <= ?
  `,
      args: [itemsPerCategory],
    });
    const ids = result.rows.map((r: any) => Number(r.id));

    if (ids.length === 0) return [];

    const prods = await withRetry(() =>
      db
        .select(liteProductColumns)
        .from(products)
        .where(inArray(products.id, ids)),
    );

    console.log(
      `[DB DEBUG] fetchDiversePopular found ${prods.length} products`,
    );

    const prs = await withRetry(() =>
      db
        .select(litePriceColumns)
        .from(prices)
        .where(
          and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
        ),
    );

    const pricesByProduct = indexPricesById(prs);

    // Group by parentAsin
    const families = new Map<string, any[]>();
    for (const p of prods) {
      if (p.parentAsin) {
        if (!families.has(p.parentAsin)) families.set(p.parentAsin, []);
        families.get(p.parentAsin)!.push(p);
      }
    }

    return enrichWithFullSiblings(prods, pricesByProduct, countryCode, true);
  } catch (e) {
    console.warn(
      `[DB Warning] Failed to fetch diverse popular: ${e instanceof Error ? e.message : String(e)}`,
    );
    return [];
  }
};

export const getDiverseMostPopular = cache(async function getDiverseMostPopular(
  itemsPerCategory: number = 10,
  countryCode: string = "de",
): Promise<Product[]> {
  const isScript =
    typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;

  if (isScript) {
    // Scripts (non-Next.js) can't use unstable_cache
    // We would need to duplicate the logic or export the inner manual fetcher if needed.
    // For now returning empty or we could refactor further.
    // But scripts usually don't call this function.
    return [];
  }

  return fetchDiversePopular(itemsPerCategory, countryCode);
});

const getCachedNew = async (
  limit: number,
  countryCode: string,
  condition?: string,
) => {
  "use cache";
  cacheLife("hours");
  cacheTag("new-products", limit.toString(), countryCode, condition || "any");

  await dbReady;
  try {
    const whereConditions: SQL[] = [];
    if (condition) {
      whereConditions.push(eq(products.condition, condition as any));
      if (condition === "New") {
        whereConditions.push(
          sql`${products.title} NOT LIKE '%Generalüberholt%'`,
        );
        whereConditions.push(sql`${products.title} NOT LIKE '%erneuert%'`);
        whereConditions.push(sql`${products.title} NOT LIKE '%Renewed%'`);
      }
    }

    const prods = await withRetry(() =>
      db
        .select(liteProductColumns)
        .from(products)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(products.createdAt))
        .limit(limit),
    );

    if (prods.length === 0) return [];

    const ids = prods.map((p) => p.id);
    const prs = await withRetry(() =>
      db
        .select(litePriceColumns)
        .from(prices)
        .where(
          and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
        ),
    );

    const pricesByProduct = indexPricesById(prs);
    return enrichWithFullSiblings(prods, pricesByProduct, countryCode, true);
  } catch (e) {
    console.warn(
      `[DB Warning] Failed to fetch new products: ${e instanceof Error ? e.message : String(e)}`,
    );
    return [];
  }
};

export async function getNewArrivals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
  if (IS_BUILD) return [];
  try {
    const isScript =
      typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;
    if (isScript) {
      await dbReady;
      const prods = await db
        .select(liteProductColumns)
        .from(products)
        .where(condition ? eq(products.condition, condition) : undefined)
        .orderBy(desc(products.createdAt))
        .limit(limit);
      if (prods.length === 0) return [];

      const ids = prods.map((p) => p.id);
      const prs = await db
        .select(litePriceColumns)
        .from(prices)
        .where(
          and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
        );

      const pricesByProduct = indexPricesById(prs);
      console.log(
        `[DB DEBUG] getNewArrivals: products=${prods.length}, prices=${prs.length} for ${countryCode}`,
      );

      // Group by parentAsin
      const families = new Map<string, any[]>();
      for (const p of prods) {
        if (p.parentAsin) {
          if (!families.has(p.parentAsin)) families.set(p.parentAsin, []);
          families.get(p.parentAsin)!.push(p);
        }
      }

      return prods.map((p) => {
        const siblings = p.parentAsin ? families.get(p.parentAsin) || [p] : [p];
        return mapDbProduct(
          p as DbProduct,
          pricesByProduct.get(p.id!) || [],
          siblings,
          true,
        );
      });
    }
    return getCachedNew(limit, countryCode, condition);
  } catch (e) {
    console.warn(
      "[Build Warning] Database missing in getNewArrivals. Returning empty.",
    );
    return [];
  }
}

/**
 * SERVER-SIDE FILTERING & PAGINATION (Module 2)
 * Moves logic from JS to SQL for performance and scalability.
 */
async function getFilteredProducts(
  category: string,
  countryCode: string,
  filters: {
    brand?: string[];
    technology?: string[];
    formFactor?: string[];
    condition?: string[];
    socket?: string[];
    cores?: string[];
    capacity?: string[];
    minCapacity?: number;
    maxCapacity?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
  },
): Promise<Product[]> {
  if (IS_BUILD) return [];
  await dbReady;
  try {
    const where: SQL[] = [
      eq(products.category, category),
      eq(prices.country, countryCode),
      gt(prices.price, 0),
    ];

    if (filters.brand?.length) {
      where.push(inArray(products.brand, filters.brand));
    }
    if (filters.condition?.length) {
      where.push(inArray(products.condition, filters.condition as any));
    }
    if (filters.technology?.length) {
      where.push(inArray(products.technology, filters.technology));
    }
    if (filters.formFactor?.length) {
      where.push(inArray(products.formFactor, filters.formFactor));
    }
    if (filters.socket?.length) {
      // Socket is often stored in specifications JSON or extracted by mapDbProduct
      // For SQL efficiency we check the technology column which often contains socket info
      // or use a LIKE match on the title for legacy compatibility.
      where.push(
        or(
          ...filters.socket.map(
            (s) => sql`${products.title} LIKE ${"%" + s + "%"}`,
          ),
        )!,
      );
    }
    if (filters.cores?.length) {
      where.push(
        or(
          ...filters.cores.map(
            (c) => sql`${products.title} LIKE ${"%" + c + "%"}`,
          ),
        )!,
      );
    }
    if (filters.minCapacity) {
      where.push(gte(products.normalizedCapacity, filters.minCapacity));
    }
    if (filters.maxCapacity) {
      where.push(lte(products.normalizedCapacity, filters.maxCapacity));
    }
    if (filters.minPrice) {
      where.push(gte(prices.price, filters.minPrice));
    }
    if (filters.maxPrice) {
      where.push(lte(prices.price, filters.maxPrice));
    }

    // Sort logic mapping
    let order;
    const sortOrder = filters.sortOrder === "asc" ? asc : desc;

    switch (filters.sortBy) {
      case "price":
        order = sortOrder(prices.price);
        break;
      case "pricePerUnit":
        order = sortOrder(prices.pricePerUnit);
        break;
      case "rating":
        order = [sortOrder(products.rating), desc(products.reviewCount)];
        break;
      case "createdAt":
        order = sortOrder(products.createdAt);
        break;
      case "popularityScore":
      default:
        // Production Desirability Approximation:
        // 1. Brand Prestige (Logically implied by sales rank but prioritized for stability)
        // 2. Sales Rank (Main indicator)
        // 3. Review Count (Tie breaker)
        order = [
          asc(sql`COALESCE(${products.salesRank}, 10000000)`),
          desc(products.reviewCount),
        ];
        break;
    }

    const results = await db
      .select({
        product: liteProductColumns,
        price: litePriceColumns,
      })
      .from(products)
      .innerJoin(prices, eq(products.id, prices.productId))
      .where(and(...where))
      .orderBy(...(Array.isArray(order) ? order : [order]))
      .limit((filters.limit || 24) * 3) // Fetch more candidates to account for family deduplication
      .offset(filters.offset || 0);

    const prods = results.map((r) => r.product);

    const pricesByProduct = indexPricesById(results.map((r) => r.price));
    const families = await enrichWithFullSiblings(
      prods,
      pricesByProduct,
      countryCode,
      true,
    );
    return families.slice(0, filters.limit || 24);
  } catch (e) {
    console.warn(
      `[DB Warning] Failed to fetch filtered products: ${e instanceof Error ? e.message : String(e)}`,
    );
    return [];
  }
}

/**
 * Get total count for pagination without fetching records.
 */
async function getFilteredProductsCount(
  category: string,
  countryCode: string,
  filters: any,
): Promise<number> {
  if (IS_BUILD) return 0;
  await dbReady;
  const where: SQL[] = [
    eq(products.category, category),
    eq(prices.country, countryCode),
    gt(prices.price, 0),
  ];

  if (filters.brand?.length) where.push(inArray(products.brand, filters.brand));
  if (filters.condition?.length)
    where.push(inArray(products.condition, filters.condition as any));
  if (filters.technology?.length)
    where.push(inArray(products.technology, filters.technology));
  if (filters.formFactor?.length)
    where.push(inArray(products.formFactor, filters.formFactor));
  if (filters.socket?.length) {
    where.push(
      or(
        ...filters.socket.map(
          (s: string) => sql`${products.title} LIKE ${"%" + s + "%"}`,
        ),
      )!,
    );
  }
  if (filters.cores?.length) {
    where.push(
      or(
        ...filters.cores.map(
          (c: string) => sql`${products.title} LIKE ${"%" + c + "%"}`,
        ),
      )!,
    );
  }
  if (filters.minCapacity)
    where.push(gte(products.normalizedCapacity, filters.minCapacity));
  if (filters.maxCapacity)
    where.push(lte(products.normalizedCapacity, filters.maxCapacity));
  if (filters.minPrice) where.push(gte(prices.price, filters.minPrice));
  if (filters.maxPrice) where.push(lte(prices.price, filters.maxPrice));

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .innerJoin(prices, eq(products.id, prices.productId))
    .where(and(...where));

  return result?.count || 0;
}
