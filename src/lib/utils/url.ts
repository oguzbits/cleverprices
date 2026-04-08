import { SITE_URL } from "../site-config";

/**
 * Standardizes the generation of canonical product URLs.
 * Format: /p/{id}_-{slug}
 */
export function getProductPath(
  id: string | number | undefined,
  slug: string,
): string {
  // 1. Clean up slug if it already has a prefix to avoid Double Prefix bugs or ID mismatches
  let cleanSlug = slug;
  const prefixMatch = slug.match(/^\d+_-/);
  if (prefixMatch) {
    // If NO target ID is provided, use the existing prefix (Legacy/Safe path)
    if (!id) return `/p/${slug}`;
    // If a target ID is provided, strip the old prefix to replace it correctly below
    cleanSlug = slug.substring(prefixMatch[0].length);
  }

  if (!id) return `/p/${cleanSlug}`;

  const numId = typeof id === "string" ? parseInt(id, 10) : id;

  // Apply project-wide canonical prefixing:
  // - Synthetic Hub space starts at 900M. We map all legacy/real IDs here.
  // - 900M+ IDs (synthetic hub IDs) stay as is
  const prefix = numId < 100000000 ? 900000000 : 0;
  return `/p/${prefix + numId}_-${cleanSlug}`;
}

/**
 * Generates the full absolute canonical URL for a product.
 * Used in metadata, schema.org, and sitemaps.
 */
export function getProductCanonicalUrl(
  id: string | number | undefined,
  slug: string,
): string {
  if (!id) return `${SITE_URL}/p/${slug}`;
  return `${SITE_URL}${getProductPath(id, slug)}`;
}
