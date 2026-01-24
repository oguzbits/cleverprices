/**
 * Variant Utilities
 *
 * Client-safe utility functions for parsing and working with product variant data.
 * These are separated from product-registry.ts to avoid importing server-only code.
 */

/**
 * Minimal variant info needed for attribute extraction
 */
interface VariantLike {
  variationAttributes?: string;
}

/**
 * Parse variation attributes string into key-value pairs
 * Input: "Color: Cosmic Orange; Storage: 2000GB"
 * Output: { Color: "Cosmic Orange", Storage: "2000GB" }
 */
export function parseVariationAttributes(
  attrs: string | undefined,
): Record<string, string> {
  if (!attrs) return {};
  return Object.fromEntries(
    attrs
      .split(";")
      .map((pair) => {
        const [key, ...valueParts] = pair.split(":");
        const value = valueParts.join(":").trim(); // Handle values that might contain ":"
        return [key?.trim(), value];
      })
      .filter(([key, value]) => key && value),
  );
}

/**
 * Extract unique attribute values from a list of variants
 * Returns: { Color: ["Cosmic Orange", "Tiefblau", "Silber"], Storage: ["256GB", "512GB", ...] }
 */
export function extractAttributeGroups(
  variants: VariantLike[],
): Record<string, string[]> {
  const groups: Record<string, Set<string>> = {};

  for (const variant of variants) {
    const attrs = parseVariationAttributes(variant.variationAttributes);
    for (const [key, value] of Object.entries(attrs)) {
      if (!groups[key]) groups[key] = new Set();
      groups[key].add(value);
    }
  }

  // Convert Sets to sorted arrays
  return Object.fromEntries(
    Object.entries(groups).map(([key, valueSet]) => [
      key,
      Array.from(valueSet).sort(),
    ]),
  );
}
