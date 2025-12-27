import { ProductUIModel } from "@/lib/amazon-api";
import { Product } from "@/lib/product-registry";
import { allCategories } from "@/lib/categories";

/**
 * Parses numeric value from strings like "0.03€/GB" or "1.25$/TB"
 */
export function parseUnitValue(pricePerUnit?: string): number {
  if (!pricePerUnit) return Infinity;
  const match = pricePerUnit.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : Infinity;
}

/**
 * Calculates badges for products based on their unit values.
 */
export function calculateProductBadges(
  products: (ProductUIModel & { unitValue: number })[],
) {
  const minUnitValue = Math.min(
    ...products.map((p) => p.unitValue).filter((v) => v !== Infinity),
  );
  const avgUnitValue =
    products.reduce(
      (acc, p) => (p.unitValue !== Infinity ? acc + p.unitValue : acc),
      0,
    ) / (products.filter((p) => p.unitValue !== Infinity).length || 1);

  return products.map((product) => {
    let badgeText = undefined;
    if (product.unitValue === minUnitValue && minUnitValue !== Infinity) {
      badgeText = "Best Price";
    } else if (
      product.unitValue < avgUnitValue * 0.85 &&
      product.unitValue !== Infinity
    ) {
      badgeText = "Good Deal";
    }
    return { ...product, badgeText };
  });
}

const UNIT_CONVERSION: Record<string, number> = {
  GB: 1,
  TB: 1000,
};

/**
 * Calculates generic unit price based on category configuration.
 */
export function calculateProductMetrics(
  p: Partial<Product>,
  overridePrice?: number,
): Partial<Product> {
  const price = overridePrice !== undefined ? overridePrice : 0;
  const { capacity, capacityUnit, category } = p;

  if (price === undefined || !capacity || !capacityUnit || !category) return p;

  const categoryConfig = allCategories[category];
  const comparisonUnit = categoryConfig?.unitType || capacityUnit; // Fallback to capacityUnit if category not found

  const fromFactor = UNIT_CONVERSION[capacityUnit] || 1;
  const toFactor = UNIT_CONVERSION[comparisonUnit] || 1;

  const normalizedCapacity = capacity * fromFactor;
  const capacityInComparisonUnit = normalizedCapacity / toFactor;
  const pricePerUnit = Number((price / capacityInComparisonUnit).toFixed(2));

  return {
    ...p,
    pricePerUnit,
    normalizedCapacity,
  };
}

/**
 * Optimizes external image URLs, specifically Amazon's ._AC_ tags
 */
export function getOptimizedImageUrl(
  url?: string,
  width: number = 250,
): string {
  if (!url) return "";

  // If it's an Amazon image, replace the size tag (e.g. _SX522_ or _SY600_)
  // with a custom width tag to request a smaller image from the source
  if (url.includes("media-amazon.com")) {
    return url.replace(/\._AC_S[XY]\d+_/, `._AC_SX${width}_`);
  }

  return url;
}

/**
 * Gets localized product data for a specific country.
 */
export function getLocalizedProductData(p: Product, countryCode: string = "us") {
  const code = countryCode.toLowerCase();
  const price = p.prices?.[code];
  
  if (price === null) return { price: null, title: p.title, asin: p.asin };
  
  // Fallback to 'us' only if the current code is not 'us' AND the current price is undefined (missing)
  const finalPrice = price !== undefined ? price : (code !== "us" ? p.prices?.["us"] : 0) || 0;
  
  const title = p.title;
  const asin = p.asin;
    
  return { price: finalPrice, title, asin };
}

/**
 * Adapts internal Product model to ProductUIModel
 */
export function adaptToUIModel(
  p: Product,
  countryCode: string = "us",
  currency: string = "USD",
  symbol: string = "$",
): ProductUIModel {
  const { price, title, asin } = getLocalizedProductData(p, countryCode);
  const finalPrice = price ?? 0;
  const enhancedProduct = calculateProductMetrics(p, finalPrice) as Product;
  
  const categoryConfig = allCategories[p.category];
  const displayUnit = categoryConfig?.unitType || p.capacityUnit;

  return {
    asin,
    title,
    price: {
      amount: finalPrice,
      currency,
      displayAmount: `${finalPrice} ${symbol}`,
    },
    image: getOptimizedImageUrl(enhancedProduct.image),
    url: `/out/${enhancedProduct.slug}`, // Standard redirect path
    category: enhancedProduct.category,
    capacity: `${enhancedProduct.capacity}${enhancedProduct.capacityUnit}`,
    pricePerUnit: enhancedProduct.pricePerUnit
      ? `${enhancedProduct.pricePerUnit} ${symbol}/${displayUnit}`
      : undefined,
  };
}
