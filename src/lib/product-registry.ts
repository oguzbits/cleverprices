import { db } from "@/db";
import {
  priceHistory,
  prices,
  products,
  type Product as DbProduct,
  type Price,
} from "@/db/schema";
import { and, asc, desc, eq, gt, inArray, like, or, sql } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { calculateProductMetrics } from "./utils/products";

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
  /**
   * Last updated timestamp per country price (ISO string)
   * Essential for Amazon compliance
   */
  pricesLastUpdated?: Record<string, string>;
  parentAsin?: string;
  variationAttributes?: string;
  specifications?: Record<string, any>;
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
  priceAvg30?: Record<string, number>;
  priceAvg90?: Record<string, number>;
}

// Helper to map DB to Interface
function mapDbProduct(
  p: DbProduct,
  pricesList: Price[],
  historyList: { recordedAt: Date | null; price: number }[] = [],
): Product {
  const pricesObj: Record<string, number> = {};
  const pricesLastUpdatedObj: Record<string, string> = {};
  const avg30Obj: Record<string, number> = {};
  const avg90Obj: Record<string, number> = {};

  if (pricesList) {
    pricesList.forEach((pr) => {
      if (pr.productId === p.id) {
        // Use Amazon price, fallback to New price, then Used price
        const price = pr.amazonPrice || pr.newPrice || pr.usedPrice;
        if (price) {
          pricesObj[pr.country] = price;
          if (pr.lastUpdated) {
            pricesLastUpdatedObj[pr.country] = pr.lastUpdated.toISOString();
          }
          if (pr.priceAvg30) avg30Obj[pr.country] = pr.priceAvg30;
          if (pr.priceAvg90) avg90Obj[pr.country] = pr.priceAvg90;
        }
      }
    });
  }

  const item: Product = {
    id: p.id,
    slug: p.slug,
    asin: p.asin,
    title: p.title,
    category: p.category,
    image: p.imageUrl || "",
    affiliateUrl: `https://www.amazon.de/dp/${p.asin}?tag=${process.env.PAAPI_PARTNER_TAG || "realpricedata-21"}`,
    prices: pricesObj,
    pricesLastUpdated: pricesLastUpdatedObj,
    capacity: p.capacity || 0,
    capacityUnit: (p.capacityUnit as any) || "GB",
    normalizedCapacity: p.normalizedCapacity || 0,
    formFactor: p.formFactor || "Standard",
    technology: p.technology || "",
    condition: (p.condition as any) || "New",
    brand: p.brand || "Generic",
    manufacturer: p.manufacturer || undefined,
    parentAsin: p.parentAsin || undefined,
    variationAttributes: p.variationAttributes || undefined,
    specifications: p.specifications ? JSON.parse(p.specifications) : {},
    features: p.features ? JSON.parse(p.features) : [],
    priceHistory: historyList.map((h) => ({
      date: (h.recordedAt || new Date()).toISOString(),
      price: h.price,
    })),
    rating: p.rating || 0,
    reviewCount: p.reviewCount || 0,
    energyLabel: p.energyLabel as any,
    salesRank: p.salesRank || undefined,
    priceAvg30: avg30Obj,
    priceAvg90: avg90Obj,
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

export async function getAllProducts(): Promise<Product[]> {
  const allProducts = await db.select().from(products);
  const allPrices = await db.select().from(prices);

  // Group prices by productId for O(1) lookup
  const pricesByProduct = new Map<number, Price[]>();
  for (const pr of allPrices) {
    if (!pricesByProduct.has(pr.productId)) {
      pricesByProduct.set(pr.productId, []);
    }
    pricesByProduct.get(pr.productId)!.push(pr);
  }

  return allProducts.map((p) =>
    mapDbProduct(p, pricesByProduct.get(p.id!) || []),
  );
}

import { cache } from "react";

// Use React.cache for per-request deduplication (Vercel Best Practices: server-cache-react)
export const getProductsByCategory = cache(async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  const prods = await db
    .select()
    .from(products)
    .where(eq(products.category, category));
  if (prods.length === 0) return [];

  const ids = prods.map((p) => p.id);
  const prs = await db
    .select()
    .from(prices)
    .where(inArray(prices.productId, ids));

  return prods.map((p) =>
    mapDbProduct(
      p,
      prs.filter((pr) => pr.productId === p.id),
    ),
  );
});

export const getProductBySlug = cache(async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  const [p] = await db.select().from(products).where(eq(products.slug, slug));
  if (!p) return undefined;

  const prs = await db.select().from(prices).where(eq(prices.productId, p.id));

  // Fetch price history (limit to last 90 days or 100 points to keep it light)
  const history = await db
    .select()
    .from(priceHistory)
    .where(eq(priceHistory.productId, p.id))
    .orderBy(priceHistory.recordedAt);

  return mapDbProduct(p, prs, history);
});

export const getSimilarProducts = cache(async function getSimilarProducts(
  product: Product,
  limit: number = 4,
  countryCode: string = "de",
): Promise<Product[]> {
  // Fetch category products
  const categoryProducts = await getProductsByCategory(product.category);

  const valid = categoryProducts.filter(
    (p) =>
      p.slug !== product.slug &&
      p.prices[countryCode] !== undefined &&
      p.prices[countryCode] > 0,
  );

  const currentPrice = product.prices[countryCode] || 0;

  const sorted = valid.sort((a, b) => {
    const priceA = a.prices[countryCode] || 0;
    const priceB = b.prices[countryCode] || 0;
    return Math.abs(priceA - currentPrice) - Math.abs(priceB - currentPrice);
  });

  return sorted.slice(0, limit);
});

export async function searchProducts(
  query: string,
  limit: number = 20,
): Promise<Product[]> {
  "use cache";
  cacheLife("prices");

  const searchTerms = query.trim().split(/\s+/);
  if (searchTerms.length === 0) return [];

  // Simple fuzzy search using LIKE
  // For better results, we might want full-text search later
  const whereClause = or(
    ...searchTerms.map((term) => like(products.title, `%${term}%`)),
    like(products.category, `%${query}%`),
  );

  const prods = await db
    .select()
    .from(products)
    .where(whereClause)
    .limit(limit);

  if (prods.length === 0) return [];

  const ids = prods.map((p) => p.id);
  const prs = await db
    .select()
    .from(prices)
    .where(inArray(prices.productId, ids));

  return prods.map((p) =>
    mapDbProduct(
      p,
      prs.filter((pr) => pr.productId === p.id),
    ),
  );
}

export async function getProductsByBrand(
  brand: string,
  excludeSlug?: string,
): Promise<Product[]> {
  const prods = await db
    .select()
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
    .select()
    .from(prices)
    .where(inArray(prices.productId, ids));

  return prods.map((p) =>
    mapDbProduct(
      p,
      prs.filter((pr) => pr.productId === p.id),
    ),
  );
}

export async function getBestDeals(
  limit: number = 8,
  countryCode: string = "de",
): Promise<Product[]> {
  "use cache";
  cacheLife("prices");

  try {
    const results = await db
      .select({
        product: products,
        price: prices,
      })
      .from(products)
      .innerJoin(prices, eq(products.id, prices.productId))
      .where(
        and(
          eq(prices.country, countryCode),
          gt(prices.priceAvg90, 0),
          or(gt(prices.amazonPrice, 0), gt(prices.newPrice, 0)),
        ),
      )
      .orderBy(
        desc(
          sql`(${prices.priceAvg90} - COALESCE(${prices.amazonPrice}, ${prices.newPrice})) / ${prices.priceAvg90}`,
        ),
      )
      .limit(limit);

    return results.map((r) => mapDbProduct(r.product, [r.price]));
  } catch (error) {
    console.error("[Product Registry] Error in getBestDeals:", error);
    return [];
  }
}

export async function getMostPopular(
  limit: number = 8,
  countryCode: string = "de",
): Promise<Product[]> {
  "use cache";
  cacheLife("prices");

  try {
    // Use salesRank primarily (lower is better), fallback to secondary signals
    const prods = await db
      .select()
      .from(products)
      .orderBy(
        asc(sql`COALESCE(${products.salesRank}, 10000000)`),
        desc(products.reviewCount),
        desc(products.rating),
      )
      .limit(limit);

    if (prods.length === 0) return [];

    const ids = prods.map((p) => p.id);
    const prs = await db
      .select()
      .from(prices)
      .where(
        and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
      );

    return prods.map((p) =>
      mapDbProduct(
        p,
        prs.filter((pr) => pr.productId === p.id),
      ),
    );
  } catch (error) {
    console.error("[Product Registry] Error in getMostPopular:", error);
    return [];
  }
}

export async function getNewArrivals(
  limit: number = 8,
  countryCode: string = "de",
): Promise<Product[]> {
  "use cache";
  cacheLife("prices");

  const prods = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(limit);

  if (prods.length === 0) return [];

  const ids = prods.map((p) => p.id);
  const prs = await db
    .select()
    .from(prices)
    .where(
      and(inArray(prices.productId, ids), eq(prices.country, countryCode)),
    );

  return prods.map((p) =>
    mapDbProduct(
      p,
      prs.filter((pr) => pr.productId === p.id),
    ),
  );
}
