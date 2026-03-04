import type { Product } from "@/lib/product-definitions";
import {
  getProductIdentity,
  type SiblingConsensus,
} from "./utils/product-identity";

/**
 * Builds an Idealo-style clean title for RAM products.
 *
 * Hub format:     "{Brand} {Series} {Capacity} {DDRx-Speed} {CL}"
 *                 e.g. "Crucial Pro OC 64GB DDR5-6000 CL40"
 * Variant format: same + " {MPN}"
 *                 e.g. "Crucial Pro OC 64GB DDR5-6000 CL40 CP2K32G60C40U5B"
 *
 * Exported so category-products.ts can use it for lean variant titles too.
 */

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
    const priceDiff = getPrice(a) - getPrice(b);
    if (priceDiff !== 0) return priceDiff;
    return (a.id || 0) - (b.id || 0);
  });

  return sorted[0];
}

/**
 * Robustly removes accents and standardizes special characters.
 */
function normalizeAccents(s: string): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip combining accents
    .replace(/\u00E4/gi, "ae")
    .replace(/\u00F6/gi, "oe")
    .replace(/\u00FC/gi, "ue")
    .replace(/\u00DF/gi, "ss")
    .normalize("NFKC");
}

/**
 * Single Source of Truth for Family Identity (Slug, Title).
 * Logic matches the client-side ProductVariantSelector to ensure consistent URLs.
 */
export function getFamilyIdentity(
  representative: Product | Partial<Product>,
  allVariants: Product[] = [],
  consensus?: SiblingConsensus,
): {
  slug: string;
  title: string;
  modelTitle: string;
  fullModel: string;
  brand: string;
  variantSuffix: string;
  displaySubtitle: string;
  categoryUsed: string;
} {
  // 1. Basic Identity (Stateless: Core Model + Own Traits)
  const identity = getProductIdentity(representative);
  if (representative.id === 3833) {
    console.error(
      `TRACE 3833 (getFamilyIdentity): Title="${identity.displayTitle}", Model="${identity.model}", MPN="${identity.mpn}"`,
    );
  }
  const brand = identity.brand || "Generic";
  const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const categoryUsed = (
    representative.category ||
    (representative as any).category_id ||
    ""
  ).toLowerCase();
  const isDisplay =
    categoryUsed.includes("monitor") ||
    categoryUsed.includes("display") ||
    categoryUsed.includes("televis") ||
    categoryUsed.includes("tv") ||
    categoryUsed.includes("fernseher");

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
  let modelPart = normalizeAccents(identity.model).toLowerCase();

  // Strip brand from model if it's duplicated (e.g. "ASUS TUF ASUS" -> "ASUS TUF")
  // For monitors/TVs, we are very careful not to strip digits or model codes that might overlap with short brands
  if (brandSlug) {
    const brandPattern = new RegExp(`\\b${brandSlug}\\b`, "gi");
    if (!isDisplay) {
      modelPart = modelPart.replace(brandPattern, "");
    }
  }

  modelPart = modelPart
    .replace(new RegExp(`\\b${identity.categoryUsed}s?\\b`, "gi"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // 4. Dynamic Variant Differentiators (Category-Agnostic)
  let variantPart = "";
  if (!isHub) {
    // Use the unified variant suffix as the slug differentiator
    variantPart = normalizeAccents(identity.variantSuffix)
      .toLowerCase()
      .replace(/(\d+)\s*(GB|TB|MB|WH)/gi, "$1$2") // Collapse only pure capacity units
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // 5. Construct Text Slug (Idealo Style: [model]-[variants?]-[brand])
  let textSlug = modelPart;
  if (!isHub && variantPart) {
    // If variantPart (color/mpn) is already in modelPart, don't repeat it
    // Use word-boundary aware check (split by hyphen) to avoid stripping 'a' from 'macbook'
    const modelWords = modelPart.split("-");
    const vParts = variantPart.split("-");
    const uniqueVParts = vParts.filter((p) => {
      if (modelWords.includes(p)) return false;
      // For pure numbers, avoid repetition if they are already embedded in the model name (common in TVs/Monitors)
      if (/^\d+$/.test(p) && modelPart.includes(p)) return false;
      return true;
    });
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
  let rawId = (syntheticId || representative.id || 0) % 100000000;

  // Standardize to 9 digits:
  // Hubs: 900,000,000 + ID
  // Variants: 200,000,000 + ID
  const idPrefix = (isHub ? 900000000 : 200000000) + rawId;

  // 7. RAM Title Enhancement (Idealo-style):
  // Hub:     "Crucial Pro OC 64GB DDR5-6000 CL40"
  // Variant: "Crucial Pro OC 64GB DDR5-6000 CL40 CP2K32G60C40U5B"
  // Slugs are not touched.
  const cat = (representative.category || "").toLowerCase();
  const isRam = cat === "arbeitsspeicher" || cat === "ram";
  const isSpecFirst =
    isRam ||
    isDisplay ||
    cat === "smartphones" ||
    cat === "mainboards" ||
    cat === "motherboards" ||
    cat === "grafikkarten" ||
    cat === "gpu" ||
    cat === "prozessoren" ||
    cat === "cpu" ||
    cat === "ssds" ||
    cat === "festplatten";

  if (isSpecFirst) {
    return {
      slug: `${idPrefix}_-${textSlug}`,
      title: isHub ? identity.modelTitle : identity.displayTitle,
      modelTitle: identity.modelTitle,
      fullModel: identity.fullModel,
      brand,
      variantSuffix: identity.variantSuffix,
      displaySubtitle: identity.variantSuffix,
      categoryUsed: identity.categoryUsed,
    };
  }

  return {
    slug: `${idPrefix}_-${textSlug}`,
    title: identity.fullModel,
    modelTitle: identity.modelTitle,
    fullModel: identity.fullModel,
    brand,
    variantSuffix: identity.variantSuffix,
    displaySubtitle: identity.variantSuffix,
    categoryUsed: identity.categoryUsed,
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
