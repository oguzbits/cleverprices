import { allCategories, CategorySlug } from "@/lib/categories";
import { getProductsByCategory, Product } from "@/lib/product-registry";
import { filterProducts, sortProducts } from "@/lib/utils/category-utils";
import {
  calculateProductMetrics,
  getLocalizedProductData,
} from "@/lib/utils/products";
import { calculateDesirabilityScore } from "./scoring";

export interface LocalizedProduct extends Omit<
  Product,
  "asin" | "title" | "price"
> {
  asin: string;
  title: string;
  price: number;
  pricePerUnit: number;
  popularityScore: number;
  savings: number;
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
 * Server-side function to get and filter products for a category
 * This replaces the client-side useCategoryProducts hook
 */
export async function getCategoryProducts(
  categorySlug: string,
  countryCode: string,
  filterParams: FilterParams,
) {
  console.log(
    `[DEBUG] getCategoryProducts: slug=${categorySlug}, sort=${filterParams.sort}`,
  );

  // Load raw products for this category
  const rawProducts = await getProductsByCategory(categorySlug);
  const category = allCategories[categorySlug as CategorySlug];
  const unitLabel = category?.unitType || "TB";

  // Localize products for this country
  const localizedProducts = rawProducts
    .map((p) => {
      const { price, title, asin } = getLocalizedProductData(p, countryCode);
      if (price === null || price === 0) return null;

      // Extract socket and cores from specifications or title fallback
      let socket = p.specifications?.Socket || p.specifications?.["Socket-Typ"];
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

      // --- Popularity Scoring (Shared Logic) ---
      const { popularityScore } = calculateDesirabilityScore(
        p,
        price,
        title,
        "category",
      );

      // --- Savings Calculation ---
      // Prioritize real market history (avg90, avg30) over MSRP (listPrice)
      // because listPrice can often be placeholder data (e.g., 1000€)
      const listPrice = p.listPrice?.[countryCode] || 0;
      const avg90 = p.priceAvg90?.[countryCode] || 0;
      const avg30 = p.priceAvg30?.[countryCode] || 0;

      // Realistic Reference Price Logic:
      // 1. Prefer 90-day market average
      // 2. Fallback to 30-day market average
      let refPrice = avg90 || avg30;

      const savings =
        refPrice && refPrice > price ? (refPrice - price) / refPrice : 0;
      const displayListPrice =
        refPrice && refPrice > price ? refPrice : undefined;

      return {
        ...p,
        socket,
        cores,
        price,
        title,
        asin,
        pricePerUnit: enhanced.pricePerUnit,
        popularityScore,
        savings,
        listPrice: displayListPrice, // Override with what we used for comparison
      } as LocalizedProduct;
    })
    .filter((p): p is LocalizedProduct => p !== null);

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
    filtered as LocalizedProduct[],
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
    totalCount: rawProducts.length,
    filteredCount: sorted.length,
    unitLabel,
    hasProducts: rawProducts.length > 0,
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
