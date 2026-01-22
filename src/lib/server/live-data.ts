import { db } from "@/db";
import { prices } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { litePriceColumns, type Product } from "../product-registry";
import { calculateProductMetrics } from "../utils/products";

/**
 * Fetches the latest prices for a set of product IDs.
 * Use this to overwrite cached price data with fresh data from the DB.
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
    // Map to standardized price logic (Buy Box > Min(Amazon, New) > Used)
    // CRITICAL: Ignore prices <= 0 to avoid broken comparison data.
    const buyBox = p.buyBoxPrice && p.buyBoxPrice > 0 ? p.buyBoxPrice : null;
    const amazon = p.amazonPrice && p.amazonPrice > 0 ? p.amazonPrice : null;
    const marketplace = p.newPrice && p.newPrice > 0 ? p.newPrice : null;
    const used = p.usedPrice && p.usedPrice > 0 ? p.usedPrice : null;

    const price =
      buyBox ??
      (amazon && marketplace
        ? Math.min(amazon, marketplace)
        : (amazon ?? marketplace ?? used));

    if (price) {
      priceMap.set(p.productId, {
        price,
        lastUpdated: p.lastUpdated,
        priceAvg30: p.priceAvg30,
        priceAvg90: p.priceAvg90,
        listPrice: p.listPrice,
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
        priceAvg30: { ...p.priceAvg30, [countryCode]: live.priceAvg30 },
        priceAvg90: { ...p.priceAvg90, [countryCode]: live.priceAvg90 },
        listPrice: { ...p.listPrice, [countryCode]: live.listPrice },
      };

      // Recalculate derived metrics (like savings) based on new prices
      return calculateProductMetrics(updated as any) as Product;
    }
    return p;
  });
}
