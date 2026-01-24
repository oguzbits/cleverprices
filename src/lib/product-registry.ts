import { client, db } from "@/db";
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
  lte,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { parseHistoryBlob } from "./history-compression";
import {
  CATEGORY_REVALIDATE_SECONDS,
  PRODUCT_REVALIDATE_SECONDS,
} from "./site-config";
import { calculateProductMetrics } from "./utils/products";

// Lightweight price columns - lean schema (Drizzle ORM skill: query-select-columns)
export const litePriceColumns = {
  id: prices.id,
  productId: prices.productId,
  country: prices.country,
  price: prices.price, // Consolidated "clever" price
  usedPrice: prices.usedPrice,
  listPrice: prices.listPrice,
  priceAvg90: prices.priceAvg90,
  pricePerUnit: prices.pricePerUnit,
  historyJson: prices.historyJson,
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
  specifications: products.specifications, // Keep for filtering logic
  energyLabel: products.energyLabel,
  historySeeded: products.historySeeded,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
  // EXCLUDED: rawData, features, description (removed in lean schema)
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
  category: string;
  image?: string;
  affiliateUrl: string;
  prices: Record<string, number>;
  usedPrices?: Record<string, number>;
  /**
   * Last updated timestamp per country price (ISO string)
   * Essential for Amazon compliance
   */
  pricesLastUpdated?: Record<string, string>;
  parentAsin?: string;
  variationAttributes?: string;
  specifications?: Record<string, any>;
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
}

// Lite price type for optimized queries (lean schema)
type LitePrice = Pick<
  Price,
  | "productId"
  | "country"
  | "price"
  | "usedPrice"
  | "listPrice"
  | "priceAvg90"
  | "pricePerUnit"
  | "historyJson"
  | "lastUpdated"
>;

/**
 * Parse historyJson blob into price history array
 * Format: { "2025-01-15": 4999, "2025-01-16": 5199, ... } (prices in cents)
 * Now supports both legacy TEXT and compressed BLOB formats.
 */
function parseHistoryJson(
  historyJson: Buffer | string | null,
): { date: string; price: number }[] {
  const parsed = parseHistoryBlob(historyJson);
  return Object.entries(parsed)
    .map(([date, priceCents]) => ({
      date: new Date(date).toISOString(),
      price: priceCents / 100, // Convert cents to decimal
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Helper to map DB to Interface (lean schema)
export function mapDbProduct(
  p: DbProduct,
  pricesList: LitePrice[] | Price[],
  _historyList: { recordedAt: Date | null; price: number }[] = [], // Deprecated, use historyJson instead
  stripHeavyData: boolean = false,
): Product {
  const pricesObj: Record<string, number> = {};
  const pricesLastUpdatedObj: Record<string, string> = {};
  const avg90Obj: Record<string, number> = {};
  const listPriceObj: Record<string, number> = {};
  const unitPriceObj: Record<string, number> = {};
  const usedPricesObj: Record<string, number> = {};
  let historyData: { date: string; price: number }[] = [];

  if (pricesList) {
    pricesList.forEach((pr) => {
      // Lean schema: price is already the "clever" consolidated price
      const price = pr.price && pr.price > 0 ? pr.price : null;
      const usedPrice = pr.usedPrice && pr.usedPrice > 0 ? pr.usedPrice : null;

      if ((price || usedPrice) && pr.country) {
        if (price) {
          pricesObj[pr.country] = price;
          if (pr.lastUpdated) {
            // Handle seconds (Unix timestamp) vs milliseconds
            const ts = Number(pr.lastUpdated);
            const date = new Date(ts < 10000000000 ? ts * 1000 : ts);
            pricesLastUpdatedObj[pr.country] = date.toISOString();
          }
          if (pr.priceAvg90) avg90Obj[pr.country] = pr.priceAvg90;
          if (pr.listPrice) listPriceObj[pr.country] = pr.listPrice;
          if (pr.pricePerUnit) unitPriceObj[pr.country] = pr.pricePerUnit;
        }

        if (usedPrice) {
          usedPricesObj[pr.country] = usedPrice;
        }

        // Parse historyJson from first price record (all countries share product history)
        if (
          !stripHeavyData &&
          historyData.length === 0 &&
          "historyJson" in pr
        ) {
          historyData = parseHistoryJson(pr.historyJson as string | null);
        }
      }
    });
  }

  // Extract core specifications for filtering before stripping
  const rawSpecs = p.specifications ? JSON.parse(p.specifications) : {};
  let socket = rawSpecs.Socket || rawSpecs["Socket-Typ"];
  let cores = rawSpecs.Cores || rawSpecs.Kerne;
  let releaseDate =
    rawSpecs["Release Date"] ||
    rawSpecs["Erscheinungsdatum"] ||
    rawSpecs["Markteinführung"] ||
    rawSpecs["Modelljahr"] ||
    rawSpecs["Model Year"];

  // CPU specific title parsing fallback
  if (p.category === "cpu" || p.category === "motherboards") {
    if (!socket) {
      const socketMatch = (p.title || "").match(
        /(AM[45]|LGA\s?(\d{4})|sTRX4|sWRX8|Socket\s?[A-Z0-9]+|TR4|FM[12]|LGA\s?115[0156])/i,
      );
      if (socketMatch) socket = socketMatch[0].toUpperCase().replace(/\s+/, "");
    }
    if (!cores && p.category === "cpu") {
      const coreMatch = (p.title || "").match(/(\d+)\s?-?\s?(Core|Kerne)/i);
      if (coreMatch) cores = parseInt(coreMatch[1]).toString();
    }
  }

  const item: Product = {
    id: p.id,
    slug: p.slug,
    asin: p.asin,
    title: p.title,
    category: p.category,
    image: p.imageUrl || "",
    affiliateUrl: stripHeavyData
      ? ""
      : `https://www.amazon.de/dp/${p.asin}?tag=${process.env.PAAPI_PARTNER_TAG || "cleverprices-21"}`,
    prices: pricesObj,
    pricesLastUpdated: stripHeavyData ? {} : pricesLastUpdatedObj,
    capacity: p.capacity || 0,
    capacityUnit: (p.capacityUnit as any) || "GB",
    normalizedCapacity: p.normalizedCapacity || 0,
    formFactor: stripHeavyData ? "" : p.formFactor || "",
    technology: p.technology || "",
    socket,
    cores,
    condition:
      p.title.includes("(Generalüberholt)") ||
      p.title.includes("erneuert") ||
      p.title.includes("Renewed")
        ? "Renewed"
        : (p.condition as any) === "Used"
          ? "Used"
          : "New",
    brand: p.brand || "Generic",
    manufacturer: stripHeavyData ? undefined : p.manufacturer || undefined,
    parentAsin: p.parentAsin || undefined,
    variationAttributes: p.variationAttributes || undefined,
    specifications: stripHeavyData ? {} : rawSpecs,
    features: [], // Removed in lean schema
    priceHistory: stripHeavyData ? [] : historyData,
    rating: p.rating || 0,
    reviewCount: p.reviewCount || 0,
    energyLabel: stripHeavyData ? undefined : (p.energyLabel as any),
    salesRank: p.salesRank || undefined,
    monthlySold: p.monthlySold || 0,
    mpn: p.mpn || undefined,
    priceAvg90: avg90Obj,
    listPrice: listPriceObj,
    pricesPerUnit: unitPriceObj,
    usedPrices: usedPricesObj,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    releaseDate,
  };

  return calculateProductMetrics(item) as Product;
}

export async function getAllProductSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  return db
    .select({
      slug: products.slug,
      updatedAt: products.updatedAt,
    })
    .from(products);
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
export async function getProductVariants(
  product: Product,
  countryCode: string = "de",
): Promise<Product[]> {
  // If this product has no parentAsin, it has no variants
  if (!product.parentAsin) return [];

  // Fetch all products with the same parentAsin
  const variantProducts = await db
    .select(liteProductColumns)
    .from(products)
    .where(eq(products.parentAsin, product.parentAsin));

  if (variantProducts.length <= 1) return [];

  // Fetch prices for all variants
  const ids = variantProducts.map((p) => p.id);
  const variantPrices = await db
    .select(litePriceColumns)
    .from(prices)
    .where(
      and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
    );

  const pricesByProduct = indexPricesById(variantPrices);

  // Map and sort by price
  const mappedVariants = variantProducts
    .map((p) =>
      mapDbProduct(p as DbProduct, pricesByProduct.get(p.id!) || [], [], true),
    )
    .filter(
      (v) =>
        (v.prices[countryCode] || 0) > 0 ||
        (v.usedPrices?.[countryCode] || 0) > 0,
    )
    .sort((a, b) => {
      const pA = a.prices[countryCode] || a.usedPrices?.[countryCode] || 0;
      const pB = b.prices[countryCode] || b.usedPrices?.[countryCode] || 0;
      return pA - pB;
    });

  return mappedVariants;
}

/**
 * Get all products in a family (sharing same parentAsin)
 * Used for the "Alle Varianten" hub page
 */
export async function getProductFamilyMembers(
  parentAsin: string,
  countryCode: string = "de",
): Promise<Product[]> {
  const familyProducts = await db
    .select(liteProductColumns)
    .from(products)
    .where(eq(products.parentAsin, parentAsin));

  if (familyProducts.length === 0) return [];

  const ids = familyProducts.map((p) => p.id);
  const familyPrices = await db
    .select(litePriceColumns)
    .from(prices)
    .where(
      and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
    );

  const pricesByProduct = indexPricesById(familyPrices);

  return familyProducts
    .map((p) =>
      mapDbProduct(p as DbProduct, pricesByProduct.get(p.id!) || [], [], true),
    )
    .filter(
      (v) =>
        (v.prices[countryCode] || 0) > 0 ||
        (v.usedPrices?.[countryCode] || 0) > 0,
    )
    .sort((a, b) => {
      const pA = a.prices[countryCode] || a.usedPrices?.[countryCode] || 0;
      const pB = b.prices[countryCode] || b.usedPrices?.[countryCode] || 0;
      return pA - pB;
    });
}

export async function getAllProducts(): Promise<Product[]> {
  const allProducts = await db.select(liteProductColumns).from(products);
  const allPrices = await db.select(litePriceColumns).from(prices); // Drizzle ORM skill: query-select-columns

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
type PriceWithProductId = { productId: number } & Partial<Price>;
function indexPricesById<T extends PriceWithProductId>(
  pricesList: T[],
): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const pr of pricesList) {
    if (!map.has(pr.productId)) map.set(pr.productId, []);
    map.get(pr.productId)!.push(pr);
  }
  return map;
}

import { cache } from "react";

// Use React.cache for per-request deduplication (Vercel Best Practices: server-cache-react)
export const getProductsByCategory = cache(async function getProductsByCategory(
  category: string,
  stripHeavyData: boolean = true, // Default to true for category lists
): Promise<Product[]> {
  const fetchProducts = async () => {
    const prods = await db
      .select(liteProductColumns)
      .from(products)
      .where(eq(products.category, category));
    if (prods.length === 0) return [];

    const ids = prods.map((p) => p.id);
    const prs = await db
      .select(litePriceColumns)
      .from(prices)
      .where(inArray(prices.productId, ids));

    const pricesByProduct = indexPricesById(prs);

    return prods.map((p) => {
      const mapped = mapDbProduct(
        p as DbProduct,
        pricesByProduct.get(p.id!) || [],
        [],
        stripHeavyData,
      );

      // ALWAYS strip extremely heavy fields for category lists to stay under 2MB cache limit.
      // These are only needed on the single product page fetched via getProductBySlug.
      mapped.features = [];

      return mapped;
    });
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
    [`category-products-v31-${category}-${stripHeavyData}`],
    {
      revalidate: CATEGORY_REVALIDATE_SECONDS,
      tags: [`category-v31-${category}`],
    },
  )();
});

const fetchProductBySlug = async (
  slug: string,
  _includeHistory: boolean = false, // History now comes from historyJson in prices
): Promise<Product | undefined> => {
  const getProductAndPrices = async (targetSlug: string) => {
    const [p] = await db
      .select()
      .from(products)
      .where(eq(products.slug, targetSlug))
      .limit(1);

    if (!p) return undefined;

    const prs = await db
      .select()
      .from(prices)
      .where(eq(prices.productId, p.id));

    return mapDbProduct(p as any, prs as any);
  };

  // Try exact match first
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
};

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
    [`product-slug-v5-${slug}-${includeHistory}`],
    {
      revalidate: PRODUCT_REVALIDATE_SECONDS,
      tags: [`product-v5-${slug}`],
    },
  )(slug, includeHistory);
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
  // Extract potential ASIN from old slug
  // 1. Try full 10-char ASIN (standard Amazon)
  const fullAsinMatch = oldSlug.match(/([a-z0-9]{10})$/i);
  if (fullAsinMatch) {
    const asin = fullAsinMatch[1].toUpperCase();
    // Indexed lookup is O(1)
    const [p] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.asin, asin))
      .limit(1);
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

/**
 * Find a product by Parent ASIN suffix.
 * Used for neutral parent slugs (e.g. apple-iphone-15-[parent-suffix]).
 */
export async function findProductByParentAsinSuffix(
  slug: string,
): Promise<Product | undefined> {
  const shortSuffixMatch = slug.match(/-([a-z0-9]{3,4})$/i);
  if (!shortSuffixMatch) return undefined;

  const suffix = shortSuffixMatch[1].toUpperCase();
  const prefix = slug.slice(0, slug.lastIndexOf("-"));
  const keywords = prefix
    .split("-")
    .filter((k) => k.length >= 2)
    .slice(0, 3); // Take first 3 meaningful tokens (e.g. apple, iphone, 17)

  // Search by parent_asin suffix + title keywords to avoid collision (e.g. s25 vs s24)
  const conditions = [sql`${products.parentAsin} LIKE ${"%" + suffix}`];

  // Apply keyword filters if any found
  for (const k of keywords) {
    conditions.push(like(products.title, `%${k}%`));
  }

  const [p] = await db
    .select(liteProductColumns)
    .from(products)
    .where(and(...conditions))
    .limit(1);

  if (!p) return undefined;

  // IMPORTANT: We found a child, but we mark it as parent view
  const prs = await db
    .select(litePriceColumns)
    .from(prices)
    .where(eq(prices.productId, p.id));

  const product = mapDbProduct(p as DbProduct, prs);
  return { ...product, isParentView: true };
}

const fetchSimilarProducts = async (
  category: string,
  excludedSlug: string,
  targetPrice: number,
  limit: number,
  countryCode: string,
) => {
  // Fetch category products (already cached via getProductsByCategory)
  // Use stripHeavyData=true to avoid huge blobs since we only need simple props + prices
  const categoryProducts = await getProductsByCategory(category, true);

  const valid = categoryProducts.filter(
    (p) =>
      p.slug !== excludedSlug &&
      p.prices[countryCode] !== undefined &&
      p.prices[countryCode] > 0,
  );

  const sorted = valid.sort((a: any, b: any) => {
    const priceA = a.prices[countryCode] || 0;
    const priceB = b.prices[countryCode] || 0;
    return Math.abs(priceA - targetPrice) - Math.abs(priceB - targetPrice);
  });

  return sorted.slice(0, limit);
};

export const getSimilarProducts = cache(async function getSimilarProducts(
  product: Product,
  limit: number = 4,
  countryCode: string = "de",
): Promise<Product[]> {
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

    return sortedProds.map((p) =>
      mapDbProduct(
        p as DbProduct,
        pricesByProduct.get(p.id!) || [],
        [],
        true, // Strip heavy data for search results
      ),
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

    return fallbackProds.map((p) =>
      mapDbProduct(
        p as DbProduct,
        fallbackPricesByProduct.get(p.id!) || [],
        [],
        true, // Strip heavy data for search results (fallback)
      ),
    );
  }
}

export async function getProductsByBrand(
  brand: string,
  excludeSlug?: string,
): Promise<Product[]> {
  const prods = await db
    .select(liteProductColumns)
    .from(products)
    .where(
      and(
        eq(sql`LOWER(${products.brand})`, brand.toLowerCase()),
        excludeSlug ? sql`${products.slug} != ${excludeSlug}` : sql`1=1`,
      ),
    );

  if (prods.length === 0) return [];

  const ids = prods.map((p) => p.id);
  const prs = await db
    .select(litePriceColumns)
    .from(prices)
    .where(inArray(prices.productId, ids));

  const pricesByProduct = indexPricesById(prs);

  return prods.map((p) =>
    mapDbProduct(p as DbProduct, pricesByProduct.get(p.id!) || []),
  );
}

const getCachedDeals = unstable_cache(
  async (limit: number, countryCode: string, condition?: string) => {
    // Lean schema: use consolidated `price` column instead of amazonPrice/newPrice
    const whereConditions = [
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

    const results = await db
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
      .limit(limit);

    return results.map((r) =>
      mapDbProduct(r.product as DbProduct, [r.price], [], true),
    );
  },
  ["best-deals-v12"],
  {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["products", "deals", "v12"],
  },
);

export async function getBestDeals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
  const isScript =
    typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;
  if (isScript) {
    // Fallback for scripts where unstable_cache might not be available or needed
    const results = await db
      .select({ product: liteProductColumns, price: litePriceColumns })
      .from(products)
      .innerJoin(prices, eq(products.id, prices.productId))
      .where(
        and(
          eq(prices.country, countryCode),
          condition ? eq(products.condition, condition) : undefined,
        ),
      )
      .limit(limit);
    return results.map((r) =>
      mapDbProduct(r.product as DbProduct, [r.price], [], true),
    );
  }
  return getCachedDeals(limit, countryCode, condition);
}

const getCachedPopular = unstable_cache(
  async (limit: number, countryCode: string, condition?: string) => {
    const whereConditions = [];
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
      .orderBy(
        asc(sql`COALESCE(${products.salesRank}, 10000000)`),
        desc(products.reviewCount),
        desc(products.rating),
      )
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

    return prods
      .map((p) =>
        mapDbProduct(
          p as DbProduct,
          pricesByProduct.get(p.id!) || [],
          [],
          true,
        ),
      )
      .filter((p) => p.prices[countryCode] && p.prices[countryCode] > 0);
  },
  ["popular-deals-v12"],
  {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["products", "popular", "v12"],
  },
);

export async function getMostPopular(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
  const isScript =
    typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;
  if (isScript) {
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

    return prods.map((p) =>
      mapDbProduct(p as DbProduct, pricesByProduct.get(p.id!) || [], [], true),
    );
  }
  return getCachedPopular(limit, countryCode, condition);
}

/**
 * FETCHING OPTIMIZATION: Get a diverse set of popular products (Top N per category)
 * This uses a SQL Window Function to ensure we get candidates from all categories
 * instead of just 200 items from the most popular category.
 */
export async function getDiverseMostPopular(
  itemsPerCategory: number = 10,
  countryCode: string = "de",
): Promise<Product[]> {
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

  // 2. Fetch full (lite) data for these specific IDs
  const prods = await db
    .select(liteProductColumns)
    .from(products)
    .where(inArray(products.id, ids));

  const prs = await db
    .select(litePriceColumns)
    .from(prices)
    .where(
      and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
    );

  const pricesByProduct = indexPricesById(prs);

  return prods
    .map((p) =>
      mapDbProduct(
        p as DbProduct,
        pricesByProduct.get(p.id!) || [],
        [],
        true, // Strip heavy data (Home curation doesn't need specs)
      ),
    )
    .filter((p) => p.prices[countryCode] && p.prices[countryCode] > 0);
}

const getCachedNew = unstable_cache(
  async (limit: number, countryCode: string, condition?: string) => {
    const whereConditions = [];
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

    if (prods.length === 0) return [];

    const ids = prods.map((p) => p.id);
    const prs = await db
      .select(litePriceColumns)
      .from(prices)
      .where(
        and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
      );

    const pricesByProduct = indexPricesById(prs);

    return prods
      .map((p) =>
        mapDbProduct(
          p as DbProduct,
          pricesByProduct.get(p.id!) || [],
          [],
          true,
        ),
      )
      .filter((p) => p.prices[countryCode] && p.prices[countryCode] > 0);
  },
  ["new-arrivals-v12"],
  {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["products", "new", "v12"],
  },
);

export async function getNewArrivals(
  limit: number = 8,
  countryCode: string = "de",
  condition?: "New" | "Used" | "Renewed",
): Promise<Product[]> {
  const isScript =
    typeof globalThis === "undefined" || !process.env.NEXT_RUNTIME;
  if (isScript) {
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

    return prods.map((p) =>
      mapDbProduct(p as DbProduct, pricesByProduct.get(p.id!) || [], [], true),
    );
  }
  return getCachedNew(limit, countryCode, condition);
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
    .limit(filters.limit || 24)
    .offset(filters.offset || 0);

  return results.map((r) =>
    mapDbProduct(r.product as DbProduct, [r.price], [], true),
  );
}

/**
 * Get total count for pagination without fetching records.
 */
export async function getFilteredProductsCount(
  category: string,
  countryCode: string,
  filters: any,
): Promise<number> {
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
