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
  condition: string[];
  [key: string]: string | string[] | number | null | undefined;
}

/**
 * Normalizes brand names to group sub-brands and fix casing/naming inconsistencies.
 */
export function normalizeBrand(brand: string): string {
  if (!brand) return "Generic";
  const b = brand.trim();

  // Mapping of common aliases and sub-brands to parent brand
  const mapping: Record<string, string> = {
    WD_BLACK: "Western Digital",
    WD: "Western Digital",
    "WD Red": "Western Digital",
    "WD Blue": "Western Digital",
    "WD Green": "Western Digital",
    "WD Gold": "Western Digital",
    "Sandisk Technologies, Inc.": "SanDisk",
    "SanDisk Professional": "SanDisk",
    "SP Silicon Power": "Silicon Power",
    "Patriot Memory": "Patriot",
    TOSHIBA: "Toshiba",
    SABRENT: "Sabrent",
    KIOXIA: "Kioxia",
    acer: "Acer",
    fanxiang: "Fanxiang",
    "PNY Technologies": "PNY",
    ASUS: "Asus",
    MSI: "MSI", // Keep MSI caps
    EVGA: "EVGA",
  };

  if (mapping[b]) return mapping[b];

  // Handle common case issues or specific starts
  if (b.toLowerCase().startsWith("western digital")) return "Western Digital";
  if (b.toLowerCase().startsWith("sandisk")) return "SanDisk";

  return b;
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
  const category = allCategories[categorySlug as CategorySlug];
  const searchLower = filters.search?.toLowerCase() || "";

  return products.filter((p) => {
    // 1. Search Filter (integrated into main loop)
    if (searchLower && !p.title.toLowerCase().includes(searchLower)) {
      return false;
    }

    // 2. Brand
    if (filters.brand?.length > 0 && !filters.brand.includes(p.brand || "")) {
      return false;
    }

    // 3. Socket
    if (
      filters.socket?.length > 0 &&
      !filters.socket.includes((p as any).socket || "")
    ) {
      return false;
    }

    // 4. Cores
    if (
      filters.cores?.length > 0 &&
      !filters.cores.includes(((p as any).cores || "").toString())
    ) {
      return false;
    }

    // 5. Capacity (as exact choice)
    if (
      filters.capacity?.length > 0 &&
      !filters.capacity.includes(
        (p.normalizedCapacity || p.capacity || "").toString(),
      )
    ) {
      return false;
    }

    // 5.1 Condition (New, Used, Renewed)
    // Always apply condition filter if present, regardless of category manifest
    if (
      filters.condition?.length > 0 &&
      !filters.condition.includes(p.condition || "New")
    ) {
      return false;
    }

    // 6. Price
    const price = p.price || 0;
    if (filters.minPrice !== null && price < filters.minPrice) return false;
    if (filters.maxPrice !== null && (price === 0 || price > filters.maxPrice))
      return false;

    // 7. Capacity Range (Storage/PSU)
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

    // 8. Dynamic filters (Technology, Form Factor, Condition, etc.)
    if (category?.filterGroups) {
      for (const group of category.filterGroups) {
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
  const isNumericField = field === "capacity";

  products.forEach((p) => {
    // For capacity, find normalizedCapacity to ensure we are using GB base
    let val;
    if (field === "capacity") {
      val = p.normalizedCapacity;
    } else {
      val = (p as any)[field];
    }

    if (val === undefined || val === null || val === "" || val === 0) return;

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

  const arr = Array.from(values);

  if (isNumericField) {
    return arr.sort((a, b) => parseFloat(a) - parseFloat(b));
  }

  return arr.sort();
}
