import { allCategories, CategorySlug } from "@/lib/categories";
import { getAllDeals } from "@/lib/data/dealsData";
import { type Product } from "@/lib/product-definitions";
import { normalizeBrand, sortProducts } from "@/lib/utils/category-utils";
import { getLocalizedProductData } from "@/lib/utils/products";
import { parseVariationAttributes } from "@/lib/utils/variants";
import { cacheLife } from "next/cache";
import { getBestPrice } from "../utils/price-selection";
import { calculateProductSavings } from "../utils/products";
import { getLivePricesForProducts } from "./live-data";
import {
  getProductsByCategory,
  getProductsByIds,
  getRawProductsByCategory,
} from "./product-queries";
import { calculateDesirabilityScore } from "./scoring";

import { type LocalizedProduct } from "@/lib/product-definitions";
export type { LocalizedProduct };

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

// Pre-compile regexes for multi-product loop performance
const SOCKET_REGEX =
  /(AM[45]|LGA\s?(\d{4})|sTRX4|sWRX8|Socket\s?[A-Z0-9]+|TR4|FM[12]|LGA\s?115[0156])/i;
const CORES_REGEX = /(\d+)\s?-?\s?(Core|Kerne)/i;
const VARIANT_SOCKET_REGEX = /AM[45]|LGA\s?\d+|TR4/i;
const CAPACITY_REGEX = /(\d+(?:\.\d+)?)\s?(TB|GB|MB)/i;

/**
 * Single source of truth for mapping raw DB products to localized display products.
 * Ensures consistent titles, slugs, and attributes across all parts of the app.
 */
export function mapRawToLocalizedProduct(
  p: any,
  countryCode: string,
  categorySlug: string,
  // Optimization flags (now optional, can be derived from p.category if not provided)
  isCpuOrMobo?: boolean,
  isCpu?: boolean,
  isSsd?: boolean,
  isStorageOrRam?: boolean,
): LocalizedProduct | null {
  // [PERFORMANCE] FAST-PATH: If this is already a localized product or a full product with merged prices
  // (e.g. from getAllDeals), we skip the heavy mapping logic.
  // We check for the presence of the 'prices' object which indicates p is a Product entity.
  const isProductObj = (obj: any): obj is Product =>
    obj &&
    obj.prices &&
    typeof obj.prices === "object" &&
    obj.id &&
    obj.specifications !== undefined;

  if (isProductObj(p) && p.prices[countryCode] !== undefined) {
    const priceVal = p.prices[countryCode] as number;
    if (!priceVal || priceVal <= 0) return null;

    const { popularityScore } = calculateDesirabilityScore(
      p,
      priceVal,
      p.title,
      "category",
    );

    const brand = normalizeBrand(p.brand || "Generic");

    // Just ensure the structure matches LocalizedProduct
    return {
      id: p.id,
      slug: p.slug,
      asin: p.asin,
      title: p.title,
      subtitle: p.subtitle || undefined,
      price: priceVal,
      usedPrice: p.usedPrices?.[countryCode] ?? undefined,
      warehousePrice: p.warehousePrices?.[countryCode] ?? undefined,
      pricePerUnit: p.pricesPerUnit?.[countryCode] || 0,
      popularityScore: popularityScore,
      savings: p.savings || 0,
      listPrice: p.listPrice?.[countryCode] ?? undefined,
      category: p.category || categorySlug,
      image: (p as any).image || (p as any).imageUrl || "",
      brand,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      monthlySold: p.monthlySold || 0,
      salesRank: p.salesRank ?? undefined,
      condition: p.condition || "New",
      capacity: p.capacity || 0,
      capacityUnit: p.capacityUnit || "",
      normalizedCapacity: p.normalizedCapacity || 0,
      formFactor: p.formFactor || "",
      technology: p.technology || "",
      socket: p.socket || undefined,
      cores: p.cores || undefined,
      lastUpdated: p.pricesLastUpdated?.[countryCode],
      variationAttributes: p.variationAttributes || undefined,
      parentAsin: p.parentAsin || undefined,
      specificationsSource: p.specificationsSource || undefined,
      officialTitle: p.officialTitle || undefined,
      mpn: p.mpn || undefined,
    } as LocalizedProduct;
  }

  const actualCategory = p.category || categorySlug;
  const cpuOrMobo =
    isCpuOrMobo ??
    (actualCategory === "cpu" || actualCategory === "motherboards");
  const cpu = isCpu ?? actualCategory === "cpu";
  const ssd = isSsd ?? actualCategory === "ssds";
  const storageOrRam =
    isStorageOrRam ??
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
    ].includes(actualCategory);
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
  let { socket, cores } = p as any;

  // 1.1 Restore missing filters via lightweight parsing (Specifications JSON is stripped for speed)
  const vMap = p.variationAttributes
    ? parseVariationAttributes(p.variationAttributes)
    : {};

  if (cpuOrMobo) {
    if (!socket) {
      const socketMatch = title.match(SOCKET_REGEX);
      if (socketMatch) {
        socket = socketMatch[0].toUpperCase().replace(/\s+/, "");
      } else {
        const variantSocket = vMap["Sockel"] || vMap["Stil"];
        if (variantSocket?.match(VARIANT_SOCKET_REGEX)) {
          socket = variantSocket.trim();
        }
      }
    }
    if (!cores && cpu) {
      const coreMatch = title.match(CORES_REGEX);
      if (coreMatch) cores = coreMatch[1];
    }
  }

  let technology = p.technology || "";
  if (!technology && ssd) {
    const tLower = title.toLowerCase();
    if (tLower.includes("nvme") || tLower.includes("m.2")) technology = "NVMe";
    else if (tLower.includes("sata")) technology = "SATA";
  }

  let formFactor = p.formFactor || "";
  if (!formFactor && ssd) {
    const tLower = title.toLowerCase();
    if (tLower.includes("m.2") || tLower.includes("m2")) formFactor = "M.2";
    else if (
      tLower.includes("2.5 zoll") ||
      tLower.includes('2.5"') ||
      tLower.includes("2.5-inch") ||
      tLower.includes("2.5 in")
    )
      formFactor = "2.5 Zoll";
  }

  // 1.2 Enforce correct condition from title (Fixes stale cache issues)
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
  const savings = calculateProductSavings({
    price: price || 0,
    usedPrice: usedPrice || 0,
    warehousePrice: warehousePrice || 0,
    avg90: refPrice,
  });
  const displayListPrice = savings > 0 ? refPrice : undefined;

  // 3. Storage Capacity Extraction
  let capacity = p.capacity;
  let capacityUnit = p.capacityUnit || "";
  let normCap = p.normalizedCapacity || 0;

  if (storageOrRam && (!normCap || normCap === 0)) {
    if (p.specifications && typeof p.specifications === "object") {
      const specs = p.specifications as Record<string, any>;
      const sizeVal = specs.Size || specs.Capacity || specs.Speicherkapazität;
      if (sizeVal && typeof sizeVal === "string") {
        const match = sizeVal.match(CAPACITY_REGEX);
        if (match) {
          const val = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          if (unit === "TB") {
            capacity = val;
            capacityUnit = "TB";
            normCap = val * 1000;
          } else if (unit === "GB") {
            capacity = val;
            capacityUnit = "GB";
            normCap = val;
          } else if (unit === "MB") {
            capacity = val;
            capacityUnit = "MB";
            normCap = val / 1000;
          }
        }
      }
    }

    if (!normCap || normCap === 0) {
      const capMatch = (title || "").match(/\b(\d+(?:\.\d+)?)\s?(TB|GB|MB)\b/i);
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
  const pricePerUnit = capacityMB > 0 ? ((price || 0) / capacityMB) * 1024 : 0;

  // --- SNAP NORMALIZATION ---
  if (
    (actualCategory === "ssds" || actualCategory === "hard-drives") &&
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
    formFactor,
    technology,
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
}

/**
 * RE-USABLE CACHED LAYER: Localizes, scores, and PRUNES products in a category.
 * Pruning is essential to stay under the 2MB cache limit.
 * Price is included but will be overwritten by the loader for live sync.
 */
export async function getCachedLocalizedCategoryProducts(
  categorySlug: string,
  countryCode: string,
  version: string = "v60", // Cache buster
): Promise<LocalizedProduct[]> {
  "use cache";
  cacheLife("category");

  let rawProducts;
  if (categorySlug === "deals") {
    // Fetch a large number of deals to allow for filtering
    rawProducts = await getAllDeals(250, countryCode);
  } else {
    // [PERFORMANCE] Limit to top 2000 products per category
    rawProducts = await getProductsByCategory(
      categorySlug,
      true, // stripHeavyData
      2000, // limit
    );
  }

  return rawProducts
    .map((p) => mapRawToLocalizedProduct(p, countryCode, categorySlug))
    .filter((p): p is LocalizedProduct => p !== null);
}

/**
 * LEAN CACHE LAYER: Only stores fields needed for filtering and sorting.
 * No images, no subtitles, no variation attributes.
 * This makes deserialization from Redis drastically faster (TTFB win).
 */
export async function getLeanCategoryProducts(
  categorySlug: string,
  countryCode: string,
  version: string = "v60",
) {
  "use cache";
  cacheLife("category");

  let rawProducts;
  if (categorySlug === "deals") {
    rawProducts = await getAllDeals(1000, countryCode);
  } else {
    rawProducts = await getRawProductsByCategory(
      categorySlug,
      countryCode,
      2000,
    );
  }

  return rawProducts
    .map((p) => {
      const localized = mapRawToLocalizedProduct(p, countryCode, categorySlug);
      if (!localized) return null;

      return {
        id: localized.id,
        title: localized.title,
        brand: localized.brand,
        price: localized.price,
        popularityScore: localized.popularityScore,
        condition: localized.condition,
        capacity: localized.capacity,
        normalizedCapacity: localized.normalizedCapacity,
        formFactor: localized.formFactor,
        technology: localized.technology,
        socket: localized.socket,
        cores: localized.cores,
        savings: localized.savings,
        pricePerUnit: localized.pricePerUnit,
        salesRank: localized.salesRank,
      };
    })
    .filter((p): p is any => p !== null);
}

/**
 * Merges fresh prices into localized products and recalculates price-dependent fields.
 */
export async function mergeLivePricesIntoLocalized(
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
      condition: p.condition,
    });
    const refPrice = live.priceAvg90 || 0;
    const savings = calculateProductSavings({
      price: live.price,
      usedPrice: live.usedPrice,
      warehousePrice: live.warehousePrice,
      avg90: refPrice,
    });
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

/**
 * Hydrates only a specific set of IDs into full LocalizedProducts.
 * This is the "Ghost" part of the Lean & Ghost architecture.
 */
export async function getLocalizedProductsByIds(
  ids: number[],
  categorySlug: string,
  countryCode: string,
): Promise<LocalizedProduct[]> {
  const rawProducts = await getProductsByIds(
    ids,
    countryCode,
    true, // stripHeavyData (History not needed for listing)
  );

  return rawProducts
    .map((p) => mapRawToLocalizedProduct(p, countryCode, categorySlug))
    .filter((p): p is LocalizedProduct => p !== null);
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
      // Normalize to array for consistent filtering logic
      filters[key] = Array.isArray(value)
        ? value
        : (value as string).split(",");
    } else {
      filters[key] = [];
    }
  });

  // 1. Fetch LEAN products for filtering/sorting (High Speed)
  const leanProducts = await getLeanCategoryProducts(
    categorySlug,
    countryCode,
    "v60",
  );

  const category = allCategories[categorySlug as CategorySlug];
  const unitLabel = category?.unitType || "TB";

  // [PERFORMANCE] Pre-compute filter values once to avoid redundant work in the 2000-item loop
  const searchLower = filters.search?.toLowerCase() || "";
  const filterSummary = {
    socket: new Set(filters.socket || []),
    cores: new Set(filters.cores || []),
    condition: new Set(filters.condition || []),
    brand: new Set(filters.brand || []),
  };

  // 3. Optimized Single-Pass Processing (Filtering, Facet Counting, Price Ranges)
  const dynamicFilterCounts: FilterCounts = {};
  const filterFields = category?.filterGroups?.map((g) => g.field) || [];
  if (!filterFields.includes("brand")) filterFields.push("brand");
  filterFields.forEach((f) => (dynamicFilterCounts[f] = {}));

  const filteredLeanProducts: any[] = [];
  const leanMatchingNonPrice: any[] = [];

  let contextMinPrice = Infinity;
  let contextMaxPrice = -Infinity;

  leanProducts.forEach((p) => {
    // A. Field Match Status
    const matches: Record<string, boolean> = {};
    matches.brand =
      !filterSummary.brand.size || filterSummary.brand.has(p.brand || "");

    category?.filterGroups?.forEach((group) => {
      if (group.field === "brand") return;
      const selected = filters[group.field];
      if (!selected || (Array.isArray(selected) && selected.length === 0)) {
        matches[group.field] = true;
      } else {
        const pVal =
          group.field === "capacity"
            ? String(p.normalizedCapacity || p.capacity || "")
            : String((p as any)[group.field] || "");

        // Support both array and single value
        if (Array.isArray(selected)) {
          matches[group.field] = selected.includes(pVal);
        } else {
          matches[group.field] = selected === pVal;
        }
      }
    });

    // B. Global Match Status (Search & Condition & Capacity Range)
    const matchesSearch =
      !searchLower || p.title.toLowerCase().includes(searchLower);

    const pCondition = p.condition || "New";
    const matchesCondition =
      !filterSummary.condition.size || filterSummary.condition.has(pCondition);

    // Capacity Range (Storage/PSU)
    const cap = p.capacity || 0;
    let matchesCapRange = true;
    if (filters.minCapacity !== null) {
      const minValReal =
        unitLabel === "TB" ? filters.minCapacity * 1000 : filters.minCapacity;
      if (cap < minValReal) matchesCapRange = false;
    }
    if (filters.maxCapacity !== null) {
      const maxValReal =
        unitLabel === "TB" ? filters.maxCapacity * 1000 : filters.maxCapacity;
      if (cap > maxValReal) matchesCapRange = false;
    }

    if (!matchesSearch || !matchesCondition || !matchesCapRange) return;

    // C. Price Match Status
    const matchesPrice =
      (!filters.minPrice || p.price >= filters.minPrice) &&
      (!filters.maxPrice || (p.price > 0 && p.price <= filters.maxPrice));

    // D. Final Logic
    const matchesAllFields = filterFields.every((f) => matches[f]);

    if (matchesAllFields && matchesPrice) {
      filteredLeanProducts.push(p);
    }

    if (matchesAllFields) {
      leanMatchingNonPrice.push(p);

      // [PERFORMANCE] Track min/max inline to avoid expensive Math.min/max(...spread)
      if (p.price > 0) {
        if (p.price < contextMinPrice) contextMinPrice = p.price;
        if (p.price > contextMaxPrice) contextMaxPrice = p.price;
      }
    }

    // Facet counts
    filterFields.forEach((field) => {
      const matchesOthers =
        matchesPrice && filterFields.every((f) => f === field || matches[f]);
      if (matchesOthers) {
        const pVal =
          field === "capacity"
            ? String(p.normalizedCapacity || p.capacity || "")
            : field === "brand"
              ? p.brand
              : String((p as any)[field] || "");

        if (pVal && pVal !== "0" && pVal !== "null" && pVal !== "undefined") {
          dynamicFilterCounts[field][pVal] =
            (dynamicFilterCounts[field][pVal] || 0) + 1;
        }
      }
    });
  });

  const totalFilteredCount = filteredLeanProducts.length;

  // 4. Sort and Paginate (on Lean data)
  const sortedLeanProducts = sortProducts(
    filteredLeanProducts,
    filters.sortBy,
    filters.sortOrder,
  );

  const page = filterParams.page ? parseInt(filterParams.page) : 1;
  const pageSize = 24;
  const skip = (page - 1) * pageSize;
  const pageLeanProducts = sortedLeanProducts.slice(skip, skip + pageSize);

  // 5. HYDRATION: Fetch full objects only for the 24 visible items
  // We fetch them from the deep cache using the IDs from our lean set
  // This is surgical: we only hydrate what we actually display.
  const rawPaginatedProducts = await getLocalizedProductsByIds(
    pageLeanProducts.map((p) => p.id),
    categorySlug,
    countryCode,
  );

  // Merge live prices (the final display step)
  const paginatedProducts = await mergeLivePricesIntoLocalized(
    rawPaginatedProducts,
    countryCode,
  );

  const contextMinPriceFinal =
    contextMinPrice === Infinity ? 0 : Math.floor(contextMinPrice);
  const contextMaxPriceFinal =
    contextMaxPrice === -Infinity ? 1000 : Math.ceil(contextMaxPrice);

  const priceRanges = calculatePriceRangeBuckets(leanMatchingNonPrice);

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(totalFilteredCount / pageSize),
    pageSize,
    totalItems: totalFilteredCount,
  };

  return {
    products: paginatedProducts,
    totalCount: leanProducts.length,
    filteredCount: totalFilteredCount,
    unitLabel,
    hasProducts: leanProducts.length > 0,
    filters,
    filterCounts: dynamicFilterCounts,
    minPriceInCategory: contextMinPriceFinal,
    maxPriceInCategory: contextMaxPriceFinal,
    priceRanges,
    lastUpdated:
      rawPaginatedProducts.length > 0
        ? rawPaginatedProducts.reduce(
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
