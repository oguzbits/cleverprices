"use cache";

import {
  getAllProducts as getAllProductsSync,
  getProductsByCategory as getProductsByCategorySync,
  type Product,
} from "../product-registry";

/**
 * Cached server-side wrappers for product registry functions
 * These are used in Server Components to benefit from Next.js caching
 */

export async function getAllProducts(): Promise<Product[]> {
  return getAllProductsSync();
}

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  return getProductsByCategorySync(category);
}
