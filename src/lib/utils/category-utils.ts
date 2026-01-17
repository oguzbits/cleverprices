import { allCategories, CategorySlug } from "@/lib/categories";
import type { LocalizedProduct } from "../server/category-products";

export interface FilterState {
  search: string;
  brand: string[];
  socket: string[];
  cores: string[];
  capacity: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minCapacity: number | null;
  maxCapacity: number | null;
  [key: string]: string | string[] | number | null | undefined;
}

/**
 * Utility to filter products based on the current filter state
 */
export function filterProducts(
  products: LocalizedProduct[],
  filters: FilterState,
  categorySlug: string,
  unitLabel: string,
): LocalizedProduct[] {
  let filtered = [...products];

  // 1. Search Filter
  if (filters.search && typeof filters.search === "string") {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((p) => {
      const title = p.title;
      return title.toLowerCase().includes(searchLower);
    });
  }

  const category = allCategories[categorySlug as CategorySlug];

  // 2. Main Filters
  filtered = filtered.filter((p) => {
    // Brand
    if (filters.brand?.length > 0 && !filters.brand.includes(p.brand || "")) {
      return false;
    }

    // Socket
    if (
      filters.socket?.length > 0 &&
      !filters.socket.includes((p as any).socket || "")
    ) {
      return false;
    }

    // Cores
    if (
      filters.cores?.length > 0 &&
      !filters.cores.includes(((p as any).cores || "").toString())
    ) {
      return false;
    }

    // Capacity (as exact choice, e.g. for GPU)
    if (
      filters.capacity?.length > 0 &&
      !filters.capacity.includes((p.capacity || "").toString())
    ) {
      return false;
    }

    // Price
    const price = p.price || 0;
    if (filters.minPrice !== null && price < filters.minPrice) return false;
    if (filters.maxPrice !== null && (price === 0 || price > filters.maxPrice))
      return false;

    // Capacity Range (Storage/PSU)
    const cap = p.capacity || 0;
    if (filters.minCapacity !== null) {
      const minValReal =
        unitLabel === "TB" ? filters.minCapacity * 1000 : filters.minCapacity;
      if (cap < minValReal) return false;
    }
    if (filters.maxCapacity !== null) {
      const maxValReal =
        unitLabel === "TB" ? filters.maxCapacity * 1000 : filters.maxCapacity;
      if (cap > maxValReal) return false;
    }

    // Dynamic filters (Technology, Form Factor, Condition, etc.)
    if (category?.filterGroups) {
      for (const group of category.filterGroups) {
        // Skip already handled main filters
        if (["brand", "socket", "cores", "capacity"].includes(group.field))
          continue;

        const selected = filters[group.field];
        if (Array.isArray(selected) && selected.length > 0) {
          const pVal = String((p as any)[group.field] || "");
          if (!selected.includes(pVal)) return false;
        }
      }
    }

    return true;
  });

  return filtered;
}

/**
 * Utility to sort products based on the current filter state
 */
export function sortProducts(
  products: any[], // Use any to allow localized products with 'price' field
  sortBy: string,
  sortOrder: string,
): any[] {
  return [...products].sort((a, b) => {
    let key = sortBy as string;

    // Default to popularity if key is missing or 'popular'
    if (!key || key === "popular") {
      key = "popularityScore";
    }

    // Map 'price' sort request
    if (key === "price") {
      const aVal = a.price || 0;
      const bVal = b.price || 0;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }

    // Map 'capacity' sort request
    if (key === "capacity") {
      key = "normalizedCapacity";
    }

    const aValue = a[key];
    const bValue = b[key];

    const isAsc = sortOrder === "asc";

    if (typeof aValue === "number" && typeof bValue === "number") {
      return isAsc ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue || "");
    const bStr = String(bValue || "");

    if (aStr < bStr) return isAsc ? -1 : 1;
    if (aStr > bStr) return isAsc ? 1 : -1;
    return 0;
  });
}

/**
 * Utility to discover all unique values for a field in a list of products
 */
export function getUniqueFieldValues(
  products: LocalizedProduct[],
  field: string,
): string[] {
  const values = new Set<string>();

  products.forEach((p) => {
    let val = (p as any)[field];
    if (val === undefined || val === null || val === "") return;

    if (Array.isArray(val)) {
      val.forEach((v) => v && values.add(v.toString()));
    } else if (typeof val === "string" && val.includes(",")) {
      val.split(",").forEach((v) => {
        const trimmed = v.trim();
        if (trimmed) values.add(trimmed);
      });
    } else {
      values.add(val.toString());
    }
  });

  return Array.from(values).sort();
}
