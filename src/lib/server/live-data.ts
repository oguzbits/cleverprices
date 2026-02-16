import { db } from "@/db";
import { prices } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { withRetry } from "../../db/utils";
import { litePriceColumns, type Product } from "../product-registry";
import { getBestPrice } from "../utils/price-selection";
import { parseHistoryJson } from "../utils/product-mapping";
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
  includeHistory: boolean = false,
) {
  "use cache";
  cacheLife("minutes"); // Increased from 1m to 5m+ to reduce crawl load on entry-level servers

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
      .select({
        ...litePriceColumns,
        ...(includeHistory ? { historyJson: prices.historyJson } : {}),
      })
      .from(prices)
      .where(
        and(
          inArray(prices.productId, Array.from(new Set(realIds))),
          eq(prices.country, countryCode),
        ),
      );
  });

  const priceMap = new Map();
  latestPrices.forEach((p: any) => {
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
        // PARSE EARLY: Avoid passing raw Buffers through unstable_cache (serialization issues)
        history:
          includeHistory && p.historyJson
            ? parseHistoryJson(p.historyJson)
            : undefined,
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
  includeHistory: boolean = true,
) {
  const map = await getLivePricesForProducts(
    [productId],
    countryCode,
    includeHistory,
  );
  return map.get(productId);
}

/**
 * Merges fresh prices into a list of products.
 * Recalculates derived metrics like savings based on the fresh data.
 */
export async function mergeLivePrices(
  products: Product[],
  countryCode: string,
  includeHistory: boolean = false,
): Promise<Product[]> {
  const ids = products
    .map((p) => p.id)
    .filter((id): id is number => id !== undefined);
  if (ids.length === 0) return products;

  // Only include history if explicitly requested (e.g., for PDP chart)
  const priceMap = await getLivePricesForProducts(
    ids,
    countryCode,
    includeHistory,
  );

  return products.map((p) => {
    if (!p.id) return p;
    const live = priceMap.get(p.id);
    if (live) {
      // FIX: Do NOT overwrite the raw "New Price" with the "Smart Price".
      // Keep them separate so the UI knows the difference.
      const rawNewPrice = live.price || 0;

      // Force "Renewed" condition if title implies it (Amazon compliance & Consistency)
      // MOVE UP so we can use it in getBestPrice()
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

      const smartPrice = getBestPrice({
        price: live.price,
        usedPrice: live.usedPrice,
        warehousePrice: live.warehousePrice,
        condition: condition, // Pass interpreted condition
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

      // (Moved Up) Condition Logic was here

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
        // ATTACH LIVE HISTORY: Use the parsed history from live data if available
        priceHistory: live.history || p.priceHistory,
      };

      // INJECT CURRENT PRICE INTO HISTORY (Fix for Chart Discrepancy)
      // The history blob is historic; the current price is "now".
      if (
        updated.priceHistory &&
        updated.priceHistory.length > 0 &&
        updated.prices[countryCode]
      ) {
        const lastPoint = updated.priceHistory[updated.priceHistory.length - 1];
        const currentPrice = updated.prices[countryCode];
        const currentDate =
          updated.pricesLastUpdated?.[countryCode] || new Date().toISOString();

        // Only append if it's newer than the last history point (by at least an hour to avoid clutter)
        const lastDate = new Date(lastPoint.date).getTime();
        const curDateTs = new Date(currentDate).getTime();

        if (curDateTs > lastDate + 3600000) {
          // Clone array to avoid mutating ref
          updated.priceHistory = [
            ...updated.priceHistory,
            { date: currentDate, price: currentPrice },
          ];
        }
      }

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

/**
 * Selective merge: Fetches history ONLY for the first product (the main PDP product)
 * and only prices for the rest (variants). This saves massive DB overhead/JSON parsing.
 */
export async function mergeLivePricesSelective(
  products: Product[],
  countryCode: string,
  includeHistoryForMain: boolean = false,
): Promise<Product[]> {
  if (products.length === 0) return [];
  if (products.length === 1) {
    return mergeLivePrices(products, countryCode, includeHistoryForMain);
  }

  const mainProduct = products[0];
  const variants = products.slice(1);

  // Fetch data in two chunks if history needed, or one if not
  if (includeHistoryForMain) {
    const [mainWithHistory, variantsOnlyPrices] = await Promise.all([
      mergeLivePrices([mainProduct], countryCode, true),
      mergeLivePrices(variants, countryCode, false),
    ]);
    return [...mainWithHistory, ...variantsOnlyPrices];
  }

  return mergeLivePrices(products, countryCode, false);
}
