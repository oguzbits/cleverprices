"use cache";

import { allCategories, CategorySlug } from "@/lib/categories";
import { getAllDeals } from "@/lib/data/dealsData";
import { getProductsByCategory } from "@/lib/product-registry";
import {
  filterProducts,
  normalizeBrand,
  sortProducts,
} from "@/lib/utils/category-utils";
import { getLocalizedProductData } from "@/lib/utils/products";
import { cacheLife } from "next/cache";
import { calculateDesirabilityScore } from "./scoring";

export interface LocalizedProduct {
  id: number;
  slug: string;
  asin: string;
  title: string;
  price: number;
  pricePerUnit: number;
  popularityScore: number;
  savings: number;
  listPrice?: number;
  category: string;
  image: string;
  brand: string;
  rating: number;
  reviewCount: number;
  salesRank?: number;
  condition: string;
  capacity: number;
  capacityUnit: string;
  normalizedCapacity: number;
  formFactor: string;
  technology: string;
  socket?: string;
  cores?: string;
  lastUpdated?: string;
  variationAttributes?: string;
}

export interface FilterParams {
  search?: string;
  condition?: string | string[];
  technology?: string | string[];
  formFactor?: string | string[];
  brand?: string | string[];
  minCapacity?: string;
  maxCapacity?: string;
  socket?: string[];
  cores?: string[];
  capacity?: string[];
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: string;
  sort?: string;
  view?: string;
  page?: string;
  fetchAll?: boolean;
}

/**
 * Maps the IdealoTopBar sort parameter to sortBy and sortOrder values
 */
function mapSortParam(sort?: string): { sortBy: string; sortOrder: string } {
  switch (sort) {
    case "price_asc":
      return { sortBy: "price", sortOrder: "asc" };
    case "price_desc":
      return { sortBy: "price", sortOrder: "desc" };
    case "pricePerUnit":
    case "price-per-unit":
      return { sortBy: "pricePerUnit", sortOrder: "asc" };
    case "newest":
      return { sortBy: "createdAt", sortOrder: "desc" };
    case "deal":
    case "savings":
      return { sortBy: "savings", sortOrder: "desc" };
    case "popular":
    default:
      return { sortBy: "popularityScore", sortOrder: "desc" };
  }
}

/**
 * RE-USABLE CACHED LAYER: Localizes, scores, and PRUNES products in a category.
 * Pruning is essential to stay under Vercel's 2MB cache limit.
 */
async function getCachedLocalizedCategoryProducts(
  categorySlug: string,
  countryCode: string,
  version: string = "v1", // Cache buster
): Promise<LocalizedProduct[]> {
  cacheLife("category" as any); // 11h revalidation

  let rawProducts;
  if (categorySlug === "deals") {
    // Fetch a large number of deals to allow for filtering
    rawProducts = await getAllDeals(100, countryCode);
  } else {
    rawProducts = await getProductsByCategory(categorySlug);
  }

  return rawProducts
    .map((p) => {
      const { price, title, asin, lastUpdated } = getLocalizedProductData(
        p,
        countryCode,
      );
      if (!price) return null;

      // 1. Extract static attributes (pruning raw specifications)
      let socket = p.specifications?.Socket || p.specifications?.["Socket-Typ"];
      let cores = p.specifications?.Cores || p.specifications?.Kerne;

      if (categorySlug === "cpu") {
        if (!socket) {
          const socketMatch = (title || "").match(
            /(AM[45]|LGA\s?(\d{4})|sTRX4|sWRX8|Socket\s?[A-Z0-9]+|TR4|FM[12]|LGA\s?115[0156])/i,
          );
          if (socketMatch)
            socket = socketMatch[0].toUpperCase().replace(/\s+/, "");
        }
        if (!cores) {
          const coreMatch = (title || "").match(/(\d+)\s?-?\s?(Core|Kerne)/i);
          if (coreMatch) cores = parseInt(coreMatch[1]).toString();
        }
      }

      // 2. Metrics & Desirability
      const { popularityScore } = calculateDesirabilityScore(
        p,
        price,
        title,
        "category",
      );

      const refPrice = p.priceAvg90?.[countryCode] || 0;
      const savings =
        refPrice && refPrice > price ? (refPrice - price) / refPrice : 0;
      const displayListPrice =
        refPrice && refPrice > price ? refPrice : undefined;

      // 3. Price per Unit (MB for calculation, normalized back to GB/TB in UI)
      const capacityMB =
        p.capacityUnit === "TB"
          ? p.capacity * 1024 * 1024
          : p.capacityUnit === "GB"
            ? p.capacity * 1024
            : p.capacity;
      const pricePerUnit = capacityMB > 0 ? (price / capacityMB) * 1024 : 0;

      // --- CAPACITY NORMALIZATION & SNAP ---
      let normCap = p.normalizedCapacity || 0;

      // 1. Thresholding: Filter out low-capacity trash/accessories from SSDs/HDDs
      if (
        (categorySlug === "ssds" || categorySlug === "hard-drives") &&
        normCap > 0 &&
        normCap < 60
      ) {
        normCap = 0;
      }

      // 2. Snapping: Map 1024 -> 1000, 2048 -> 2000, etc. for cleaner filters
      if (normCap >= 900) {
        // Find nearest TB multiple
        const tbCount = Math.round(normCap / 1000);
        // Only snap if within 10% of a TB boundary (e.g. 1024)
        if (Math.abs(normCap - tbCount * 1000) < 100) {
          normCap = tbCount * 1000;
        }
      }

      // 4. Return PRUNED object
      return {
        id: p.id || 0,
        slug: p.slug,
        asin,
        title,
        price,
        pricePerUnit,
        popularityScore,
        savings,
        listPrice: displayListPrice,
        category: p.category,
        image: p.image || "",
        brand: normalizeBrand(p.brand || ""),
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        salesRank: p.salesRank,
        condition: p.condition,
        capacity: p.capacity,
        capacityUnit: p.capacityUnit,
        normalizedCapacity: normCap,
        formFactor: p.formFactor,
        technology: p.technology || "",
        socket,
        cores,
        lastUpdated,
        variationAttributes: p.variationAttributes,
      } as LocalizedProduct;
    })
    .filter((p): p is LocalizedProduct => p !== null);
}

/**
 * Type for filter option counts: { brand: { Samsung: 213, SanDisk: 138 }, ... }
 */
export type FilterCounts = Record<string, Record<string, number>>;

/**
 * Calculate how many products match each filter option value.
 * This enables showing counts like "(213)" next to each filter checkbox.
 */
function calculateFilterCounts(
  products: LocalizedProduct[],
  filterGroups: { field: string }[],
): FilterCounts {
  const counts: FilterCounts = {};

  // Initialize all filter fields
  filterGroups.forEach((group) => {
    counts[group.field] = {};
  });

  // Also count brands always (common filter)
  counts["brand"] = {};

  // Count occurrences for each product
  products.forEach((p) => {
    // Brand counts
    if (p.brand) {
      counts["brand"][p.brand] = (counts["brand"][p.brand] || 0) + 1;
    }

    // Dynamic filter group counts
    filterGroups.forEach((group) => {
      let value;
      if (group.field === "capacity") {
        value = p.normalizedCapacity;
      } else {
        value = (p as any)[group.field];
      }

      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== 0
      ) {
        const strValue = String(value);
        counts[group.field][strValue] =
          (counts[group.field][strValue] || 0) + 1;
      }
    });
  });

  return counts;
}

/**
 * Server-side function to get and filter products for a category
 */
export async function getCategoryProducts(
  categorySlug: string,
  countryCode: string,
  filterParams: FilterParams,
) {
  // Super fast cached access to pruned product list
  const localizedProducts = await getCachedLocalizedCategoryProducts(
    categorySlug,
    countryCode,
    "v24",
  );

  const category = allCategories[categorySlug as CategorySlug];
  const unitLabel = category?.unitType || "TB";
  const mappedSort = filterParams.sort
    ? mapSortParam(filterParams.sort)
    : { sortBy: filterParams.sortBy, sortOrder: filterParams.sortOrder };

  const filters: any = {
    search: filterParams.search || "",
    sortBy: mappedSort.sortBy || "popularityScore",
    sortOrder: mappedSort.sortOrder || "desc",
    minPrice: filterParams.minPrice ? parseFloat(filterParams.minPrice) : null,
    maxPrice: filterParams.maxPrice ? parseFloat(filterParams.maxPrice) : null,
    minCapacity: filterParams.minCapacity
      ? parseFloat(filterParams.minCapacity)
      : null,
    maxCapacity: filterParams.maxCapacity
      ? parseFloat(filterParams.maxCapacity)
      : null,
    socket: filterParams.socket || [],
    cores: filterParams.cores || [],
    capacity: filterParams.capacity || [],
  };

  // Dynamically parse filters
  Object.keys(filterParams).forEach((key) => {
    if (
      [
        "search",
        "sortBy",
        "sortOrder",
        "sort",
        "view",
        "minPrice",
        "maxPrice",
        "minCapacity",
        "maxCapacity",
        "socket",
        "cores",
        "page",
        "fetchAll",
      ].includes(key)
    )
      return;
    const value = filterParams[key as keyof FilterParams];
    if (value === true || value === false) return;
    if (value) {
      filters[key] = Array.isArray(value)
        ? value
        : (value as string).split(",");
    } else {
      filters[key] = [];
    }
  });

  const filtered = filterProducts(
    localizedProducts,
    filters,
    categorySlug,
    unitLabel,
  );

  // If we only need the products for filter options, skip sorting and pagination
  if (filterParams.fetchAll) {
    return {
      products: filtered,
      filteredCount: filtered.length,
      unitLabel,
      hasProducts: localizedProducts.length > 0,
      filters,
    } as any;
  }

  const sorted = sortProducts(
    filtered,
    filters.sortBy,
    filters.sortOrder,
  ) as LocalizedProduct[];

  let paginatedProducts = sorted;
  let pagination = null;

  const page = filterParams.page ? parseInt(filterParams.page) : 1;
  const pageSize = 24;
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  paginatedProducts = sorted.slice(start, end);

  pagination = {
    currentPage: page,
    totalPages,
    pageSize,
    totalItems,
  };

  return {
    products: paginatedProducts,
    allSortedProducts: sorted,
    totalCount: localizedProducts.length,
    filteredCount: sorted.length,
    unitLabel,
    hasProducts: localizedProducts.length > 0,
    filters,
    filterCounts: category?.filterGroups
      ? calculateFilterCounts(localizedProducts, category.filterGroups)
      : {},
    maxPriceInCategory:
      localizedProducts.length > 0
        ? Math.ceil(
            localizedProducts.reduce(
              (max, p) => (p.price > max ? p.price : max),
              0,
            ),
          )
        : 1000,
    lastUpdated:
      localizedProducts.length > 0
        ? localizedProducts.reduce(
            (latest, p) => {
              if (p.lastUpdated && (!latest || p.lastUpdated > latest))
                return p.lastUpdated;
              return latest;
            },
            null as string | null,
          )
        : null,
    pagination,
  };
}
