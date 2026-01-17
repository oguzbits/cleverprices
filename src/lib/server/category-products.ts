import { allCategories, CategorySlug } from "@/lib/categories";
import { getProductsByCategory, Product } from "@/lib/product-registry";
import { filterProducts, sortProducts } from "@/lib/utils/category-utils";
import {
  calculateProductMetrics,
  getLocalizedProductData,
} from "@/lib/utils/products";
import { calculateDesirabilityScore } from "./scoring";
import { unstable_cache } from "next/cache";
import { PRICE_REVALIDATE_SECONDS } from "../site-config";

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
  formFactor: string;
  technology: string;
  socket?: string;
  cores?: string;
  pricesLastUpdated?: Record<string, string>;
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
  sort?: string; // Combined sort param from TopBar (e.g., "price", "price-desc", "popular")
  view?: string; // grid or list
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
      // Sort by highest discount/savings
      return { sortBy: "savings", sortOrder: "desc" };
    case "popular":
    default:
      // Default: sort by popularity score
      return { sortBy: "popularityScore", sortOrder: "desc" };
  }
}

/**
 * RE-USABLE CACHED LAYER: Localizes and scores all products in a category.
 * This is expensive (scoring, JSON parsing, mapping), so we cache it for 11h.
 */
const getCachedLocalizedCategoryProducts = unstable_cache(
  async (
    categorySlug: string,
    countryCode: string,
  ): Promise<LocalizedProduct[]> => {
    const rawProducts = await getProductsByCategory(categorySlug);

    const mapped = rawProducts
      .map((p) => {
        const { price, title, asin } = getLocalizedProductData(p, countryCode);
        if (price === null || price === 0) return null;

        // Extract socket and cores from specifications or title fallback
        let socket =
          p.specifications?.Socket || p.specifications?.["Socket-Typ"];
        let cores = p.specifications?.Cores || p.specifications?.Kerne;

        if (categorySlug === "cpu") {
          if (!socket) {
            const socketMatch = title.match(
              /(AM[45]|LGA\s?(\d{4})|sTRX4|sWRX8|Socket\s?[A-Z0-9]+|TR4|FM[12]|LGA\s?115[0156])/i,
            );
            if (socketMatch) {
              socket = socketMatch[0].toUpperCase().replace(/\s+/, "");
            }
          }
          if (!cores) {
            const coreMatch = title.match(/(\d+)\s?-?\s?(Core|Kerne)/i);
            if (coreMatch) {
              cores = parseInt(coreMatch[1]).toString();
            }
          }
        }

        const enhanced = calculateProductMetrics(p, price || 0);
        const { popularityScore } = calculateDesirabilityScore(
          p,
          price,
          title,
          "category",
        );

        const avg90 = p.priceAvg90?.[countryCode] || 0;
        const avg30 = p.priceAvg30?.[countryCode] || 0;
        const refPrice = avg90 || avg30;

        const savings =
          refPrice && refPrice > price ? (refPrice - price) / refPrice : 0;
        const displayListPrice =
          refPrice && refPrice > price ? refPrice : undefined;

        // Stripping heavy DB data here to save cache size
        return {
          id: p.id || 0,
          slug: p.slug,
          asin,
          title,
          price,
          pricePerUnit: enhanced.pricePerUnit || 0,
          popularityScore,
          savings,
          listPrice: displayListPrice,
          category: p.category,
          image: p.image || "",
          brand: p.brand,
          rating: p.rating || 0,
          reviewCount: p.reviewCount || 0,
          salesRank: p.salesRank,
          condition: p.condition,
          capacity: p.capacity,
          capacityUnit: p.capacityUnit,
          formFactor: p.formFactor,
          technology: p.technology || "",
          socket,
          cores,
          pricesLastUpdated: p.pricesLastUpdated,
          variationAttributes: p.variationAttributes,
        } as LocalizedProduct;
      })
      .filter((p): p is LocalizedProduct => p !== null);

    return mapped;
  },
  ["localized-category-v3"],
  {
    revalidate: PRICE_REVALIDATE_SECONDS,
    tags: ["category-products"],
  },
);

/**
 * Server-side function to get and filter products for a category
 * This replaces the client-side useCategoryProducts hook
 */
export async function getCategoryProducts(
  categorySlug: string,
  countryCode: string,
  filterParams: FilterParams,
) {
  // Load pre-localized and scored products from CACHE (Super Fast)
  const localizedProducts = await getCachedLocalizedCategoryProducts(
    categorySlug,
    countryCode,
  );
  const category = allCategories[categorySlug as CategorySlug];
  const unitLabel = category?.unitType || "TB";

  // Map the sort parameter from TopBar to sortBy/sortOrder
  const mappedSort = filterParams.sort
    ? mapSortParam(filterParams.sort)
    : { sortBy: filterParams.sortBy, sortOrder: filterParams.sortOrder };

  // Parse filter params into FilterState format (generic)
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

  // Dynamically add all other filter params (handled as arrays/comma-separated strings)
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
    ) {
      return;
    }
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

  // Apply filtering
  const filtered = filterProducts(
    localizedProducts,
    filters,
    categorySlug,
    unitLabel,
  );

  // Apply sorting
  const sorted = sortProducts(
    filtered,
    filters.sortBy,
    filters.sortOrder,
  ) as LocalizedProduct[];

  // Apply pagination
  let paginatedProducts = sorted;
  let pagination = null;

  if (!filterParams.fetchAll) {
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
  }

  return {
    products: paginatedProducts,
    allSortedProducts: sorted, // Return the full sorted list for filter calculation
    totalCount: localizedProducts.length,
    filteredCount: sorted.length,
    unitLabel,
    hasProducts: localizedProducts.length > 0,
    filters, // Return parsed filters for UI
    lastUpdated:
      localizedProducts.length > 0
        ? localizedProducts
            .map((p) => p.pricesLastUpdated?.[countryCode])
            .filter((d): d is string => !!d)
            .sort()[0] || null
        : null,
    pagination,
  };
}
