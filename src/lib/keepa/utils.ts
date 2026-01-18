/**
 * Keepa Data Utilities
 * Normalizes Keepa raw data into our schema format.
 */

/**
 * Converts Keepa's integer price format (e.g., 2999) to decimal (29.99).
 */
export function keepaPriceToDecimal(
  price: number | null | undefined,
): number | null {
  if (price === null || price === undefined || price < 0) return null;
  return price / 100;
}

/**
 * Extracts the latest sales rank from Keepa's salesRanks history object.
 */
export function extractSalesRank(
  salesRanks: Record<number, number[][]> | null | undefined,
): number | null {
  if (!salesRanks) return null;
  const ranks = Object.values(salesRanks)[0];
  if (ranks && ranks.length > 0) {
    return ranks[ranks.length - 1][1];
  }
  return null;
}

/**
 * Converts Keepa's rating (10-50) to 1.0-5.0 format.
 */
export function normalizeRating(
  rating: number | null | undefined,
): number | null {
  if (rating === null || rating === undefined || rating <= 0) return null;
  return rating / 10;
}

/**
 * Converts Keepa minute time to a Unix timestamp.
 * Keepa time 0 is 2011-01-01 00:00:00 UTC.
 */
export function keepaTimeToUnix(keepaMinutes: number): number {
  return (keepaMinutes + 21552000) * 60000;
}

/**
 * Parses Keepa CSV history arrays into a clean list of timestamped prices.
 * Format: [timestamp1, price1, timestamp2, price2, ...]
 */
export function parseKeepaHistory(
  csvArray: (number | null)[] | undefined,
): { timestamp: number; price: number }[] {
  if (!csvArray || csvArray.length < 2) return [];

  const results: { timestamp: number; price: number }[] = [];

  // Arrays are alternating: [time, price, time, price...]
  for (let i = 0; i < csvArray.length; i += 2) {
    const kTime = csvArray[i];
    const kPrice = csvArray[i + 1];

    if (kTime !== null && kPrice !== null && kPrice > 0) {
      results.push({
        timestamp: keepaTimeToUnix(kTime),
        price: kPrice / 100,
      });
    }
  }

  return results;
}

/**
 * Aggregates high-resolution history points into daily minimums.
 * Idealo-style: only shows one price point per day.
 */
export function getDailyLow(history: { timestamp: number; price: number }[]) {
  const dailyLows: Record<string, { timestamp: number; price: number }> = {};
  for (const point of history) {
    const d = new Date(point.timestamp);
    const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
    if (!dailyLows[dateKey] || point.price < dailyLows[dateKey].price) {
      dailyLows[dateKey] = point;
    }
  }
  return Object.values(dailyLows);
}
