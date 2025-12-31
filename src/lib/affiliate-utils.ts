/**
 * Get the affiliate redirect path for a product
 * @param slug - The product slug
 * @returns The /out/{slug} path for server-side redirect
 */
export function getAffiliateRedirectPath(slug: string): string {
  return `/out/${slug}`;
}
