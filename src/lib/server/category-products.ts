import { allCategories, CategorySlug } from "@/lib/categories";
import { getAllDeals } from "@/lib/data/dealsData";
import { getProductsByCategory } from "@/lib/product-registry";
import { normalizeBrand, sortProducts } from "@/lib/utils/category-utils";
import { getLocalizedProductData } from "@/lib/utils/products";
import { parseVariationAttributes } from "@/lib/utils/variants";
import { cacheLife } from "next/cache";
import { getBestPrice } from "../utils/price-selection";
import { calculateProductSavings } from "../utils/products";
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

// Pre-compile regexes for multi-product loop performance
const SOCKET_REGEX =
  /(AM[45]|LGA\s?(\d{4})|sTRX4|sWRX8|Socket\s?[A-Z0-9]+|TR4|FM[12]|LGA\s?115[0156])/i;
const CORES_REGEX = /(\d+)\s?-?\s?(Core|Kerne)/i;
const VARIANT_SOCKET_REGEX = /AM[45]|LGA\s?\d+|TR4/i;
const CAPACITY_REGEX = /(\d+(?:\.\d+)?)\s?(TB|GB|MB)/i;

/**
 * RE-USABLE CACHED LAYER: Localizes, scores, and PRUNES products in a category.
 * Pruning is essential to stay under the 2MB cache limit.
 * Price is included but will be overwritten by the loader for live sync.
 */
export async function getCachedLocalizedCategoryProducts(
  categorySlug: string,
  countryCode: string,
  version: string = "v55", // Cache buster
): Promise<LocalizedProduct[]> {
  "use cache";
  cacheLife("category");

  let rawProducts;
  if (categorySlug === "deals") {
    // Fetch a large number of deals to allow for filtering
    rawProducts = await getAllDeals(250, countryCode);
  } else {
    // [PERFORMANCE] Limit to top 500 products per category to keep mapping and cache deserialization fast.
    // 500 is enough for comprehensive filters and the first few pages of results.
    rawProducts = await getProductsByCategory(
      categorySlug,
      true, // stripHeavyData
      500, // limit
    );
  }

  // Optimize branching by checking category flags outside the hot loop
  const isCpuOrMobo = categorySlug === "cpu" || categorySlug === "motherboards";
  const isCpu = categorySlug === "cpu";
  const isSsd = categorySlug === "ssds";
  const isStorageOrRam = [
    "hard-drives",
    "ssds",
    "external-storage",
    "storage",
    "nas",
    "smartphones",
    "tablets",
    "notebooks",
    "ram",
  ].includes(categorySlug);

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
      let { socket, cores } = p as any;

      // 1.1 Restore missing filters via lightweight parsing (Specifications JSON is stripped for speed)
      const vMap = p.variationAttributes
        ? parseVariationAttributes(p.variationAttributes)
        : {};

      if (isCpuOrMobo) {
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
        if (!cores && isCpu) {
          const coreMatch = title.match(CORES_REGEX);
          if (coreMatch) cores = coreMatch[1];
        }
      }

      let technology = p.technology || "";
      if (!technology && isSsd) {
        const tLower = title.toLowerCase();
        if (tLower.includes("nvme") || tLower.includes("m.2"))
          technology = "NVMe";
        else if (tLower.includes("sata")) technology = "SATA";
      }

      let formFactor = p.formFactor || "";
      if (!formFactor && isSsd) {
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

      // Ensure we have capacity for devices even if not explicitly normalized in DB
      if (isStorageOrRam && (!normCap || normCap === 0)) {
        // Try to get from specifications JSON first (most reliable)
        if (p.specifications && typeof p.specifications === "object") {
          const specs = p.specifications as Record<string, any>;
          const sizeVal =
            specs.Size || specs.Capacity || specs.Speicherkapazität;
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
    })
    .filter((p): p is LocalizedProduct => p !== null);
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

  // 1. Fetch ALL products for the category (Cached)
  const cachedProducts = await getCachedLocalizedCategoryProducts(
    categorySlug,
    countryCode,
    "v55",
  );

  const localizedProducts = cachedProducts;
  const category = allCategories[categorySlug as CategorySlug];
  const unitLabel = category?.unitType || "TB";

  // 3. Optimized Single-Pass Processing (Filtering, Facet Counting, Price Ranges)
  const dynamicFilterCounts: FilterCounts = {};
  const filterFields = category?.filterGroups?.map((g) => g.field) || [];
  if (!filterFields.includes("brand")) filterFields.push("brand");
  filterFields.forEach((f) => (dynamicFilterCounts[f] = {}));

  const filteredProducts: LocalizedProduct[] = [];
  const productsMatchingNonPrice: LocalizedProduct[] = [];

  localizedProducts.forEach((p) => {
    // A. Field Match Status
    const matches: Record<string, boolean> = {};
    matches.brand =
      !filters.brand?.length || filters.brand.includes(p.brand || "");

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
        matches[group.field] = Array.isArray(selected)
          ? selected.includes(pVal)
          : selected === pVal;
      }
    });

    // B. Global Match Status (Search & Condition & Capacity Range)
    const matchesSearch =
      !filters.search ||
      p.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCondition =
      !filters.condition?.length ||
      filters.condition.includes(p.condition || "New");

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
      filteredProducts.push(p);
    }

    if (matchesAllFields) {
      productsMatchingNonPrice.push(p);
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

  const totalFilteredCount = filteredProducts.length;

  // 4. Sort and Paginate
  const sortedProducts = sortProducts(
    filteredProducts,
    filters.sortBy,
    filters.sortOrder,
  );

  const page = filterParams.page ? parseInt(filterParams.page) : 1;
  const pageSize = 24;
  const skip = (page - 1) * pageSize;
  const rawPaginatedProducts = sortedProducts.slice(skip, skip + pageSize);

  const paginatedProducts = await mergeLivePricesIntoLocalized(
    rawPaginatedProducts,
    countryCode,
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
