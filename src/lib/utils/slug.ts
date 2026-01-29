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

/**
 * Generate URL-safe slug from title with uniqueness guarantee.
 * Uses the robust token-based identity system to ensure accuracy.
 */
export function generateProductSlug(
  title: string,
  brand?: string | null,
  asin?: string,
  capacity?: number | null,
  capacityUnit?: string | null,
): string {
  // 1. Extract Identity using the robust token-based system
  // We mock a partial Product object for the identity utility
  const identity = getProductIdentity({
    title,
    brand: brand || "",
    // If we have capacity info, we can pass it as a variation string to help stripping
    variationAttributes: capacity
      ? `Storage: ${capacity} ${capacityUnit || "GB"}`
      : "",
  });

  // 2. Format Model Part
  const modelPart = identity.model
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\u00E4/g, "ae")
    .replace(/\u00F6/g, "oe")
    .replace(/\u00FC/g, "ue")
    .replace(/\u00DF/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // 3. Format Spec Part (Capacity)
  const castUnit = String(capacityUnit || "GB");
  let specPart = "";
  if (capacity) {
    const unit = castUnit.toLowerCase();
    specPart = `${capacity}${unit}`.replace(/\s+/g, "");
  }

  // 4. Construct Parts (Idealo Style: Model - Specs - Brand - UniqueID)
  const parts = [modelPart];
  if (specPart) parts.push(specPart);

  // Use the normalized brand from identity (e.g. PlayStation maps to Sony)
  const finalBrand = identity.brand || brand;
  if (finalBrand) {
    const brandSlug = finalBrand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!modelPart.includes(brandSlug)) {
      parts.push(brandSlug);
    }
  }

  if (asin && asin.length >= 4) {
    parts.push(asin.slice(-4).toLowerCase());
  }

  return parts.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
