import { calculateProductMetrics } from "./utils/products";
import productsData from "@/data/products.json";

/**
 * Product Registry - Single source of truth for all products
 * This centralizes product data and affiliate links in one place.
 * Future: This will integrate with Amazon PA API for real-time pricing.
 */

export interface Product {
  id?: number;
  slug: string;
  asin: string;
  title: string;
  category: string;
  image?: string;
  affiliateUrl: string;
  prices: Record<string, number>; // New multi-market prices
  capacity: number;
  capacityUnit: "GB" | "TB" | "W";
  normalizedCapacity?: number;
  pricePerUnit?: number;
  warranty: string;
  formFactor: string;
  technology?: string;
  condition: "New" | "Used" | "Renewed";
  brand: string;
  certification?: string;
  modularityTyp?: string;
}

// Type assertion and dynamic calculation of metrics
const products = (productsData as Product[]).map(
  (p) => calculateProductMetrics(p) as Product,
);

/**
 * Get a product by its slug
 * @param slug - The product slug (e.g., "samsung-990-pro-2tb")
 * @returns The product or undefined if not found
 */
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/**
 * Get all products for a specific category
 * @param category - The category slug (e.g., "hard-drives")
 * @returns Array of products in that category
 */
export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

/**
 * Get all products in the registry
 * @returns All products
 */
export function getAllProducts(): Product[] {
  return [...products];
}

/**
 * Get similar products (same category, different product)
 * @param product - The current product
 * @param limit - Maximum number of similar products to return
 * @param countryCode - Country code for price comparison
 * @returns Array of similar products sorted by price similarity
 */
export function getSimilarProducts(
  product: Product,
  limit: number = 4,
  countryCode: string = "us",
): Product[] {
  // Get products in same category with valid prices
  const categoryProducts = products.filter(
    (p) =>
      p.category === product.category &&
      p.slug !== product.slug &&
      p.prices[countryCode] !== undefined &&
      p.prices[countryCode] !== null &&
      p.prices[countryCode] > 0,
  );

  // Sort by price similarity to current product
  const currentPrice = product.prices[countryCode] || 0;

  const sorted = categoryProducts.sort((a, b) => {
    const priceA = a.prices[countryCode] || 0;
    const priceB = b.prices[countryCode] || 0;

    // Sort by absolute difference from current price
    return Math.abs(priceA - currentPrice) - Math.abs(priceB - currentPrice);
  });

  return sorted.slice(0, limit);
}

/**
 * Get products by brand
 * @param brand - The brand name
 * @param excludeSlug - Optional slug to exclude (current product)
 * @returns Array of products from that brand
 */
export function getProductsByBrand(
  brand: string,
  excludeSlug?: string,
): Product[] {
  return products.filter(
    (p) =>
      p.brand.toLowerCase() === brand.toLowerCase() && p.slug !== excludeSlug,
  );
}
