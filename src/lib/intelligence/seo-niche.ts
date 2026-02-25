import { db } from "@/db";
import { prices, products, type Product as DbProduct } from "@/db/schema";
import { and, desc, eq, inArray, lte, SQL } from "drizzle-orm";
import type { Product } from "../product-definitions";
import { litePriceColumns, liteProductColumns } from "../product-definitions";
import { mapDbProduct } from "../utils/product-mapping";

export interface NichePage {
  slug: string;
  title: string;
  category: string;
  filters: {
    maxPrice?: number;
    brand?: string;
    condition?: string;
  };
  productCount: number;
}

/**
 * Loads the generated niche manifest.
 */
export async function getNicheBySlug(slug: string): Promise<NichePage | null> {
  try {
    // In production, this would be a JSON file or DB table
    // For now, we read from data/niche-manifest.json
    const manifest = await import("../../../data/niche-manifest.json");
    const niches = manifest.default as NichePage[];
    return niches.find((n) => n.slug === slug) || null;
  } catch {
    return null;
  }
}

/**
 * Fetches products for a specific niche with its unique filtering logic.
 */
async function getNicheProducts(niche: NichePage): Promise<Product[]> {
  const whereClauses: SQL[] = [eq(products.category, niche.category)];

  if (niche.filters.maxPrice) {
    whereClauses.push(lte(prices.price, niche.filters.maxPrice));
  }

  if (niche.filters.brand) {
    whereClauses.push(eq(products.brand, niche.filters.brand));
  }

  // Always require DE prices and a primary condition
  whereClauses.push(eq(prices.country, "de"));

  // 1. Lightweight IDs Query
  const lightweightRows = await db
    .select({
      id: products.id,
    })
    .from(products)
    .innerJoin(prices, eq(products.id, prices.productId))
    .where(and(...whereClauses))
    .orderBy(desc(products.rating), desc(products.monthlySold))
    .limit(40);

  const topIds = lightweightRows.map((r) => r.id);

  if (topIds.length === 0) return [];

  // 2. Fetch full objects only for the top IDs
  const results = await db
    .select({
      product: liteProductColumns,
      price: litePriceColumns,
    })
    .from(products)
    .innerJoin(prices, eq(products.id, prices.productId))
    .where(and(eq(prices.country, "de"), inArray(products.id, topIds)));

  // Restore the correct descending order
  const orderMap = new Map(topIds.map((id, index) => [id, index]));
  results.sort((a, b) => {
    const indexA = orderMap.get(a.product.id) ?? 9999;
    const indexB = orderMap.get(b.product.id) ?? 9999;
    return indexA - indexB;
  });

  return results.map((r) =>
    mapDbProduct(r.product as unknown as DbProduct, [r.price as any]),
  ) as Product[];
}
