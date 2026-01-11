import { db } from "@/db";
import {
  products,
  prices,
  priceHistory,
  type Product as DbProduct,
  type Price,
} from "@/db/schema";
import { calculateProductMetrics } from "./utils/products";
import { eq, inArray } from "drizzle-orm";
import { cacheLife } from "next/cache";

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
  capacity: number;
  capacityUnit: "GB" | "TB" | "W" | "core";
  normalizedCapacity?: number;
  pricePerUnit?: number;
  warranty: string;
  formFactor: string;
  technology?: string;
  condition: "New" | "Used" | "Renewed";
  brand: string;
  certification?: string;
  modularityTyp?: string; // Kept 'Typ' to match legacy usage if any
  priceHistory?: { date: string; price: number }[];
  rating?: number;
  reviewCount?: number;
}

// Helper to map DB to Interface
function mapDbProduct(
  p: DbProduct,
  pricesList: Price[],
  historyList: { recordedAt: Date | null; price: number }[] = [],
): Product {
  const pricesObj: Record<string, number> = {};
  if (pricesList) {
    pricesList.forEach((pr) => {
      if (pr.productId === p.id && pr.amazonPrice) {
        pricesObj[pr.country] = pr.amazonPrice;
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
    affiliateUrl: `https://www.amazon.de/dp/${p.asin}?tag=cleverprices-21`,
    prices: pricesObj,
    capacity: p.capacity || 0,
    capacityUnit: (p.capacityUnit as "TB" | "GB" | "W" | "core") || "TB",
    normalizedCapacity: p.normalizedCapacity || 0,
    warranty: p.warranty || "2 Years",
    formFactor: p.formFactor || "Standard",
    technology: p.technology || "",
    condition: (p.condition as "New" | "Used" | "Renewed") || "New",
    brand: p.brand || "Generic",
    certification: p.certification || undefined,
    modularityTyp: p.modularityType || undefined,
    priceHistory: historyList.map((h) => ({
      date: (h.recordedAt || new Date()).toISOString(),
      price: h.price,
    })),
    rating: p.rating || 0,
    reviewCount: p.reviewCount || 0,
  };

  return calculateProductMetrics(item) as Product;
}

export async function getAllProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("prices");
  const allProducts = await db.select().from(products);
  const allPrices = await db.select().from(prices);

  return allProducts.map((p) =>
    mapDbProduct(
      p,
      allPrices.filter((pr) => pr.productId === p.id),
    ),
  );
}

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  "use cache";
  cacheLife("prices");
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
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  "use cache";
  cacheLife("prices");

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
}

export async function getSimilarProducts(
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
}

export async function getProductsByBrand(
  brand: string,
  excludeSlug?: string,
): Promise<Product[]> {
  // Naive implementation: fetch all is safe for 40 products.
  // Ideally query DB filtering by brand.
  // Using SQL like operator or simple equal if exact match.
  // DB stores 'brand'.
  const all = await getAllProducts(); // reuse mapped
  return all.filter(
    (p) =>
      p.brand.toLowerCase() === brand.toLowerCase() && p.slug !== excludeSlug,
  );
}
