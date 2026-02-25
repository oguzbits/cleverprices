import { SITE_URL } from "../site-config";

/**
 * Standardizes the generation of canonical product URLs.
 * Format: /p/{id}_-{slug}
 */
export function getProductPath(
  id: string | number | undefined,
  slug: string,
): string {
  // If slug already has the canonical ID prefix (###_-), use it as is
  if (slug.includes("_-")) {
    return `/p/${slug}`;
  }

  if (!id) return `/p/${slug}`;

  const numId = typeof id === "string" ? parseInt(id, 10) : id;

  // Apply project-wide canonical prefixing:
  // - Sub-100M IDs (real DB IDs) get the 200M variant prefix
  // - 900M+ IDs (synthetic hub IDs) stay as is
  const prefix = numId < 100000000 ? 200000000 : 0;
  return `/p/${prefix + numId}_-${slug}`;
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
