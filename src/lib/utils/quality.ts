import { type Product } from "../product-definitions";

/**
 * Unified Quality Logic for CleverPrices
 * This function determines if a product is of high enough quality to be:
 * 1. Included in the Sitemap
 * 2. Indexed by Google (MetaData notFound() logic)
 * 3. Rendered on the live site (Page Content notFound() logic)
 */
export function isProductHighQuality(
  product: Partial<Product> | any,
  options: {
    checkPrice?: boolean;
    countryCode?: string;
    isParentView?: boolean;
  } = {},
): boolean {
  if (!product) return false;

  // 1. Meaningful Title Guard
  // Pattern: Title must exist, be longer than 4 chars, and not just be a raw ASIN
  const title = product.title || product.officialTitle;
  const asin = product.asin;
  const hasMeaningfulTitle =
    !!title && title.length > 4 && title.toLowerCase() !== asin?.toLowerCase();

  if (!hasMeaningfulTitle) return false;

  // 2. Image Guard
  // Pattern: Must have a valid image URL that isn't a placeholder
  const imageUrl = product.imageUrl || product.image;
  const hasImage = !!imageUrl && !imageUrl.includes("placeholder");

  if (!hasImage) return false;

  // 3. Specification Guard
  // Pattern: specCount > 3 (sum of standard and official specifications)
  const specs =
    typeof product.specifications === "string"
      ? JSON.parse(product.specifications)
      : product.specifications || {};

  const officialSpecs =
    typeof product.officialSpecifications === "string"
      ? JSON.parse(product.officialSpecifications)
      : product.officialSpecifications || {};

  const specCount =
    Object.keys(specs).length + Object.keys(officialSpecs).length;

  // High quality threshold: > 3 specs
  const hasGoodSpecs = specCount > 3 || !!product.officialSpecifications;

  // 4. Price Guard (Optional)
  // Hubs (ParentView) are exempt from price checks because they represent a collection.
  let hasPrice = true;
  if (options.checkPrice && !options.isParentView) {
    const country = options.countryCode || "de";
    const prices = product.prices || {};
    const usedPrices = product.usedPrices || {};

    hasPrice =
      !!prices[country] ||
      !!usedPrices[country] ||
      Object.values(prices).some((p: any) => typeof p === "number" && p > 0) ||
      Object.values(usedPrices).some(
        (p: any) => typeof p === "number" && p > 0,
      );
  }

  // Final Decision:
  // Must have Meaningful Title AND Image AND (Price OR Good Specs)
  // We allow out-of-stock items IF they have good specs (useful for search intent)
  return hasMeaningfulTitle && hasImage && (hasPrice || hasGoodSpecs);
}
