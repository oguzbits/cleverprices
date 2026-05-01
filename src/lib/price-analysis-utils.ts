import type { PriceAnalysis } from "@/lib/data-sources/types";

import { parseHistoryBlob } from "./history-compression";
import { getSafeNow } from "./server/deterministic-time";

/**
 * Parse historyJson blob into price history array
 * Format: { "2025-01-15": 4999, ... } (prices in cents)
 * Now supports both legacy TEXT and compressed BLOB formats.
 */
export function parseHistoryJson(
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
 * Pure function to calculate price analysis metrics.
 * Exported for unit testing.
 */
export function computePriceAnalysis(
  currentPrice: number,
  history: { date: Date; price: number }[],
  now: number = getSafeNow(),
): PriceAnalysis | null {
  // Need at least 2 data points for meaningful analysis
  if (history.length < 2) {
    return null;
  }

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
        ? Math.ceil((now - history[0].date.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
  };
}
