/**
 * Build-time configuration
 * These values are set at build time and embedded into the static output
 */

/**
 * Copyright year - automatically set to current year at build time
 * This is a build-time constant, not a runtime value
 */
export const COPYRIGHT_YEAR = new Date().getFullYear();

/**
 * Build timestamp - when the site was last built
 */
export const BUILD_TIME = new Date().toISOString();

/**
 * Price data last updated timestamp
 * Update this manually when you refresh prices in products.json
 * Format: ISO 8601 (e.g., "2026-01-02T22:00:00Z")
 */
export const PRICES_UPDATED_AT = "2026-01-02T22:00:00Z";

/**
 * Get human-readable time since prices were updated
 */
export function getPricesAge(): string {
  const updateTime = new Date(PRICES_UPDATED_AT).getTime();
  const now = Date.now();
  const hours = Math.floor((now - updateTime) / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return "just now";
}
