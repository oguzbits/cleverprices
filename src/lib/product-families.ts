import type { Product } from "@/lib/product-registry";
import { parseVariationAttributes } from "@/lib/utils/variants";
import { getProductIdentity } from "./utils/product-identity";

/**
 * Single Source of Truth for "Which product represents the whole family?".
 * Logic:
 * 1. Prefer "New" condition.
 * 2. If multiple New, pick cheapest.
 * 3. If no New, pick cheapest overall (Used/Renewed).
 */
export function getFamilyRepresentative(
  variants: Product[],
): Product | undefined {
  if (!variants || variants.length === 0) return undefined;

  const newItems = variants.filter(
    (p) => !p.condition || p.condition.toLowerCase() === "new",
  );

  const candidates = newItems.length > 0 ? newItems : variants;
  const sorted = [...candidates].sort((a, b) => {
    // Helper to get active price
    const getPrice = (p: any) =>
      p.price || // Prioritize flattened price (LocalizedProduct)
      p.prices?.de ||
      p.prices?.["de"] ||
      (p.prices ? Object.values(p.prices)[0] : 0) ||
      999999;
    return getPrice(a) - getPrice(b);
  });

  return sorted[0];
}

/**
 * Single Source of Truth for Family Identity (Slug, Title).
 * Logic matches the client-side ProductVariantSelector to ensure consistent URLs.
 */
export function getFamilyIdentity(
  representative: Product | Partial<Product>,
  allVariants: Product[] = [],
): { slug: string; title: string; brand: string } {
  // 1. Basic Identity
  const identity = getProductIdentity(representative);
  const brand = representative.brand || "Generic";
  const parentAsin = representative.parentAsin || representative.asin || "";

  // Clean suffix: Trim trailing non-alphanumeric
  const cleanParentAsis = parentAsin.replace(/[^a-zA-Z0-9]+$/, "");
  const parentAsinSuffix = cleanParentAsis.slice(-4).toLowerCase();

  const brandPrefix = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // 2. Base Name Strategy: Use fullModel from identity
  // This is cleaner than raw title because getProductIdentity already strips many attributes
  let baseName = identity.model.toLowerCase();

  // Normalize
  baseName = baseName
    .normalize("NFKC")
    .replace(/\u00E4/g, "ae")
    .replace(/\u00F6/g, "oe")
    .replace(/\u00FC/g, "ue")
    .replace(/\u00DF/g, "ss");

  // Remve brand prefix if present
  if (baseName.startsWith(brand.toLowerCase())) {
    baseName = baseName.slice(brand.length).trim();
  }

  // 3. Tokenize
  // Split by non-alphanumeric OR by Number->Letter transition (e.g. 128GB -> 128, GB)
  // We DO NOT split Letter->Number (e.g. S24 keeps S24) to preserve model numbers.
  const tokens = baseName
    .split(/([^a-z0-9]+)|(?<=[0-9])(?=[a-z])/)
    .filter((t) => t && !/^\s+$/.test(t));

  // 4. Attribute Stripping Configuration
  const variationTokens = new Set<string>();

  const keywordsToFilter = [
    "gb",
    "mb",
    "tb",
    "ram",
    "memory",
    "speicher",
    "kapazität",
    "generalüberholt",
    "renewed",
    "neu",
    "gebraucht",
    "used",
    "refurbished",
    "handy",
    "smartphone",
    "mobiltelefon",
    "telefon",
    "farbe",
    "color",
    "colour",
    "edition",
    "duos",
    "sim",
    "esim",
    "5g",
    "4g",
    "lte",
    "wifi",
    "cellular",
    "ai",
  ];
  keywordsToFilter.forEach((k) => variationTokens.add(k));

  if (allVariants.length > 0) {
    allVariants.forEach((v) => {
      if (v.variationAttributes) {
        const attrs = parseVariationAttributes(v.variationAttributes);
        Object.values(attrs).forEach((val) => {
          val
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .forEach((t) => {
              if (t && t.length > 1) variationTokens.add(t);
            });
        });
      }
    });
  }

  const cleanTokens = tokens.filter((t) => {
    const token = t && typeof t === "string" ? t.toLowerCase().trim() : "";
    if (!token) return false;
    // Strict filter: Must contain at least one alphanumeric char
    if (!/[a-z0-9]/.test(token)) return false;

    // Check against variant tokens
    if (variationTokens.has(token)) return false;
    // Check against capacity patterns
    if (/^\d+[gt]b$/.test(token)) return false;

    return true;
  });

  // 5. Construct Slug
  // Deduplicate and limit to 4 model tokens
  const uniqueTokens: string[] = [];
  cleanTokens.forEach((t) => {
    // Don't add if it's the exact same as prev token
    if (uniqueTokens.length > 0 && uniqueTokens[uniqueTokens.length - 1] === t)
      return;
    uniqueTokens.push(t);
  });

  const modelPart = uniqueTokens.slice(0, 4).join("-");

  const slug = `${brandPrefix}-${modelPart}-${parentAsinSuffix}`
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    slug,
    title: identity.fullModel,
    brand,
  };
}

/**
 * Single Source of Truth for Family Statistics.
 * - Counts unique variants (deduplicated by attributes).
 */
export function getFamilyStats(variants: Product[]) {
  const uniqueVariants = new Set<string>();

  variants.forEach((v) => {
    if (v.variationAttributes) {
      uniqueVariants.add(v.variationAttributes);
    } else {
      uniqueVariants.add(String(v.id));
    }
  });

  return {
    variantCount: uniqueVariants.size,
  };
}
