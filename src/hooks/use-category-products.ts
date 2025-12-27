import { Category } from "@/lib/categories";
import { Product, getProductsByCategory } from "@/lib/product-registry";
import {
  filterProducts,
  FilterState,
  sortProducts,
} from "@/lib/utils/category-utils";
import {
  calculateProductMetrics,
  getLocalizedProductData,
} from "@/lib/utils/products";
import { useMemo } from "react";

export interface LocalizedProduct extends Omit<Product, "asin" | "title" | "price"> {
  asin: string;
  title: string;
  price: number;
}

interface UseCategoryProductsProps {
  category: Omit<Category, "icon"> | undefined;
  filters: FilterState;
  countryCode?: string;
}

export function useCategoryProducts({
  category,
  filters,
  countryCode = "us",
}: UseCategoryProductsProps) {
  // Load raw products for this category
  const rawProducts = useMemo(() => {
    if (!category) return [];
    return getProductsByCategory(category.slug);
  }, [category]);

  // Derived configuration
  const unitLabel = category?.unitType || "TB";

  // Localize products for this country
  const localizedProducts = useMemo(() => {
    return rawProducts
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
  }, [rawProducts, countryCode]);

  // Apply filtering and sorting
  const filteredAndSortedProducts = useMemo(() => {
    if (!category) return [];

    const filtered = filterProducts(
      localizedProducts as any,
      filters,
      category.slug,
      unitLabel,
    );

    return sortProducts(
      filtered as any,
      filters.sortBy,
      filters.sortOrder,
    ) as LocalizedProduct[];
  }, [localizedProducts, filters, category, unitLabel]);

  return {
    products: filteredAndSortedProducts,
    totalCount: rawProducts.length,
    filteredCount: filteredAndSortedProducts.length,
    unitLabel,
    hasProducts: rawProducts.length > 0,
  };
}
