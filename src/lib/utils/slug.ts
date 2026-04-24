/**
 * Product Slug Generation Utility
 *
 * Centralized slug generation for consistent, SEO-friendly, unique product URLs.
 */

/**
 * Generate URL-safe slug from title with uniqueness guarantee.
 *
 * Strategy:
 * 1. Extract brand + cleaned model name
 * 2. Include key differentiators (capacity for storage, size for displays)
 * 3. Append last 4 chars of ASIN for guaranteed uniqueness
 *
 * @example
 * generateProductSlug("Samsung 990 PRO 4TB NVMe...", "Samsung", "B0CBYZ6DD1")
 * // → "samsung-990-pro-4tb-6dd1"
 */
import { getProductIdentity } from "./product-identity";
import { parseCapacityToGB } from "./variants";

/**
 * Generate URL-safe slug from title with uniqueness guarantee.
 * Uses the robust token-based identity system to ensure accuracy.
 */
export function generateProductSlug(
  title: string,
  brand?: string | null,
  asin?: string,
  attributes?: {
    storage?: string | null;
    color?: string | null;
    ram?: string | null;
    size?: string | null;
    connectivity?: string | null;
  },
): string {
  if (!title) return "";

  // 1. Extract Identity using the robust token-based system
  //    We pass the attributes explicitly to help `getProductIdentity` strip them from the model name
  const identity = getProductIdentity({
    title,
    brand: brand || "",
    variationAttributes: attributes
      ? Object.entries(attributes)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ")
      : undefined,
  });

  // 2. Format Model Part (Cleaned)
  const modelPart = identity.model
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\u00E4/g, "ae")
    .replace(/\u00F6/g, "oe")
    .replace(/\u00FC/g, "ue")
    .replace(/\u00DF/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // 3. Construct Parts in Deterministic Order
  //    Order: Model -> Size -> Storage -> RAM -> Color -> Connectivity -> Brand -> UniqueID
  const parts = [modelPart];

  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKC")
      .replace(/\u00E4/g, "ae")
      .replace(/\u00F6/g, "oe")
      .replace(/\u00FC/g, "ue")
      .replace(/\u00DF/g, "ss")
      .replace(/[^a-z0-9]+/g, "")
      .trim();

  // Helper to ensure we don't duplicate info if it's already in the model
  // (e.g. if model is "iPhone 13 128GB", we don't want to add "128gb" again)
  const addIfNew = (val: string | null | undefined) => {
    if (!val) return;
    const c = clean(val);
    if (!c) return;
    // Check against model part (stripping hyphens for check)
    if (!modelPart.replace(/-/g, "").includes(c)) {
      parts.push(c);
    }
  };

  if (attributes?.size) addIfNew(attributes.size);
  if (attributes?.storage) {
    // Robust normalization for storage slugs
    const gb = parseCapacityToGB(attributes.storage);
    if (gb > 0) {
      if (gb >= 1024) addIfNew(`${gb / 1024}tb`);
      else addIfNew(`${gb}gb`);
    } else {
      addIfNew(attributes.storage);
    }
  }
  if (attributes?.ram) addIfNew(attributes.ram);
  if (attributes?.color) addIfNew(attributes.color);
  if (attributes?.connectivity) addIfNew(attributes.connectivity); // e.g. "Wi-Fi + Cellular"

  // 4. Append Brand (if not in model)
  const finalBrand = identity.brand || brand;
  if (finalBrand) {
    const brandSlug = finalBrand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!modelPart.includes(brandSlug)) {
      parts.push(brandSlug);
    }
  }

  // 5. Append Unique ID (ASIN)
  if (asin && asin.length >= 4) {
    parts.push(asin.slice(-4).toLowerCase());
  }

  return parts.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
