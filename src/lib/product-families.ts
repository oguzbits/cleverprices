import type { Product } from "@/lib/product-registry";
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
): { slug: string; title: string; brand: string; variantSuffix: string } {
  // 1. Basic Identity (Contains normalized brand e.g. PlayStation -> Sony)
  const identity = getProductIdentity(representative);
  const brand = identity.brand || "Generic";
  const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // 2. Determine Scope
  const isHub =
    representative.isParentView ||
    ((representative as any).syntheticId &&
      (representative as any).syntheticId >= 900000000) ||
    ((representative as any).id && (representative as any).id >= 900000000);
  const syntheticId =
    (representative as any).syntheticId ||
    ((representative as any).id && (representative as any).id >= 900000000
      ? (representative as any).id
      : undefined) ||
    (isHub ? representative.id : undefined);

  // 3. Core Model Construction
  // Use identity.model which is already stripped of redundant brand and variant tokens
  let modelPart = identity.model
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\u00E4/g, "ae")
    .replace(/\u00F6/g, "oe")
    .replace(/\u00FC/g, "ue")
    .replace(/\u00DF/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // 4. Dynamic Variant Differentiators (Category-Agnostic)
  let variantPart = "";

  // Use extracted variant map from identity (includes Title Recovery)
  // This allows us to get "2tb" into the slug even if DB attributes are missing
  if (!isHub) {
    // Use the unified variant suffix as the slug differentiator
    // This ensures absolute consistency between URL, Breadcrumbs, and Titles.
    variantPart = identity.variantSuffix
      .toLowerCase()
      .normalize("NFKC")
      .replace(/\u00E4/g, "ae")
      .replace(/\u00F6/g, "oe")
      .replace(/\u00FC/g, "ue")
      .replace(/\u00DF/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // 5. Construct Text Slug (Idealo Style: [model]-[variants?]-[brand])
  let textSlug = modelPart;
  if (!isHub && variantPart) {
    // If variantPart (color/mpn) is already in modelPart, don't repeat it
    const vParts = variantPart.split("-");
    const uniqueVParts = vParts.filter((p) => !modelPart.includes(p));
    if (uniqueVParts.length > 0) {
      textSlug += `-${uniqueVParts.join("-")}`;
    }
  }

  // Use identity brand to ensure manufacturers like "Sony" are added
  if (brandSlug && !textSlug.includes(brandSlug)) {
    textSlug += `-${brandSlug}`;
  }

  // Final cleanup of the text part
  textSlug = textSlug.replace(/-+/g, "-").replace(/^-|-$/g, "");

  // 6. ID-Based Prefixing
  // Format: [ID]_-text-slug
  const idValue = syntheticId || representative.id || 0;
  // Standardize to 9 digits:
  // Hubs: 900,000,000 + ID
  // Variants: 200,000,000 + ID
  const idPrefix =
    idValue >= 200000000 ? idValue : (isHub ? 900000000 : 200000000) + idValue;

  return {
    slug: `${idPrefix}_-${textSlug}`,
    title: identity.fullModel, // Use neutral Hub model name for all family members
    brand,
    variantSuffix: identity.variantSuffix,
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
