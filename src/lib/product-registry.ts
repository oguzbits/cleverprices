import { calculateProductMetrics } from "./utils/products";
import productsData from "@/data/products.json";

/**
 * Product Registry - Single source of truth for all products
 * This centralizes product data and affiliate links in one place.
 * Future: This will integrate with Amazon PA API for real-time pricing.
 */

export interface Product {
  id?: number  // Optional for backwards compatibility
  slug: string;
  asin: string;
  title: string;
  category: string;
  affiliateUrl: string;
  price: number;
  capacity: number;
  capacityUnit: "GB" | "TB";
  normalizedCapacity?: number;
  pricePerUnit?: number;
  warranty: string;
  formFactor: string;
  technology: "HDD" | "SSD" | "SAS" | "DDR4" | "DDR5";
  condition: "New" | "Used" | "Renewed";
  brand: string;
}

// Type assertion and dynamic calculation of metrics
const products = (productsData as Product[]).map(p => calculateProductMetrics(p) as Product);

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
 * Get the affiliate redirect path for a product
 * @param slug - The product slug
 * @returns The /out/{slug} path for server-side redirect
 */
export function getAffiliateRedirectPath(slug: string): string {
  return `/out/${slug}`;
}
