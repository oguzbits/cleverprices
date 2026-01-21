import { allCategories, type CategorySlug } from "@/lib/categories";
import { type CountryCode } from "@/lib/countries";
import { Product } from "@/lib/product-registry";
import { Product as UIProduct, type Currency } from "@/types";

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
  products: (UIProduct & { unitValue: number })[],
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
  let { capacity, capacityUnit, category, title } = p;
  const categoryConfig = allCategories[category as CategorySlug];

  // Try to extract capacity/cores from title if missing
  if (!capacity && title) {
    if (categoryConfig?.unitType === "core") {
      const coreMatch = title.match(/(\d+)\s?-?\s?(Core|Kerne)/i);
      if (coreMatch) capacity = parseInt(coreMatch[1]);
    } else if (
      category === "ssd" ||
      category === "ssds" ||
      category === "hard-drives"
    ) {
      const capMatch = title.match(/(\d+)\s?(GB|TB)/i);
      if (capMatch) {
        capacity = parseInt(capMatch[1]);
        capacityUnit = capMatch[2].toUpperCase();
      }
    }
  }

  // For CPUs, capacity might be stored in 'cores' field (from DB/API)
  const actualCapacity =
    capacity ||
    (categoryConfig?.unitType === "core" ? Number((p as any).cores) : 0);

  if (price === undefined || !actualCapacity || !category) return p;

  const comparisonUnit = categoryConfig?.unitType || capacityUnit || "GB";

  const fromFactor = UNIT_CONVERSION[capacityUnit || "GB"] || 1;
  const toFactor = UNIT_CONVERSION[comparisonUnit] || 1;

  const normalizedCapacity = actualCapacity * fromFactor;
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
export function getLocalizedProductData(
  p: Product,
  countryCode: string = "us",
) {
  const code = countryCode.toLowerCase();

  // Return null if prices object is missing or if the specific country price is null or undefined
  if (!p.prices || p.prices[code] === null || p.prices[code] === undefined) {
    return { price: null, title: p.title, asin: p.asin };
  }

  const price = p.prices[code];
  const title = p.title;
  const asin = p.asin;
  const lastUpdated = p.pricesLastUpdated?.[code];

  return { price, title, asin, lastUpdated };
}

/**
 * Adapts internal Product model to ProductUIModel
 */
export function adaptToUIModel(
  p: Product,
  countryCode: CountryCode = "us",
  currency: Currency = "USD",
  symbol: string = "$",
): UIProduct {
  const { price, title, asin } = getLocalizedProductData(p, countryCode);
  const finalPrice = price ?? 0;
  const enhancedProduct = calculateProductMetrics(p, finalPrice) as Product;

  const categoryConfig = allCategories[p.category as CategorySlug];
  const displayUnit = categoryConfig?.unitType || p.capacityUnit;

  return {
    asin,
    slug: p.slug, // Add slug for internal navigation
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

/**
 * Calculates discount percentage based on 90-day average price.
 * Standardized across the application to avoid "fake" list-price discounts.
 */
export function calculateProductDiscount(
  p: Partial<Product>,
  countryCode: string,
): number {
  const code = countryCode.toLowerCase();
  const currentPrice = p.prices?.[code];
  if (!currentPrice || currentPrice <= 0) return 0;

  const avg90 = p.priceAvg90?.[code];
  if (!avg90 || avg90 <= currentPrice) return 0;

  let discountRate = Math.round(((avg90 - currentPrice) / avg90) * 100);

  // Sanity check for bad data (e.g. outlier price drops > 80% are likely errors)
  if (discountRate > 80) return 0;

  return discountRate;
}

/**
 * Determines if a product is a Bestseller based on strict criteria.
 * Replaces loose < 10000 rank checks with a combination of rank, volume and rating.
 */
export function isProductBestseller(p: Partial<Product>): boolean {
  const rank = p.salesRank ?? 0;
  const sold = p.monthlySold ?? 0;
  const rating = p.rating ?? 0;

  // Criteria (approx. 7% of catalog):
  // 1. Excellent Sales Rank (< 200 in Department)
  // 2. OR High Volume (3000+ sold/mo) with good rating (4.0+)
  // 3. AND Must have basic quality (rating >= 3.5)
  const isEliteRank = rank > 0 && rank < 200;
  const isHighVolume = sold >= 3000 && rating >= 4.0;
  const isDecentQuality = rating >= 3.5;

  return (isEliteRank || isHighVolume) && isDecentQuality;
}
