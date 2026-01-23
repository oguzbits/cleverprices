import { allCategories, CategorySlug } from "@/lib/categories";
import { getAllDeals } from "@/lib/data/dealsData";
import { getProductsByCategory } from "@/lib/product-registry";
import {
  filterProducts,
  normalizeBrand,
  sortProducts,
} from "@/lib/utils/category-utils";
import {
  calculateSavings,
  getLocalizedProductData,
} from "@/lib/utils/products";
import { cacheLife } from "next/cache";
import { getLivePricesForProducts } from "./live-data";
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
 * Price is included but will be overwritten by the loader for live sync.
 */
async function getCachedLocalizedCategoryProducts(
  categorySlug: string,
  countryCode: string,
  version: string = "v1", // Cache buster
): Promise<LocalizedProduct[]> {
  "use cache";
  cacheLife("category");

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
      // Filter out products with no valid price - they shouldn't appear in listings
      if (!price || price <= 0) return null;

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

      // 2. Metrics & Desirability (Initial calculation)
      const { popularityScore } = calculateDesirabilityScore(
        p,
        price || 0,
        title,
        "category",
      );

      const refPrice = p.priceAvg90?.[countryCode] || 0;
      const savings = calculateSavings(price || 0, refPrice);
      const displayListPrice = savings > 0 ? refPrice : undefined;

      // 3. Storage Capacity Extraction
      let capacity = p.capacity;
      let capacityUnit = p.capacityUnit || "";
      let normCap = p.normalizedCapacity || 0;

      if (
        ["hard-drives", "ssds", "external-storage", "storage", "nas"].includes(
          categorySlug,
        ) &&
        (capacity === 1 || !normCap || normCap === 0)
      ) {
        const capMatch = (title || "").match(/(\d+(?:\.\d+)?)\s?(TB|GB)/i);
        if (capMatch) {
          const val = parseFloat(capMatch[1]);
          const unit = capMatch[2].toUpperCase();
          if (unit === "TB") {
            normCap = val * 1000;
            capacity = val;
            capacityUnit = "TB";
          } else {
            normCap = val;
            capacity = val;
            capacityUnit = "GB";
          }
        }
      }

      // 4. Price per Unit (Initial calculation)
      const capacityMB =
        capacityUnit === "TB"
          ? capacity * 1024 * 1024
          : capacityUnit === "GB"
            ? capacity * 1024
            : capacity;
      const pricePerUnit =
        capacityMB > 0 ? ((price || 0) / capacityMB) * 1024 : 0;

      // --- SNAP NORMALIZATION ---
      if (
        (categorySlug === "ssds" || categorySlug === "hard-drives") &&
        normCap > 0 &&
        normCap < 60
      ) {
        normCap = 0;
      }

      if (normCap >= 900) {
        const tbCount = Math.round(normCap / 1000);
        if (Math.abs(normCap - tbCount * 1000) < 100) {
          normCap = tbCount * 1000;
        }
      }

      return {
        id: p.id || 0,
        slug: p.slug,
        asin,
        title,
        price: price || 0,
        pricePerUnit,
        category: p.category,
        image: p.image || "",
        brand: normalizeBrand(p.brand || ""),
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        salesRank: p.salesRank,
        condition: p.condition,
        capacity,
        capacityUnit,
        normalizedCapacity: normCap,
        formFactor: p.formFactor,
        technology: p.technology || "",
        socket,
        cores,
        lastUpdated,
        variationAttributes: p.variationAttributes,
        savings,
        listPrice: displayListPrice,
      } as LocalizedProduct;
    })
    .filter((p): p is LocalizedProduct => p !== null);
}

/**
 * Merges fresh prices into localized products and recalculates price-dependent fields.
 */
async function mergeLivePricesIntoLocalized(
  products: LocalizedProduct[],
  countryCode: string,
): Promise<LocalizedProduct[]> {
  const ids = products.map((p) => p.id);
  if (ids.length === 0) return products;

  const priceMap = await getLivePricesForProducts(ids, countryCode);

  return products.map((p) => {
    const live = priceMap.get(p.id);
    if (!live) return p;

    // Price changed! Recalculate dependencies
    const newPrice = live.price;
    const refPrice = live.priceAvg90 || 0;
    const savings = calculateSavings(newPrice, refPrice);
    const listPrice = savings > 0 ? refPrice : undefined;

    const capacityMB =
      p.capacityUnit === "TB"
        ? p.capacity * 1024 * 1024
        : p.capacityUnit === "GB"
          ? p.capacity * 1024
          : p.capacity;
    const pricePerUnit = capacityMB > 0 ? (newPrice / capacityMB) * 1024 : 0;

    // Popularity score technically depends on price too (in scoring.ts)
    // For now we'll keep the cached popularity score to avoid re-fetching full product details
    // which would hit the DB hard and is probably fine since popularity is mostly salesRank.

    return {
      ...p,
      price: newPrice,
      pricePerUnit,
      savings,
      listPrice,
      lastUpdated: new Date(live.lastUpdated).toISOString(),
    };
  });
}

/**
 * Type for filter option counts: { brand: { Samsung: 213, SanDisk: 138 }, ... }
 */
export type FilterCounts = Record<string, Record<string, number>>;

/**
 * Calculate smart price range buckets based on current product distribution
 */
function calculatePriceRangeBuckets(products: LocalizedProduct[]) {
  if (products.length === 0) return [];
  const prices = products
    .map((p) => p.price)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);
  if (prices.length === 0) return [];

  const min = Math.floor(prices[0]);
  const max = Math.ceil(prices[prices.length - 1]);

  if (prices.length < 10) {
    if (min === max) return [{ label: `${min} €`, min, max }];
    return [{ label: `${min} € bis ${max} €`, min, max }];
  }

  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q2 = prices[Math.floor(prices.length * 0.5)];
  const q3 = prices[Math.floor(prices.length * 0.75)];

  const roundPrice = (p: number) => {
    if (p > 500) return Math.round(p / 50) * 50;
    if (p > 100) return Math.round(p / 10) * 10;
    return Math.round(p / 5) * 5;
  };

  const r1 = roundPrice(q1);
  const r2 = roundPrice(q2);
  const r3 = roundPrice(q3);

  const uniquePoints = Array.from(new Set([r1, r2, r3])).sort((a, b) => a - b);

  if (uniquePoints.length === 0)
    return [{ label: `${min} € bis ${max} €`, min, max }];

  const buckets = [];
  buckets.push({
    label: `bis ${uniquePoints[0]} €`,
    min: null,
    max: uniquePoints[0],
  });

  for (let i = 0; i < uniquePoints.length - 1; i++) {
    buckets.push({
      label: `${uniquePoints[i]} € bis ${uniquePoints[i + 1]} €`,
      min: uniquePoints[i],
      max: uniquePoints[i + 1],
    });
  }

  buckets.push({
    label: `ab ${uniquePoints[uniquePoints.length - 1]} €`,
    min: uniquePoints[uniquePoints.length - 1],
    max: null,
  });

  return buckets;
}

/**
 * Server-side function to get and filter products for a category
 */
export async function getCategoryProducts(
  categorySlug: string,
  countryCode: string,
  filterParams: FilterParams,
) {
  // 1. Get cached localized data (The "static" core)
  const cachedProducts = await getCachedLocalizedCategoryProducts(
    categorySlug,
    countryCode,
    "v30",
  );

  // 2. Merge fresh prices (The "dynamic" layer)
  // This satisfies the "never cache prices" requirement while keeping performance
  const localizedProducts = await mergeLivePricesIntoLocalized(
    cachedProducts,
    countryCode,
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

  const dynamicFilterCounts: FilterCounts = {};
  if (category?.filterGroups) {
    category.filterGroups.forEach((group) => {
      const otherFilters = { ...filters };
      delete (otherFilters as any)[group.field];

      const productsForThisGroup = filterProducts(
        localizedProducts,
        otherFilters,
        categorySlug,
        unitLabel,
      );

      dynamicFilterCounts[group.field] = {};

      productsForThisGroup.forEach((p) => {
        let value =
          group.field === "capacity"
            ? p.normalizedCapacity
            : (p as any)[group.field];
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== 0
        ) {
          const strValue = String(value);
          dynamicFilterCounts[group.field][strValue] =
            (dynamicFilterCounts[group.field][strValue] || 0) + 1;
        }
      });
    });

    if (!dynamicFilterCounts["brand"]) {
      const otherFilters = { ...filters };
      delete (otherFilters as any)["brand"];
      const productsForBrand = filterProducts(
        localizedProducts,
        otherFilters,
        categorySlug,
        unitLabel,
      );
      dynamicFilterCounts["brand"] = {};
      productsForBrand.forEach((p) => {
        if (p.brand)
          dynamicFilterCounts["brand"][p.brand] =
            (dynamicFilterCounts["brand"][p.brand] || 0) + 1;
      });
    }
  }

  const productsMatchingNonPrice = filterProducts(
    localizedProducts,
    { ...filters, minPrice: null, maxPrice: null },
    categorySlug,
    unitLabel,
  );

  const contextMinPrice =
    productsMatchingNonPrice.length > 0
      ? Math.floor(Math.min(...productsMatchingNonPrice.map((p) => p.price)))
      : 0;

  const contextMaxPrice =
    productsMatchingNonPrice.length > 0
      ? Math.ceil(Math.max(...productsMatchingNonPrice.map((p) => p.price)))
      : 1000;

  const priceRanges = calculatePriceRangeBuckets(productsMatchingNonPrice);

  let paginatedProducts = sorted;
  let pagination = null;

  const page = filterParams.page ? parseInt(filterParams.page) : 1;
  const pageSize = 24;
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  paginatedProducts = sorted.slice(start, end);

  pagination = { currentPage: page, totalPages, pageSize, totalItems };

  return {
    products: paginatedProducts,
    allSortedProducts: sorted,
    totalCount: localizedProducts.length,
    filteredCount: sorted.length,
    unitLabel,
    hasProducts: localizedProducts.length > 0,
    filters,
    filterCounts: dynamicFilterCounts,
    minPriceInCategory: contextMinPrice,
    maxPriceInCategory: contextMaxPrice,
    priceRanges,
    lastUpdated:
      localizedProducts.length > 0
        ? localizedProducts.reduce(
            (latest, p) =>
              p.lastUpdated && (!latest || p.lastUpdated > latest)
                ? p.lastUpdated
                : latest,
            null as string | null,
          )
        : null,
    pagination,
  };
}
