"use cache";

import { allCategories, CategorySlug } from "@/lib/categories";
import { Product, getProductsByCategory } from "@/lib/product-registry";
import { filterProducts, sortProducts } from "@/lib/utils/category-utils";
import {
  calculateProductMetrics,
  getLocalizedProductData,
} from "@/lib/utils/products";
import { cacheLife } from "next/cache";

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
  sort?: string; // Combined sort param from TopBar (e.g., "price", "price-desc", "popular")
  view?: string; // grid or list
}

/**
 * Maps the IdealoTopBar sort parameter to sortBy and sortOrder values
 */
function mapSortParam(sort?: string): { sortBy: string; sortOrder: string } {
  switch (sort) {
    case "price":
      return { sortBy: "price", sortOrder: "asc" };
    case "price-desc":
      return { sortBy: "price", sortOrder: "desc" };
    case "price-per-unit":
      return { sortBy: "pricePerUnit", sortOrder: "asc" };
    case "newest":
      return { sortBy: "createdAt", sortOrder: "desc" };
    case "savings":
      // Sort by highest discount/savings - using pricePerUnit as proxy
      return { sortBy: "pricePerUnit", sortOrder: "asc" };
    case "popular":
    default:
      // Default: sort by price per unit (best value)
      return { sortBy: "pricePerUnit", sortOrder: "asc" };
  }
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
  // Apply 'prices' profile defined in next.config.ts
  cacheLife("prices");

  // Load raw products for this category
  const rawProducts = await getProductsByCategory(categorySlug);
  const category = allCategories[categorySlug as CategorySlug];
  const unitLabel = category?.unitType || "TB";

  // Localize products for this country
  const localizedProducts = rawProducts
    .map((p) => {
      const { price, title, asin } = getLocalizedProductData(p, countryCode);
      if (price === null || price === 0) return null;

      const enhanced = calculateProductMetrics(p, price || 0);
      return {
        ...p,
        price,
        title,
        asin,
        pricePerUnit: enhanced.pricePerUnit,
      } as LocalizedProduct;
    })
    .filter((p): p is LocalizedProduct => p !== null);

  // Map the sort parameter from TopBar to sortBy/sortOrder
  const mappedSort = filterParams.sort
    ? mapSortParam(filterParams.sort)
    : { sortBy: filterParams.sortBy, sortOrder: filterParams.sortOrder };

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
    sortBy: mappedSort.sortBy || "pricePerUnit",
    sortOrder: mappedSort.sortOrder || "asc",
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
    lastUpdated:
      rawProducts.length > 0
        ? new Date().toISOString() // In a real app, you'd get the max(last_updated) from DB
        : null,
  };
}
