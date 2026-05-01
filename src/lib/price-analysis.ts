/**
 * Price Analysis Service
 *
 * Analyzes price history data to provide "is this a good deal?" recommendations.
 * Works with historyJson blob (lean schema) instead of priceHistory table.
 */

import { and, eq } from "drizzle-orm";

import type { CountryCode } from "@/lib/countries";
import type { PriceAnalysis } from "@/lib/data-sources/types";
import { db } from "../db";
import { prices } from "../db/schema";

import { computePriceAnalysis, parseHistoryJson } from "./price-analysis-utils";
import { getSafeDate, getSafeNow } from "./server/deterministic-time";

/**
 * Calculate price analysis for a product
 */
export async function analyzePriceHistory(
  productId: number,
  country: CountryCode,
  daysBack: number = 90,
): Promise<PriceAnalysis | null> {
  // Fetch current price record with historyJson
  const [priceRecord] = await db
    .select()
    .from(prices)
    .where(and(eq(prices.productId, productId), eq(prices.country, country)))
    .limit(1);

  if (!priceRecord) {
    return null;
  }

  // Get the cutoff date using safe deterministic time
  const now = getSafeNow();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Parse history from historyJson
  const allHistory = parseHistoryJson(priceRecord.historyJson);

  // Filter to requested time window
  const history = allHistory.filter((h) => h.date >= cutoffDate);

  // Get current price (the consolidated "clever" price)
  const currentPrice = priceRecord.price || 0;

  return computePriceAnalysis(currentPrice, history, now);
}

/**
 * Get price history data points for charting (from historyJson)
 */
export async function getPriceHistoryForChart(
  productId: number,
  country: CountryCode,
  daysBack: number = 90,
): Promise<{ date: Date; price: number; priceType: string }[]> {
  // Fetch price record with historyJson
  const [priceRecord] = await db
    .select()
    .from(prices)
    .where(and(eq(prices.productId, productId), eq(prices.country, country)))
    .limit(1);

  if (!priceRecord?.historyJson) {
    return [];
  }

  // Get the cutoff date using safe deterministic time
  const cutoffDate = getSafeDate();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const allHistory = parseHistoryJson(priceRecord.historyJson);

  return allHistory
    .filter((h) => h.date >= cutoffDate)
    .map((h) => ({
      date: h.date,
      price: h.price,
      priceType: "price", // Lean schema: single consolidated price type
    }));
}

/**
 * Check how many days of history we have for a product
 */
export async function getHistoryCoverage(
  productId: number,
  country: CountryCode,
): Promise<{ daysOfData: number; dataPoints: number }> {
  // Fetch price record with historyJson
  const [priceRecord] = await db
    .select()
    .from(prices)
    .where(and(eq(prices.productId, productId), eq(prices.country, country)))
    .limit(1);

  if (!priceRecord?.historyJson) {
    return { daysOfData: 0, dataPoints: 0 };
  }

  const history = parseHistoryJson(priceRecord.historyJson);

  if (history.length === 0) {
    return { daysOfData: 0, dataPoints: 0 };
  }

  const firstDate = history[0].date;
  const lastDate = history[history.length - 1].date;
  const daysOfData = Math.ceil(
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    daysOfData: Math.max(1, daysOfData),
    dataPoints: history.length,
  };
}
