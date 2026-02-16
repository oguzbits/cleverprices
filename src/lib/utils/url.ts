import { SITE_URL } from "../site-config";

/**
 * Standardizes the generation of canonical product URLs.
 * Format: /p/{id}_-{slug}
 */
export function getProductPath(
  id: string | number | undefined,
  slug: string,
): string {
  if (!id) return `/p/${slug}`;
  return `/p/${id}_-${slug}`;
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
