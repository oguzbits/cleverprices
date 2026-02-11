import { db } from "@/db";
import { prices } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { withRetry } from "../../db/utils";
import { litePriceColumns, type Product } from "../product-registry";
import { getBestPrice } from "../utils/price-selection";
import {
  calculateProductMetrics,
  calculateProductSavings,
} from "../utils/products";

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

  // Handle synthetic IDs (Hub/Parent Mode offsets)
  const idMap = new Map<number, number>(); // realId -> requestedId
  const realIds = productIds.map((id) => {
    const realId =
      id >= 900000000 ? id - 900000000 : id >= 200000000 ? id - 200000000 : id;
    idMap.set(realId, id);
    return realId;
  });

  const latestPrices = await withRetry(async () => {
    return await db
      .select(litePriceColumns)
      .from(prices)
      .where(
        and(
          inArray(prices.productId, Array.from(new Set(realIds))),
          eq(prices.country, countryCode),
        ),
      );
  });

  const priceMap = new Map();
  latestPrices.forEach((p) => {
    // Lean schema: price is already the consolidated "clever" price
    const price = p.price && p.price > 0 ? p.price : null;
    const usedPrice = p.usedPrice && p.usedPrice > 0 ? p.usedPrice : null;
    const warehousePrice =
      // @ts-ignore - Drizzle generated types might be slightly off for lean schema
      p.warehousePrice && p.warehousePrice > 0 ? p.warehousePrice : null;

    if (price || usedPrice || warehousePrice) {
      const data = {
        price,
        usedPrice,
        warehousePrice,
        lastUpdated: p.lastUpdated,
        priceAvg90: p.priceAvg90,
        listPrice: p.listPrice,
        pricePerUnit: p.pricePerUnit,
        historyJson: p.historyJson,
      };

      // Map back to ALL requested IDs that resolve to this real ID
      productIds.forEach((requestedId) => {
        const mappedRealId =
          requestedId >= 900000000
            ? requestedId - 900000000
            : requestedId >= 200000000
              ? requestedId - 200000000
              : requestedId;

        if (mappedRealId === p.productId) {
          priceMap.set(requestedId, data);
        }
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

      // Unified savings calculation
      const savings = calculateProductSavings({
        price: rawNewPrice,
        usedPrice: newUsedPrice,
        warehousePrice: newWarehousePrice,
        avg90: refPrice,
      });

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
        // PARSE LIVE HISTORY: Attach the parsed history if available in live data
        priceHistory: live.historyJson
          ? (() => {
              const { parseHistoryJson } = require("../product-mapping");
              return parseHistoryJson(live.historyJson);
            })()
          : p.priceHistory,
      };

      // Recalculate derived metrics (like savings) based on new prices
      // [PERFORMANCE] Skip for lean variants (listing/carousel) to save CPU
      if (!p.specifications || Object.keys(p.specifications).length === 0) {
        return updated as Product;
      }
      return calculateProductMetrics(updated as any) as Product;
    }
    return p;
  });
}
