import { getCountryByCode } from "@/lib/countries";

/**
 * Format a number as currency based on country code
 */
export function formatCurrency(amount: number, countryCode: string): string {
  const country = getCountryByCode(countryCode);
  if (!country) {
    // Fallback to USD
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: country.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format price per unit (e.g., "$0.05/TB")
 */
export function formatPricePerUnit(
  price: number,
  unit: string,
  countryCode: string,
): string {
  const formattedPrice = formatCurrency(price, countryCode);
  return `${formattedPrice}/${unit}`;
}

/**
 * Format capacity with unit (e.g., "2 TB", "500 GB")
 */
export function formatCapacity(value: number, unit: string): string {
  return `${value} ${unit}`;
}

/**
 * Format a number with specified decimal places
 */
export function formatNumber(
  value: number,
  decimals: number = 2,
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Null-safe currency formatter for component use
 */
export function formatCurrencySafe(
  value: number | undefined | null,
  countryCode: string,
): string {
  if (value === undefined || value === null) return "–";
  return formatCurrency(value, countryCode);
}

/**
 * Format rating as German decimal (e.g., 1,5)
 */
export function formatRatingDE(rating: number): string {
  return rating.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Clean up long product titles for display (e.g., in cards and breadcrumbs)
 * Preserves model identifiers while removing extra metadata.
 */
export function formatDisplayTitle(title: string, model?: string): string {
  if (!title) return "";

  // Refined title splitting logic
  // We look for separators like " - ", "(", "|", or a comma followed by a space ", "
  // This preserves internal dashes in model numbers like "i7-12700K"
  const splitTitle = title.split(/ \- | \(| \||, /)[0].trim();

  // Use the split title as the primary source, fallback to model if split result is too short
  if (splitTitle.length > 3) {
    return splitTitle;
  }

  return model || title;
}
