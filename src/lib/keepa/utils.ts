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
