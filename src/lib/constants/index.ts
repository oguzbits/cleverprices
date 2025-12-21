/**
 * Quick access categories for search modal and homepage
 * These are the most popular/featured categories
 */

export const QUICK_ACCESS_CATEGORIES = [
  "electronics",
  "hard-drives",
  "ram",
] as const;

export type QuickAccessCategory = (typeof QUICK_ACCESS_CATEGORIES)[number];

/**
 * Featured categories shown on homepage
 */
export const FEATURED_CATEGORIES = [
  "hard-drives",
  "ram",
] as const;

/**
 * Default sorting configuration
 */
export const DEFAULT_SORT_BY = "pricePerUnit";
export const DEFAULT_SORT_ORDER = "asc" as const;

/**
 * Pagination
 */
export const MAX_PRODUCTS_PER_PAGE = 50;

/**
 * Filter debounce timing
 */
export const FILTER_DEBOUNCE_MS = 300;
