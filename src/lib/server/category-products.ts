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
import { getBestPrice } from "../utils/price-selection";
import { calculateSavings } from "../utils/products";
import { getLivePricesForProducts } from "./live-data";
import { calculateDesirabilityScore } from "./scoring";

export interface LocalizedProduct {
  id: number;
  slug: string;
  asin: string;
  title: string;
  subtitle?: string;
  price: number;
  usedPrice?: number;
  warehousePrice?: number;
  pricePerUnit: number;
  popularityScore: number;
  savings: number;
  listPrice?: number;
  category: string;
  image: string;
  brand: string;
  rating: number;
  reviewCount: number;
  monthlySold: number;
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
  parentAsin?: string; // For grouping
  isVariantGroup?: boolean; // UI flag
  variantCount?: number; // UI flag
  officialSpecifications?: any; // Structured official specs
  specificationsSource?: string;
  officialTitle?: string;
  mpn?: string;
}

// ... (Wait, I can't put ALL of it here. The prompt size limits might clip it?
// 2MB limit mentioned in code :)
// I will try to supply the full block. It is about 200 lines.

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
 * Pruning is essential to stay under the 2MB cache limit.
 * Price is included but will be overwritten by the loader for live sync.
 */
export async function getCachedLocalizedCategoryProducts(
  categorySlug: string,
  countryCode: string,
  version: string = "v1", // Cache buster
): Promise<LocalizedProduct[]> {
  "use cache";
  cacheLife("category");

  let rawProducts;
  if (categorySlug === "deals") {
    // Fetch a large number of deals to allow for filtering and surpressing no-names via popularity scoring
    rawProducts = await getAllDeals(250, countryCode);
  } else {
    rawProducts = await getProductsByCategory(categorySlug);
  }

  return rawProducts
    .map((p) => {
      const {
        price,
        usedPrice,
        warehousePrice,
        title,
        asin,
        parentAsin,
        lastUpdated,
      } = getLocalizedProductData(p, countryCode);
      // Filter out products with no valid price - they shouldn't appear in listings
      if (!price || price <= 0) return null;

      // 1. Extract core attributes (already pre-extracted by Product Registry)
      let { socket, cores } = p;

      // 1.1 Enforce correct condition from title (Fixes stale cache issues)
      // Sometimes the DB cache might label a Renewed item as New. We fix it here.
      let condition = p.condition;
      const titleLower = title.toLowerCase();
      if (
        titleLower.includes("(generalüberholt)") ||
        titleLower.includes("generalüberholt") ||
        titleLower.includes("erneuert") ||
        titleLower.includes("renewed") ||
        titleLower.includes("refurbished") ||
        titleLower.includes("b-ware")
      ) {
        condition = "Renewed";
      } else if (condition === "Used") {
        condition = "Used";
      } else {
        condition = "New";
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

      // Ensure we have capacity for devices even if not explicitly normalized in DB
      if (
        [
          "hard-drives",
          "ssds",
          "external-storage",
          "storage",
          "nas",
          "smartphones",
          "tablets",
          "notebooks",
          "ram",
        ].includes(categorySlug) &&
        (!normCap || normCap === 0)
      ) {
        // Try to get from specifications JSON first (most reliable)
        if (p.specifications && typeof p.specifications === "object") {
          const specs = p.specifications as Record<string, any>;
          const sizeVal =
            specs.Size || specs.Capacity || specs.Speicherkapazität;
          if (sizeVal && typeof sizeVal === "string") {
            const match = sizeVal.match(/(\d+(?:\.\d+)?)\s?(TB|GB|MB)/i);
            if (match) {
              const val = parseFloat(match[1]);
              const unit = match[2].toUpperCase();
              if (unit === "TB") {
                normCap = val * 1000;
                capacity = val;
                capacityUnit = "TB";
              } else if (unit === "GB") {
                normCap = val;
                capacity = val;
                capacityUnit = "GB";
              } else if (unit === "MB") {
                normCap = val / 1000;
                capacity = val;
                capacityUnit = "MB";
              }
            }
          }
        }

        // Fallback to title regex if still not found
        if (!normCap || normCap === 0) {
          const capMatch = (title || "").match(
            /\b(\d+(?:\.\d+)?)\s?(TB|GB|MB)\b/i,
          );
          if (capMatch) {
            const val = parseFloat(capMatch[1]);
            const unit = capMatch[2].toUpperCase();
            if (unit === "TB") {
              normCap = val * 1000;
              capacity = val;
              capacityUnit = "TB";
            } else if (unit === "GB") {
              normCap = val;
              capacity = val;
              capacityUnit = "GB";
            } else if (unit === "MB") {
              normCap = val / 1000;
              capacity = val;
              capacityUnit = "MB";
            }
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
        subtitle: p.subtitle,
        price: price || 0,
        usedPrice: usedPrice || undefined,
        warehousePrice: warehousePrice || undefined,
        pricePerUnit,
        popularityScore,
        category: p.category,
        image: p.image || "",
        brand: normalizeBrand(p.brand || ""),
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        monthlySold: p.monthlySold || 0,
        salesRank: p.salesRank,
        condition,
        capacity,
        capacityUnit,
        normalizedCapacity: normCap,
        formFactor: p.formFactor,
        technology: p.technology || "",
        socket,
        cores,
        lastUpdated,
        savings,
        listPrice: displayListPrice,
        parentAsin,
        variationAttributes: p.variationAttributes,
        specificationsSource: p.specificationsSource,
        officialTitle: p.officialTitle,
        mpn: p.mpn,
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

    // Unified logic selection!
    const newPrice = getBestPrice({
      price: live.price,
      usedPrice: live.usedPrice,
      warehousePrice: live.warehousePrice,
    });
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

    // Recalculate popularity score as it heavily depends on price (commercial value)
    const { popularityScore } = calculateDesirabilityScore(
      p as any,
      newPrice,
      p.title,
      "category",
    );

    return {
      ...p,
      price: newPrice,
      usedPrice: live.usedPrice || undefined,
      warehousePrice: live.warehousePrice || undefined,
      pricePerUnit,
      popularityScore,
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

export async function getCategoryProducts(
  categorySlug: string,
  countryCode: string,
  filterParams: FilterParams,
) {
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

  // 1. Fetch ALL products for the category (Cached)
  // We use this "fat" fetch + in-memory filter/sort because the "Desirability Score"
  // (Prestige/Freshness/Commercial Value) is too complex for efficient SQL.
  // Since categories have < 2000 items, this is fast and safe (2MB limit).
  const cachedProducts = await getCachedLocalizedCategoryProducts(
    categorySlug,
    countryCode,
    "v47",
  );

  // 2. [OPTIMIZATION] Skip Live Price Merge for the FULL list
  // Reason: Calling Keepa/Idealo for 500+ products causes 429 Rate Limits and slow page loads.
  // Trade-off: The "Desirability Score" sort uses CACHED prices (up to 24h old).
  // This is acceptable because:
  //   a) Popularity/Prestige doesn't change hourly
  //   b) Extreme price swings are rare
  //   c) We still show LIVE prices for the visible 24 products below.
  const localizedProducts = cachedProducts;

  const category = allCategories[categorySlug as CategorySlug];
  const unitLabel = category?.unitType || "TB";

  // 3. Apply Filters In-Memory
  const filteredProducts = filterProducts(
    localizedProducts,
    filters as any,
    categorySlug,
    unitLabel,
  );

  // 4. Variant Expansion (Idealo Style)
  // Logic:
  // - Keep ALL original variants.
  // - For each group (by parentAsin), ADD a synthetic "Parent Card" ("Alle Varianten").
  // - Parent Card gets:
  //   - Price: Min price of group
  //   - Popularity: Sum of all variants (so it ranks #1)
  //   - isVariantGroup: true

  // 2. [FLAT LIST MODE] - User requested "DO NOT MERGE"
  // We simply pass through the standardized title/subtitle from mapDbProduct.
  const extendedProducts: LocalizedProduct[] = filteredProducts.map((p) => {
    return {
      ...p,
      // Remove any parentAsin/syntheticId to prevents any accidental grouping downstream
      parentAsin: undefined,
      syntheticId: undefined,
      isVariantGroup: false,
    };
  });

  // SKIP GROUPING LOGIC ENTIRELY
  // The code below previously created synthetic parents. Now we skip it.

  // 5. Sort the EXTENDED list
  const sortedProducts = sortProducts(
    extendedProducts,
    filters.sortBy,
    filters.sortOrder,
  );

  const totalFilteredCount = sortedProducts.length;

  // 5. Paginate In-Memory
  const page = filterParams.page ? parseInt(filterParams.page) : 1;
  const pageSize = 24;
  const skip = (page - 1) * pageSize;
  const rawPaginatedProducts = sortedProducts.slice(skip, skip + pageSize);

  // 6. [CRITICAL] Merge Live Prices for VISIBLE products only
  // This ensures the user sees correct, up-to-the-minute prices/availability
  // without hammering the external API for the entire back-catalog.
  const paginatedProducts = await mergeLivePricesIntoLocalized(
    rawPaginatedProducts,
    countryCode,
  );

  // 6. Context (Refactored to re-use our already-fetched list)
  // No need to re-fetch cachedProducts or mergeLivePrices again.
  // We use localizedProducts (full list with live prices) for aggregation.

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

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(totalFilteredCount / pageSize),
    pageSize,
    totalItems: totalFilteredCount,
  };

  return {
    products: paginatedProducts,
    totalCount: localizedProducts.length,
    filteredCount: totalFilteredCount,
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
