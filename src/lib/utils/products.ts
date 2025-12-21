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
export function calculateProductBadges(products: (ProductUIModel & { unitValue: number })[]) {
  const minUnitValue = Math.min(...products.map(p => p.unitValue).filter(v => v !== Infinity));
  const avgUnitValue = products.reduce((acc, p) => p.unitValue !== Infinity ? acc + p.unitValue : acc, 0) / 
    (products.filter(p => p.unitValue !== Infinity).length || 1);

  return products.map(product => {
    let badgeText = undefined;
    if (product.unitValue === minUnitValue && minUnitValue !== Infinity) {
      badgeText = "Best Price";
    } else if (product.unitValue < avgUnitValue * 0.85 && product.unitValue !== Infinity) {
      badgeText = "Good Deal";
    }
    return { ...product, badgeText };
  });
}

const UNIT_CONVERSION: Record<string, number> = {
  "GB": 1,
  "TB": 1000,
};

/**
 * Calculates generic unit price based on category configuration.
 */
export function calculateProductMetrics(p: Partial<Product>): Partial<Product> {
  const { price, capacity, capacityUnit, category } = p;
  
  if (!price || !capacity || !capacityUnit || !category) return p;

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
 * Adapts internal Product model to ProductUIModel
 */
export function adaptToUIModel(p: Product, currency: string = "EUR", symbol: string = "€"): ProductUIModel {
  const enhancedProduct = calculateProductMetrics(p) as Product;
  const categoryConfig = allCategories[p.category];
  const displayUnit = categoryConfig?.unitType || p.capacityUnit;
  
  return {
    asin: enhancedProduct.asin,
    title: enhancedProduct.title,
    price: { 
      amount: enhancedProduct.price, 
      currency, 
      displayAmount: `${enhancedProduct.price} ${symbol}` 
    },
    image: "", // Placeholder used in ProductCard anyway
    url: `/out/${enhancedProduct.slug}`, // Standard redirect path
    category: enhancedProduct.category,
    capacity: `${enhancedProduct.capacity}${enhancedProduct.capacityUnit}`,
    pricePerUnit: enhancedProduct.pricePerUnit 
      ? `${enhancedProduct.pricePerUnit} ${symbol}/${displayUnit}` 
      : undefined
  };
}
