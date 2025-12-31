"use cache";

import { allCategories, CategorySlug } from "@/lib/categories";
import { Product, getProductsByCategory } from "@/lib/product-registry";
import { filterProducts, sortProducts } from "@/lib/utils/category-utils";
import {
  calculateProductMetrics,
  getLocalizedProductData,
} from "@/lib/utils/products";

export interface LocalizedProduct extends Omit<
  Product,
  "asin" | "title" | "price"
> {
  asin: string;
  title: string;
  price: number;
  pricePerUnit: number;
}

export interface FilterParams {
  search?: string;
  condition?: string | string[];
  technology?: string | string[];
  formFactor?: string | string[];
  minCapacity?: string;
  maxCapacity?: string;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Server-side function to get and filter products for a category
 * This replaces the client-side useCategoryProducts hook
 */
export async function getCategoryProducts(
  categorySlug: string,
  countryCode: string,
  filterParams: FilterParams,
) {
  // Load raw products for this category
  const rawProducts = getProductsByCategory(categorySlug);
  const category = allCategories[categorySlug as CategorySlug];
  const unitLabel = category?.unitType || "TB";

  // Localize products for this country
  const localizedProducts = rawProducts
    .map((p) => {
      const { price, title, asin } = getLocalizedProductData(p, countryCode);
      if (price === null || price === 0) return null;

      const enhanced = calculateProductMetrics(p, price);
      return {
        ...p,
        price,
        title,
        asin,
        pricePerUnit: enhanced.pricePerUnit,
      } as LocalizedProduct;
    })
    .filter((p): p is LocalizedProduct => p !== null);

  // Parse filter params into FilterState format
  const filters = {
    search: filterParams.search || "",
    condition: Array.isArray(filterParams.condition)
      ? filterParams.condition
      : filterParams.condition
        ? filterParams.condition.split(",")
        : [],
    technology: Array.isArray(filterParams.technology)
      ? filterParams.technology
      : filterParams.technology
        ? filterParams.technology.split(",")
        : [],
    formFactor: Array.isArray(filterParams.formFactor)
      ? filterParams.formFactor
      : filterParams.formFactor
        ? filterParams.formFactor.split(",")
        : [],
    minCapacity: filterParams.minCapacity
      ? parseFloat(filterParams.minCapacity)
      : null,
    maxCapacity: filterParams.maxCapacity
      ? parseFloat(filterParams.maxCapacity)
      : null,
    sortBy: filterParams.sortBy || "pricePerUnit",
    sortOrder: filterParams.sortOrder || "asc",
  };

  // Apply filtering
  const filtered = filterProducts(
    localizedProducts,
    filters,
    categorySlug,
    unitLabel,
  );

  // Apply sorting
  const sorted = sortProducts(
    filtered as LocalizedProduct[],
    filters.sortBy,
    filters.sortOrder,
  ) as LocalizedProduct[];

  return {
    products: sorted,
    totalCount: rawProducts.length,
    filteredCount: sorted.length,
    unitLabel,
    hasProducts: rawProducts.length > 0,
    filters, // Return parsed filters for UI
  };
}
