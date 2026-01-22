/**
 * Price Analysis Service
 *
 * Analyzes price history data to provide "is this a good deal?" recommendations.
 * Works with historyJson blob (lean schema) instead of priceHistory table.
 */

import { db } from "@/db";
import { prices } from "@/db/schema";
import type { CountryCode } from "@/lib/countries";
import type { PriceAnalysis } from "@/lib/data-sources/types";
import { and, eq } from "drizzle-orm";
import { parseHistoryBlob } from "./history-compression";

/**
 * Parse historyJson blob into price history array
 * Format: { "2025-01-15": 4999, ... } (prices in cents)
 * Now supports both legacy TEXT and compressed BLOB formats.
 */
function parseHistoryJson(
  historyJson: Buffer | string | null,
): { date: Date; price: number }[] {
  const parsed = parseHistoryBlob(historyJson);
  return Object.entries(parsed)
    .map(([dateStr, priceCents]) => ({
      date: new Date(dateStr),
      price: priceCents / 100, // Convert cents to decimal
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate price analysis for a product
 */
export async function analyzePriceHistory(
  productId: number,
  country: CountryCode,
  daysBack: number = 90,
): Promise<PriceAnalysis | null> {
  // Get the cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Fetch current price record with historyJson
  const priceRecord = await db.query.prices.findFirst({
    where: and(eq(prices.productId, productId), eq(prices.country, country)),
  });

  if (!priceRecord) {
    return null;
  }

  // Parse history from historyJson
  const allHistory = parseHistoryJson(priceRecord.historyJson);

  // Filter to requested time window
  const history = allHistory.filter((h) => h.date >= cutoffDate);

  // Need at least 2 data points for meaningful analysis
  if (history.length < 2) {
    return null;
  }

  // Get current price (the consolidated "clever" price)
  const currentPrice = priceRecord.price;
  if (!currentPrice || currentPrice <= 0) {
    return null;
  }

  // Calculate statistics
  const priceValues = history.map((h) => h.price);
  const sum = priceValues.reduce((a, b) => a + b, 0);
  const averagePrice = sum / priceValues.length;
  const lowestPrice = Math.min(...priceValues);
  const highestPrice = Math.max(...priceValues);

  // Calculate percentages
  const percentFromAverage =
    ((currentPrice - averagePrice) / averagePrice) * 100;
  const percentFromLowest = ((currentPrice - lowestPrice) / lowestPrice) * 100;

  // Determine recommendation
  let recommendation: PriceAnalysis["recommendation"];
  let recommendationText: string;

  if (percentFromLowest <= 5) {
    recommendation = "great_deal";
    recommendationText = "This is near the lowest price we've tracked!";
  } else if (percentFromAverage <= -10) {
    recommendation = "great_deal";
    recommendationText = `${Math.abs(percentFromAverage).toFixed(0)}% below average price`;
  } else if (percentFromAverage <= -5) {
    recommendation = "good_price";
    recommendationText = `${Math.abs(percentFromAverage).toFixed(0)}% below average`;
  } else if (percentFromAverage <= 5) {
    recommendation = "fair";
    recommendationText = "Price is around the average";
  } else {
    recommendation = "wait";
    recommendationText = `${percentFromAverage.toFixed(0)}% above average. Consider waiting for a drop.`;
  }

  return {
    currentPrice,
    averagePrice: Math.round(averagePrice * 100) / 100,
    lowestPrice,
    highestPrice,
    percentFromAverage: Math.round(percentFromAverage * 10) / 10,
    percentFromLowest: Math.round(percentFromLowest * 10) / 10,
    recommendation,
    recommendationText,
    daysAnalyzed:
      history.length > 0
        ? Math.ceil(
            (Date.now() - history[0].date.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 0,
  };
}

/**
 * Get price history data points for charting (from historyJson)
 */
export async function getPriceHistoryForChart(
  productId: number,
  country: CountryCode,
  daysBack: number = 90,
): Promise<{ date: Date; price: number; priceType: string }[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Fetch price record with historyJson
  const priceRecord = await db.query.prices.findFirst({
    where: and(eq(prices.productId, productId), eq(prices.country, country)),
  });

  if (!priceRecord?.historyJson) {
    return [];
  }

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
  const priceRecord = await db.query.prices.findFirst({
    where: and(eq(prices.productId, productId), eq(prices.country, country)),
  });

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
