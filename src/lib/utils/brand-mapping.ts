/**
 * Global map for brand normalization.
 * Handles translations and brand aliases to ensure consistency across data sources.
 */
export const BRAND_NORMALIZATION_MAP: Record<string, string> = {
  // Common German translations of brands
  nichts: "Nothing",
  apfel: "Apple",
  // Aliases/Subsidiaries
  playstation: "Sony",
  "sony interactive entertainment": "Sony",
  xbox: "Microsoft",
  nintendo: "Nintendo",
};

/**
 * Normalizes a brand name based on the global map.
 */
export function normalizeBrandName(brand: string): string {
  if (!brand) return brand;
  const lower = brand.toLowerCase().trim();

  if (BRAND_NORMALIZATION_MAP[lower]) {
    return BRAND_NORMALIZATION_MAP[lower];
  }

  return brand;
}

/**
 * Probabilistic Brand Normalizer (PEF Stage 3)
 *
 * Checks if the incoming brand name (from enrichment) is a known alias
 * or translation of the marketplace brand name.
 */
function normalizeBrandDynamic(
  incomingBrand: string,
  marketplaceBrand: string,
): string {
  if (!incomingBrand || !marketplaceBrand) return incomingBrand;

  const normalizedIncoming = normalizeBrandName(incomingBrand);
  const normalizedMarketplace = normalizeBrandName(marketplaceBrand);

  if (
    normalizedIncoming.toLowerCase() === normalizedMarketplace.toLowerCase()
  ) {
    return normalizedMarketplace;
  }

  // Handle common substrings (e.g. "Sony Interactive" vs "Sony")
  if (
    normalizedIncoming
      .toLowerCase()
      .includes(normalizedMarketplace.toLowerCase())
  ) {
    return normalizedMarketplace;
  }

  return normalizedIncoming;
}
