import { db } from "@/db";
import { prices } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { litePriceColumns, type Product } from "../product-registry";
import { calculateProductMetrics } from "../utils/products";

/**
 * Fetches the latest prices for a set of product IDs.
 * Use this to overwrite cached price data with fresh data from the DB.
 *
 * LEAN SCHEMA: Uses consolidated `price` column instead of separate price types.
 */
export async function getLivePricesForProducts(
  productIds: number[],
  countryCode: string,
) {
  "use cache";
  cacheLife("fast"); // 1 minute revalidation

  if (productIds.length === 0) return new Map();

  const latestPrices = await db
    .select(litePriceColumns)
    .from(prices)
    .where(
      and(
        inArray(prices.productId, productIds),
        eq(prices.country, countryCode),
      ),
    );

  const priceMap = new Map();
  latestPrices.forEach((p) => {
    // Lean schema: price is already the consolidated "clever" price
    const price = p.price && p.price > 0 ? p.price : null;

    if (price) {
      priceMap.set(p.productId, {
        price,
        lastUpdated: p.lastUpdated,
        priceAvg90: p.priceAvg90,
        listPrice: p.listPrice,
        pricePerUnit: p.pricePerUnit,
      });
    }
  });

  return priceMap;
}

/**
 * Fetches the latest prices for a single product.
 */
export async function getLivePriceForProduct(
  productId: number,
  countryCode: string,
) {
  const map = await getLivePricesForProducts([productId], countryCode);
  return map.get(productId);
}

/**
 * Merges fresh prices into a list of products.
 * Recalculates derived metrics like savings based on the fresh data.
 */
export async function mergeLivePrices(
  products: Product[],
  countryCode: string,
): Promise<Product[]> {
  const ids = products
    .map((p) => p.id)
    .filter((id): id is number => id !== undefined);
  if (ids.length === 0) return products;

  const priceMap = await getLivePricesForProducts(ids, countryCode);

  return products.map((p) => {
    if (!p.id) return p;
    const live = priceMap.get(p.id);
    if (live) {
      // Create a copy to avoid mutating cached object
      const updated = {
        ...p,
        prices: { ...p.prices, [countryCode]: live.price },
        pricesLastUpdated: {
          ...p.pricesLastUpdated,
          [countryCode]: new Date(live.lastUpdated).toISOString(),
        },
        priceAvg90: { ...p.priceAvg90, [countryCode]: live.priceAvg90 },
        listPrice: { ...p.listPrice, [countryCode]: live.listPrice },
        pricesPerUnit: { ...p.pricesPerUnit, [countryCode]: live.pricePerUnit },
      };

      // Recalculate derived metrics (like savings) based on new prices
      return calculateProductMetrics(updated as any) as Product;
    }
    return p;
  });
}
