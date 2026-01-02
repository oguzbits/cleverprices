/**
 * Price Cache Types
 *
 * These types support multi-source price data with timestamps
 * for graceful degradation when primary data source is unavailable.
 */

import type { CountryCode } from "@/lib/countries";

/**
 * Source of price data
 * - manual: Manually entered by admin
 * - pa_api: Amazon Product Advertising API
 * - keepa: Keepa API (backup)
 * - user_reported: Community-submitted prices
 */
export type PriceSource = "manual" | "pa_api" | "keepa" | "user_reported";

/**
 * Price entry with metadata for a single country
 */
export interface PriceEntry {
  /** Price in local currency */
  amount: number | null;
  /** When this price was last verified/updated (ISO 8601) */
  updatedAt: string;
  /** Source of this price data */
  source: PriceSource;
}

/**
 * Price data for all supported countries
 */
export type PriceData = Record<CountryCode, PriceEntry>;

/**
 * Enhanced product with price metadata
 */
export interface CachedProduct {
  id: number;
  slug: string;
  asin: string;
  title: string;
  category: string;
  image?: string;
  affiliateUrl: string;
  capacity: number;
  capacityUnit: "GB" | "TB" | "W";
  warranty: string;
  formFactor: string;
  technology?: string;
  condition: "New" | "Used" | "Renewed";
  brand: string;
  certification?: string;
  modularityTyp?: string;

  /** Price data with timestamps per country */
  priceData: PriceData;

  /** Legacy prices field for backwards compatibility */
  prices?: Record<string, number | null>;
}

/**
 * Check if a price is considered stale
 * @param updatedAt - ISO 8601 timestamp
 * @param maxAgeHours - Maximum age in hours (default: 24)
 */
export function isPriceStale(
  updatedAt: string,
  maxAgeHours: number = 24,
): boolean {
  const updateTime = new Date(updatedAt).getTime();
  const now = Date.now();
  const ageMs = now - updateTime;
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return ageMs > maxAgeMs;
}

/**
 * Format relative time for display (e.g., "2 hours ago", "3 days ago")
 * @param updatedAt - ISO 8601 timestamp
 */
export function formatPriceAge(updatedAt: string): string {
  const updateTime = new Date(updatedAt).getTime();
  const now = Date.now();
  const ageMs = now - updateTime;

  const hours = Math.floor(ageMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

/**
 * Get display label for price freshness
 */
export function getPriceFreshnessLabel(
  updatedAt: string,
): "live" | "recent" | "stale" {
  const hours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);

  if (hours < 1) return "live";
  if (hours < 24) return "recent";
  return "stale";
}
