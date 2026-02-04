import { db } from "@/db";
import { prices } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { litePriceColumns, type Product } from "../product-registry";
import { getBestPrice } from "../utils/price-selection";
import { calculateProductMetrics, calculateSavings } from "../utils/products";

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
    const usedPrice = p.usedPrice && p.usedPrice > 0 ? p.usedPrice : null;
    const warehousePrice =
      p.warehousePrice && p.warehousePrice > 0 ? p.warehousePrice : null;

    if (price || usedPrice || warehousePrice) {
      priceMap.set(p.productId, {
        price,
        usedPrice,
        warehousePrice,
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
      // FIX: Do NOT overwrite the raw "New Price" with the "Smart Price".
      // Keep them separate so the UI knows the difference.
      const rawNewPrice = live.price || 0;

      const smartPrice = getBestPrice({
        price: live.price,
        usedPrice: live.usedPrice,
        warehousePrice: live.warehousePrice,
      });

      const newUsedPrice = live.usedPrice || 0;
      const newWarehousePrice = live.warehousePrice || 0;
      const refPrice = live.priceAvg90 || 0;

      // Savings should be based on the best available price (Smart) vs Reference
      const savings = calculateSavings(smartPrice, refPrice);

      // Force "Renewed" condition if title implies it (Amazon compliance & Consistency)
      let condition = p.condition;
      const titleLower = (p.title || "").toLowerCase();
      if (
        titleLower.includes("(generalüberholt)") ||
        titleLower.includes("generalüberholt") ||
        titleLower.includes("erneuert") ||
        titleLower.includes("renewed") ||
        titleLower.includes("refurbished") ||
        titleLower.includes("b-ware")
      ) {
        condition = "Renewed";
      }

      // Create a copy to avoid mutating cached object
      const updated = {
        ...p,
        condition,
        prices: { ...p.prices, [countryCode]: rawNewPrice }, // Store RAW New Price
        usedPrices: { ...p.usedPrices, [countryCode]: newUsedPrice },
        warehousePrices: {
          ...p.warehousePrices,
          [countryCode]: newWarehousePrice,
        },
        pricesLastUpdated: {
          ...p.pricesLastUpdated,
          [countryCode]: new Date(live.lastUpdated).toISOString(),
        },
        priceAvg90: { ...p.priceAvg90, [countryCode]: refPrice },
        listPrice: { ...p.listPrice, [countryCode]: live.listPrice },
        pricesPerUnit: { ...p.pricesPerUnit, [countryCode]: live.pricePerUnit },
        savings,
      };

      // Recalculate derived metrics (like savings) based on new prices
      return calculateProductMetrics(updated as any) as Product;
    }
    return p;
  });
}
