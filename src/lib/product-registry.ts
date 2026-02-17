import { client, db, dbReady } from "@/db";
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
import { unstable_cache } from "next/cache";
import { withRetry } from "../db/utils";
import { getFamilyIdentity } from "./product-families";
import {
  CATEGORY_REVALIDATE_SECONDS,
  PRODUCT_REVALIDATE_SECONDS,
} from "./site-config";
import { calculateSiblingConsensus } from "./utils/product-identity";
import { mapDbProduct } from "./utils/product-mapping";

// Lightweight price columns - lean schema (Drizzle ORM skill: query-select-columns)
export const litePriceColumns = {
  id: prices.id,
  productId: prices.productId,
  country: prices.country,
  price: prices.price,
  usedPrice: prices.usedPrice,
  warehousePrice: prices.warehousePrice,
  listPrice: prices.listPrice,
  priceAvg90: prices.priceAvg90,
  pricePerUnit: prices.pricePerUnit,
  // historyJson: prices.historyJson, // Excluded for performance (listing/live views only need current price)
  currency: prices.currency,
  lastUpdated: prices.lastUpdated,
};

// ULTRA-lightweight price columns for variant lists (No history blobs!)
// This excludes historyJson which can be 90% of the payload size.
export const superLitePriceColumns = {
  id: prices.id,
  productId: prices.productId,
  country: prices.country,
  price: prices.price,
  usedPrice: prices.usedPrice,
  warehousePrice: prices.warehousePrice,
  // listPrice: prices.listPrice, // Often unused in variant buttons
  // priceAvg90: prices.priceAvg90, // Unused in variant buttons? Keep if needed for "Good Price" badge
  // pricePerUnit: prices.pricePerUnit, // Unused in variant buttons
  currency: prices.currency,
  lastUpdated: prices.lastUpdated,
};

// Define lightweight columns for list views to avoid fetching huge JSON/text blobs
export const liteProductColumns = {
  id: products.id,
  asin: products.asin,
  gtin: products.gtin,
  mpn: products.mpn,
  slug: products.slug,
  title: products.title,
  brand: products.brand,
  category: products.category,
  imageUrl: products.imageUrl,
  manufacturer: products.manufacturer,
  capacity: products.capacity,
  capacityUnit: products.capacityUnit,
  normalizedCapacity: products.normalizedCapacity,
  formFactor: products.formFactor,
  technology: products.technology,
  condition: products.condition,
  rating: products.rating,
  reviewCount: products.reviewCount,
  salesRank: products.salesRank,
  monthlySold: products.monthlySold,
  parentAsin: products.parentAsin,
  variationAttributes: products.variationAttributes,
  // specifications: products.specifications, // Often large, but needed for Identity
  specifications: products.specifications,
  officialSpecifications: products.officialSpecifications, // Included for identity resolution consistency
  officialTitle: products.officialTitle,
  energyLabel: products.energyLabel,
  historySeeded: products.historySeeded,
  icecatId: products.icecatId,
  enrichmentStatus: products.enrichmentStatus,
  specificationsSource: products.specificationsSource,
  keepaFeatures: products.keepaFeatures,
  completenessScore: products.completenessScore,
  missingSpecs: products.missingSpecs,
  lastEnrichedAt: products.lastEnrichedAt,
  canonicalId: products.canonicalId,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
};

/**
 * Product Registry - DB Adapter
 * Fetches data from SQLite database seeded with realistic data.
 */

export interface Product {
  id?: number;
  slug: string;
  asin: string;
  title: string;
  rawTitle?: string;
  subtitle?: string;
  category: string;
  image?: string;
  affiliateUrl: string;
  prices: Record<string, number>;
  usedPrices?: Record<string, number>;
  warehousePrices?: Record<string, number>;
  /**
   * Last updated timestamp per country price (ISO string)
   * Essential for Amazon compliance
   */
  pricesLastUpdated?: Record<string, string>;
  parentAsin?: string;
  variationAttributes?: string;
  specifications?: Record<string, any>;
  officialSpecifications?: Record<string, any>;
  officialTitle?: string | null;
  socket?: string;
  cores?: string;
  manufacturer?: string;
  features?: string[]; // Parsed from JSON string

  // Basic properties
  capacity: number;
  capacityUnit: string;
  normalizedCapacity?: number;
  pricePerUnit?: number;
  formFactor: string;
  technology?: string;
  condition: "New" | "Used" | "Renewed";
  brand: string;

  // History & Metrics
  priceHistory?: { date: string; price: number }[];
  rating?: number;
  reviewCount?: number;
  energyLabel?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  salesRank?: number;
  priceAvg90?: Record<string, number>;
  monthlySold?: number;
  mpn?: string;
  popularityScore?: number;
  createdAt?: string; // ISO string
  releaseDate?: string; // Extracted from specs or metadata
  savings?: number; // Calculated savings percentage (0-1)
  listPrice?: Record<string, number>;
  pricesPerUnit?: Record<string, number>;
  isParentView?: boolean; // Flag to indicate we are in aggregated mode

  // Enrichment & Data Quality
  icecatId?: number | null;
  specificationsSource?: string | null;
  enrichmentStatus?:
    | "pending"
    | "processed"
    | "not_found"
    | "error"
    | "optimized"
    | "scavenged"
    | "untrusted_source"
    | null;
  completenessScore?: number | null;
  missingSpecs?: string | null;
  lastEnrichedAt?: Date | null;
  canonicalId?: number | null;
}

// Lite price type for optimized queries (lean schema)
type LitePrice = Pick<
  Price,
  | "id"
  | "productId"
  | "country"
  | "price"
  | "usedPrice"
  | "warehousePrice"
  | "listPrice"
  | "priceAvg90"
  | "pricePerUnit"
  | "currency"
  | "lastUpdated"
> & { historyJson?: Price["historyJson"] };

// Lite price type for optimized queries (lean schema)
export type { LitePrice };

// Re-export mapping logic for backward compatibility
export { mapDbProduct, parseHistoryJson } from "./utils/product-mapping";

export const getProductById = cache(async function getProductById(
  id: number,
  _country = "de", // Parameter kept for signature compatibility
): Promise<Product | undefined> {
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

/**
 * Get the stable canonical ID for a family (Smallest ID in the family).
 * This ensures all variants point to the same Hub ID regardless of price/condition.
 */
export const getCanonicalFamilyId = cache(async function getCanonicalFamilyId(
  parentAsin: string | undefined,
  currentId: number,
): Promise<number> {
  if (!parentAsin) return currentId;

  const fetchCanonicalId = async () => {
    await dbReady;
    const [result] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.parentAsin, parentAsin))
      .orderBy(asc(products.id))
      .limit(1);
    return result?.id ?? currentId;
  };

  // Cache for performance as this is called for every variant link
  return unstable_cache(fetchCanonicalId, [`canonical-id-v1-${parentAsin}`], {
    revalidate: PRODUCT_REVALIDATE_SECONDS,
    tags: ["canonical-id"],
  })();
});

/**
 * Fetch only price history for a specific product and country.
 * Optimized for Hub pages where we just need the history of the cheapest variant.
 */
export async function getProductPriceHistory(
  productId: number,
  countryCode: string = "de",
): Promise<{ date: string; price: number }[]> {
  const fetchHistory = async () => {
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
  };

  return unstable_cache(
    fetchHistory,
    [`product-history-v1-${productId}-${countryCode}`],
    {
      revalidate: PRODUCT_REVALIDATE_SECONDS,
      tags: [`product-history-${productId}`],
    },
  )();
}

/**
 * Handle synthetic IDs for "Alle Varianten" / Parent Views.
 * ID = 900,000,000 + Real_Child_ID
 */
export async function findProductBySyntheticId(
  syntheticId: number,
): Promise<Product | undefined> {
  if (syntheticId < 900000000) return undefined;

  const realId = syntheticId - 900000000;

  // 1. Fetch the requested "Canonical" product (used for ID stability)
  const canonicalProduct = await getProductById(realId);
  if (!canonicalProduct) return undefined;

  // 2. CANONICAL HUB ENFORCEMENT
  // If the requested product is part of a family, we must ensure we are using the TRUE canonical ID.
  // If not, we return the canonical one so the page can redirect.
  if (canonicalProduct.parentAsin) {
    const canonicalRealId = await getCanonicalFamilyId(
      canonicalProduct.parentAsin,
      realId,
    );
    const canonicalSyntheticId = 900000000 + canonicalRealId;

    if (canonicalRealId !== realId) {
      const actualCanonical = await getProductById(canonicalRealId);
      if (actualCanonical) {
        // Recursively call to get the best representative for the TRUE canonical ID
        return findProductBySyntheticId(canonicalSyntheticId);
      }
    }
  }

  // 3. DYNAMIC REPRESENTATIVE SELECTION (Robustness Layer)
  // Instead of blindly returning the canonical product (which might be old/OOS),
  // we fetch all variants and pick the "Best" one to visually represent the family.
  let representative = canonicalProduct;

  if (canonicalProduct.parentAsin) {
    // We use country code 'de' as default for hub optimization
    const variants = await getProductVariants(canonicalProduct, "de");

    if (variants.length > 0) {
      // Sort variants to find the best "Face" for the family
      // Priority:
      // 1. Has Price (In Stock)
      // 2. Is New Condition
      // 3. Has Image
      // 4. Newer (higher ID/createdAt)
      const bestVariant = variants.sort((a, b) => {
        const priceA = a.prices["de"] || 0;
        const priceB = b.prices["de"] || 0;
        const hasPriceA = priceA > 0;
        const hasPriceB = priceB > 0;

        if (hasPriceA !== hasPriceB) return hasPriceA ? -1 : 1;

        const isNewA = a.condition === "New";
        const isNewB = b.condition === "New";
        if (isNewA !== isNewB) return isNewA ? -1 : 1;

        const hasImgA = !!a.image;
        const hasImgB = !!b.image;
        if (hasImgA !== hasImgB) return hasImgA ? -1 : 1;

        return (b.id || 0) - (a.id || 0); // Prefer newer items
      })[0];

      if (bestVariant) {
        representative = bestVariant;
      }
    }
  }

  // 4. Return the "Best" representative, but MASKED with the Synthetic ID
  // This ensures the URL remains stable (pointing to the family) while the content is dynamic/optimal.
  return {
    ...representative,
    id: syntheticId,
    isParentView: true,
  };
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
  try {
    let query = db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        brand: products.brand,
        category: products.category,
        parentAsin: products.parentAsin,
        enrichmentStatus: products.enrichmentStatus,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .orderBy(
        // 1. Optimized products first (Google loves specifications)
        sql`CASE WHEN enrichment_status = 'optimized' THEN 0 ELSE 1 END`,
        // 2. Then by Sales Rank (smaller is more popular)
        asc(products.salesRank),
        // 3. Then by newest updates
        desc(products.updatedAt),
      );

    if (limit) {
      // @ts-ignore - Drizzle limit works
      query = query.limit(limit);
    }

    const allProducts = await query;

    // OPTIMIZATION: Index products by parentAsin for fast sibling lookup
    // This avoids O(N^2) in getFamilyIdentity when processing thousands of products.
    const families = new Map<string, any[]>();
    for (const p of allProducts) {
      if (p.parentAsin) {
        if (!families.has(p.parentAsin)) families.set(p.parentAsin, []);
        families.get(p.parentAsin)!.push(p);
      }
    }

    return allProducts.map((p) => {
      // Only pass family members as variants for consensus
      const siblings = p.parentAsin ? families.get(p.parentAsin) || [] : [p];

      // Generate canonical slug (includes ID prefix) using targeted consensus set
      const { slug: canonical } = getFamilyIdentity(p as any, siblings as any);
      return {
        id: p.id!,
        slug: canonical,
        category: p.category,
        enrichmentStatus: p.enrichmentStatus,
        updatedAt: p.updatedAt || new Date(),
      };
    });
  } catch (e) {
    const isBuild =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.BUILD_PHASE === "1";
    if (!isBuild) {
      console.warn(
        "[Product Registry] Database missing or inaccessible in getAllProductSlugs.",
      );
    }
    return [];
  }
}

/**
 * Get all category slugs that have at least one product with "optimized" status.
 * Used for filtering the sitemap and preventing thin content.
 */
export async function getNonEmptyCategorySlugs(): Promise<string[]> {
  const fetchNonEmpty = async () => {
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
          ]),
        )
        .groupBy(products.category);

      // SAFETY: If we have 0 categories in production, something is wrong (likely syncing).
      // Throwing prevents caching a "no categories" state which leads to persistent 404s.
      if (results.length === 0 && process.env.NODE_ENV === "production") {
        throw new Error(
          "No non-empty categories found. Database might be empty or syncing.",
        );
      }

      return results.map((r) => r.category);
    } catch (e) {
      // Differentiate between build-time and runtime failures
      const isBuild =
        process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.BUILD_PHASE === "1";

      if (!isBuild) {
        console.error(
          `[DB Error] getNonEmptyCategorySlugs failed: ${e instanceof Error ? e.message : String(e)}`,
        );
        throw e; // Rethrow at runtime to prevent poisoned cache
      }

      return ["build-time-placeholder"];
    }
  };

  const isScript =
    typeof globalThis === "undefined" ||
    (!(globalThis as any).__incrementalCache && !process.env.NEXT_RUNTIME);

  if (isScript) {
    return fetchNonEmpty();
  }

  return unstable_cache(fetchNonEmpty, ["non-empty-categories-v1"], {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["categories-non-empty"],
  })();
}

/**
 * Parse variation attributes string into key-value pairs
 * Input: "Color: Cosmic Orange; Storage: 2000GB"
 * Output: { Color: "Cosmic Orange", Storage: "2000GB" }
 */
export function parseVariationAttributes(
  attrs: string | undefined,
): Record<string, string> {
  if (!attrs) return {};
  return Object.fromEntries(
    attrs
      .split(";")
      .map((pair) => {
        const [key, ...valueParts] = pair.split(":");
        const value = valueParts.join(":").trim(); // Handle values that might contain ":"
        return [key?.trim(), value];
      })
      .filter(([key, value]) => key && value),
  );
}

/**
 * Extract unique attribute values from a list of variants
 * Returns: { Color: ["Cosmic Orange", "Tiefblau", "Silber"], Storage: ["256GB", "512GB", ...] }
 */
export function extractAttributeGroups(
  variants: Product[],
): Record<string, string[]> {
  const groups: Record<string, Set<string>> = {};

  for (const variant of variants) {
    const attrs = parseVariationAttributes(variant.variationAttributes);
    for (const [key, value] of Object.entries(attrs)) {
      if (!groups[key]) groups[key] = new Set();
      groups[key].add(value);
    }
  }

  // Convert Sets to sorted arrays
  return Object.fromEntries(
    Object.entries(groups).map(([key, valueSet]) => [
      key,
      Array.from(valueSet).sort(),
    ]),
  );
}

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
  await dbReady;
  const allProducts = await withRetry(() =>
    db.select(liteProductColumns).from(products),
  );
  const allPrices = await withRetry(() =>
    db.select(litePriceColumns).from(prices),
  ); // Drizzle ORM skill: query-select-columns

  const pricesByProduct = indexPricesById(allPrices);

  return allProducts.map(
    (
      p, // Kept allProducts.map as 'prods' was undefined
    ) => mapDbProduct(p as DbProduct, pricesByProduct.get(p.id!) || []),
  );
}

/**
 * Helper: Index an array of prices by productId for O(1) lookups.
 * Accepts any object with productId (supports both full Price and litePriceColumns result).
 */
type PriceWithProductId = {
  productId: number;
  country?: string | null;
} & Partial<Price>;
function indexPricesById<T extends { productId: number }>(
  pricesList: T[],
): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const pr of pricesList) {
    if (!map.has(pr.productId)) map.set(pr.productId, []);
    map.get(pr.productId)!.push(pr);
  }
  return map;
}

/**
 * [CONSISTENCY FIX] Ensures that listing views see the same siblings as the product page.
 * This prevents slug mismatches and unnecessary redirects.
 */
async function enrichWithFullSiblings(
  prods: any[],
  pricesByProduct: Map<number, LitePrice[]>,
  countryCode: string,
  stripHeavyData: boolean = true,
  collapseFamilies: boolean = false, // Default to FALSE to show all variants in lists
): Promise<Product[]> {
  if (prods.length === 0) return [];

  const parentAsins = [
    ...new Set(prods.map((p) => p.parentAsin).filter(Boolean)),
  ];

  let allSiblings: any[] = [];
  if (parentAsins.length > 0) {
    allSiblings = await db
      .select(liteProductColumns)
      .from(products)
      .where(inArray(products.parentAsin, parentAsins as string[]));
  }

  const siblingsByParent = new Map<string, any[]>();
  const allSiblingIds = allSiblings.map((s) => s.id);

  // Fetch prices for ALL siblings to ensure representative selection is accurate
  const allSiblingPrices =
    allSiblingIds.length > 0
      ? await withRetry(() =>
          db
            .select(litePriceColumns)
            .from(prices)
            .where(
              and(
                inArray(prices.productId, allSiblingIds),
                eq(prices.country, countryCode),
              ),
            ),
        )
      : [];

  const pricesBySiblingId = indexPricesById(allSiblingPrices);

  for (const s of allSiblings) {
    if (s.parentAsin) {
      if (!siblingsByParent.has(s.parentAsin))
        siblingsByParent.set(s.parentAsin, []);

      // Attach prices to the sibling object for mapDbProduct
      const mappedSibling = {
        ...s,
        prices: pricesBySiblingId.get(s.id!)
          ? Object.fromEntries(
              pricesBySiblingId.get(s.id!)!.map((pr) => [pr.country, pr.price]),
            )
          : {},
      };
      siblingsByParent.get(s.parentAsin)!.push(mappedSibling);
    }
  }

  const { getFamilyRepresentative } = await import("./product-families");

  const seenFamilies = new Set<string>();
  const results: Product[] = [];

  for (const p of prods) {
    const familyKey = p.parentAsin || `singleton-${p.id}`;

    // Collapsing logic: If requested, only take the first member of each family
    if (collapseFamilies) {
      if (seenFamilies.has(familyKey)) continue;
      seenFamilies.add(familyKey);

      const siblings = p.parentAsin
        ? siblingsByParent.get(p.parentAsin) || [p]
        : [p];

      // Choose the best representative (cheapest new condition)
      const representative = getFamilyRepresentative(siblings) || p;

      // Get prices: Prefer the pre-indexed pricesByProduct if it's one of the original prods,
      // otherwise use the freshly fetched sibling prices.
      const repPrices =
        pricesByProduct.get(representative.id!) ||
        pricesBySiblingId.get(representative.id!) ||
        [];

      results.push(
        mapDbProduct(
          representative as DbProduct,
          repPrices,
          siblings,
          stripHeavyData,
        ),
      );
    } else {
      // Flat Mode: Return EVERY product in the list, but ensure it's mapped with its family context
      const siblings = p.parentAsin
        ? siblingsByParent.get(p.parentAsin) || [p]
        : [p];

      results.push(
        mapDbProduct(
          p as DbProduct,
          pricesByProduct.get(p.id!) || pricesBySiblingId.get(p.id!) || [],
          siblings,
          stripHeavyData,
        ),
      );
    }
  }

  return results;
}

import { cache } from "react";

// Use React.cache for per-request deduplication (Production Optimization: server-cache-react)
export const getProductsByCategory = cache(async function getProductsByCategory(
  category: string,
  stripHeavyData: boolean = true, // Default to true for category lists
  limit?: number,
  collapseFamilies: boolean = false, // Default to FALSE to show all variants
): Promise<Product[]> {
  if (!category) return [];
  const fetchProducts = async () => {
    await dbReady;
    const { prods, prs } = await withRetry(async () => {
      let query = db
        .select(liteProductColumns)
        .from(products)
        .where(eq(products.category, category));

      if (limit) {
        // @ts-ignore - drizzle type complexity with dynamic orders
        query = query.orderBy(desc(products.salesRank)).limit(limit);
      }

      const prods = await query;

      if (prods.length === 0) return { prods: [], prs: [] };

      const ids = prods.map((p) => p.id);
      const prs = await db
        .select(litePriceColumns)
        .from(prices)
        .where(inArray(prices.productId, ids));

      return { prods, prs };
    });

    if (prods.length === 0) return [];

    const pricesByProduct = indexPricesById(prs);

    return enrichWithFullSiblings(
      prods,
      pricesByProduct,
      "de",
      stripHeavyData,
      collapseFamilies,
    );
  };

  // Skip cache if we're not in a Next.js environment (e.g. running scripts)
  const isScript =
    typeof globalThis === "undefined" ||
    (!(globalThis as any).__incrementalCache && !process.env.NEXT_RUNTIME);

  if (isScript) {
    return fetchProducts();
  }

  // Use Next.js Data Cache to persist results across requests/users
  return unstable_cache(
    fetchProducts,
    [`category-products-v34-${category}-${stripHeavyData}-${limit || "all"}`],
    {
      revalidate: CATEGORY_REVALIDATE_SECONDS,
      tags: ["category-products", `cat-${category}`, "v48"],
    },
  )();
});

const fetchProductBySlug = cache(
  async (
    slug: string,
    _includeHistory: boolean = false, // History now comes from historyJson in prices
  ): Promise<Product | undefined> => {
    if (!slug) return undefined;
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

  return unstable_cache(
    fetchProductBySlug,
    [`product-slug-v7-${slug}-${includeHistory}`],
    {
      revalidate: PRODUCT_REVALIDATE_SECONDS,
      tags: [`product-v7-${slug}`],
    },
  )(slug, includeHistory);
});

const fetchProductByAsin = async (
  asin: string,
): Promise<Product | undefined> => {
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

  return unstable_cache(fetchProductByAsin, [`product-asin-v1-${asin}`], {
    revalidate: PRODUCT_REVALIDATE_SECONDS,
    tags: [`product-v1-asin-${asin}`],
  })(asin);
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
  await dbReady;
  // Extract potential ASIN from old slug
  // 1. Try full 10-char ASIN (standard Amazon)
  const fullAsinMatch = oldSlug.match(/([a-z0-9]{10})$/i);
  if (fullAsinMatch) {
    const asin = fullAsinMatch[1].toUpperCase();
    // Indexed lookup is O(1)
    const [p] = await withRetry(() =>
      db
        .select({ slug: products.slug })
        .from(products)
        .where(eq(products.asin, asin))
        .limit(1),
    );
    if (p) return p.slug;
  }

  // 2. Try short 3-4 char suffix (common in our generated slugs)
  // ONLY do this if the slug actually looks like it has a suffix (ends in -XXX or -XXXX)
  const shortSuffixMatch = oldSlug.match(/-([a-z0-9]{3,4})$/i);
  if (shortSuffixMatch) {
    const suffix = shortSuffixMatch[1].toUpperCase();

    // Safety: LIKE '%XXXX' is a full table scan O(N).
    // We only do this if N is small or we have no other choice.
    // In CleverPrices, we'll keep it but ensure it's the last resort.
    const [p] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(
        and(
          sql`${products.asin} LIKE ${"%" + suffix}`,
          // Optimization: usually these are in the same category or related
          // but since we don't know the category from the slug easily,
          // we just limit to 1.
        ),
      )
      .limit(1);
    return p?.slug;
  }

  return undefined;
}

export const findProductByParentAsinSuffix = cache(
  async function findProductByParentAsinSuffix(
    slug: string,
  ): Promise<Product | undefined> {
    if (!slug) return undefined;
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

  return unstable_cache(
    fetchSimilarProducts,
    [`similar-products-v20-${product.category}-${countryCode}`], // Key parts (args are hashed automatically)
    {
      revalidate: PRODUCT_REVALIDATE_SECONDS,
      tags: [`similar-v20-${product.category}`],
    },
  )(product.category, product.slug, currentPrice, limit, countryCode);
});

export async function searchProducts(
  query: string,
  limit: number = 20,
): Promise<Product[]> {
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

export const getProductsByBrand = cache(async function getProductsByBrand(
  brand: string,
  excludeSlug?: string,
): Promise<Product[]> {
  if (!brand) return [];
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

const getCachedDeals = unstable_cache(
  async (limit: number, countryCode: string, condition?: string) => {
    await dbReady;
    try {
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
  },
  ["best-deals-v14"],
  {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["products", "deals", "v14"],
  },
);

export const getBestDeals = cache(async function getBestDeals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
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

const getCachedPopular = unstable_cache(
  async (limit: number, countryCode: string, condition?: string) => {
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
          .where(
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          )
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
            and(
              inArray(prices.productId, ids),
              eq(prices.country, countryCode),
            ),
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
  },
  ["popular-deals-v14"],
  {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["products", "popular", "v14"],
  },
);

export const getMostPopular = cache(async function getMostPopular(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
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
const fetchDiversePopular = unstable_cache(
  async (itemsPerCategory: number, countryCode: string) => {
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
            and(
              inArray(prices.productId, ids),
              eq(prices.country, countryCode),
            ),
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
  },
  ["diverse-popular-v14"],
  {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["products", "popular", "diverse", "v14"],
  },
);

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

const getCachedNew = unstable_cache(
  async (limit: number, countryCode: string, condition?: string) => {
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

      const prods = await db
        .select(liteProductColumns)
        .from(products)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(products.createdAt))
        .limit(limit);

      console.log(
        `[DB DEBUG] getCachedNew found ${prods.length} products for ${countryCode} (condition: ${condition})`,
      );
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
    } catch (e) {
      console.warn(
        `[DB Warning] Failed to fetch new arrivals: ${e instanceof Error ? e.message : String(e)}`,
      );
      return [];
    }
  },
  ["new-arrivals-v14"],
  {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["products", "new", "v14"],
  },
);

export async function getNewArrivals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
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
export async function getFilteredProducts(
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
export async function getFilteredProductsCount(
  category: string,
  countryCode: string,
  filters: any,
): Promise<number> {
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
