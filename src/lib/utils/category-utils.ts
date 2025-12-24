import { Product } from "@/lib/product-registry";

export interface FilterState {
  search: string;
  condition: string[];
  technology: string[];
  formFactor: string[];
  minCapacity: number | null;
  maxCapacity: number | null;
  sortBy: string;
  sortOrder: string;
}

/**
 * Utility to filter products based on the current filter state
 */
export function filterProducts(
  products: Product[],
  filters: FilterState,
  categorySlug: string,
  unitLabel: string,
): Product[] {
  let filtered = [...products];

  // 1. Search Filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((p) =>
      p.title.toLowerCase().includes(searchLower),
    );
  }

  // 2. Condition Filter
  if (filters.condition && filters.condition.length > 0) {
    filtered = filtered.filter((p) => filters.condition.includes(p.condition));
  }

  // 3. Technology / Certification Filter
  if (filters.technology && filters.technology.length > 0) {
    filtered = filtered.filter((p) => {
      const techVal = p.technology || "";
      const certVal = (p as any).certification || "";

      if (categorySlug === "power-supplies") {
        return (
          filters.technology.includes(techVal) ||
          filters.technology.includes(certVal)
        );
      }
      return filters.technology.includes(techVal);
    });
  }

  // 4. Form Factor Filter
  if (filters.formFactor && filters.formFactor.length > 0) {
    filtered = filtered.filter((p) =>
      filters.formFactor.includes(p.formFactor),
    );
  }

  // 5. Capacity Filters
  if (filters.minCapacity !== null) {
    const minValReal =
      unitLabel === "TB" ? filters.minCapacity * 1000 : filters.minCapacity;
    filtered = filtered.filter(
      (p) => (p.normalizedCapacity ?? p.capacity) >= minValReal,
    );
  }

  if (filters.maxCapacity !== null) {
    const maxValReal =
      unitLabel === "TB" ? filters.maxCapacity * 1000 : filters.maxCapacity;
    filtered = filtered.filter(
      (p) => (p.normalizedCapacity ?? p.capacity) <= maxValReal,
    );
  }

  return filtered;
}

/**
 * Utility to sort products based on the current filter state
 */
export function sortProducts(
  products: Product[],
  sortBy: string,
  sortOrder: string,
): Product[] {
  return [...products].sort((a, b) => {
    let key = sortBy as keyof Product;

    // Default to pricePerUnit if key is missing or is legacy 'pricePerUnit'
    if (!key) {
      key = "pricePerUnit";
    }

    // Map 'capacity' sort request to 'normalizedCapacity' for correct unit-aware sorting
    if (key === "capacity") {
      key = "normalizedCapacity" as any;
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
 * Category-specific filter options
 */
export function getCategoryFilterOptions(categorySlug: string) {
  const isRAM = categorySlug === "ram";
  const isPSU = categorySlug === "power-supplies";

  const techOptions = isRAM
    ? ["DDR4", "DDR5"]
    : isPSU
      ? ["80+ Bronze", "80+ Gold", "80+ Platinum", "80+"]
      : ["HDD", "SSD", "SAS"];

  const formFactorOptions = isRAM
    ? ["DIMM", "SO-DIMM"]
    : isPSU
      ? ["ATX", "SFX", "SFX-L", "Mini-ITX"]
      : [
          'Internal 3.5"',
          'Internal 2.5"',
          'External 3.5"',
          'External 2.5"',
          "M.2 NVMe",
          "M.2 SATA",
        ];

  return { techOptions, formFactorOptions };
}
