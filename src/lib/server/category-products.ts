import { allCategories, CategorySlug } from "@/lib/categories";
import { getAllDeals } from "@/lib/data/dealsData";
import {
  type FilterCounts,
  type FilterParams,
  type LocalizedProduct,
  type Product,
  VIRTUAL_CATEGORY_MAP,
} from "@/lib/product-definitions";
import { getFamilyIdentity } from "@/lib/product-families";
import { normalizeBrand, sortProducts } from "@/lib/utils/category-utils";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { getLocalizedProductData } from "@/lib/utils/products";
import { parseVariationAttributes } from "@/lib/utils/variants";

import { getBestPrice } from "../utils/price-selection";
import { calculateProductSavings } from "../utils/products";
import { assertSerializable, serializeSafe } from "../utils/serialization";
import { getLivePricesForProducts } from "./live-data";
import {
  getProductsByCategory,
  getProductsByIds,
  getRawProductsByCategory,
} from "./product-queries";
import { calculateDesirabilityScore } from "./scoring";

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
  p: Product,
  countryCode: string,
  categorySlug: string,
  isCpuOrMobo?: boolean,
  isCpu?: boolean,
  isSsd?: boolean,
  isStorageOrRam?: boolean,
): LocalizedProduct | null {
  const isProductObj = (obj: Product): obj is Product =>
    !!(obj && obj.prices && typeof obj.prices === "object" && obj.id);

  if (
    isProductObj(p) &&
    p.prices[countryCode] !== undefined &&
    p.category !== "ram" &&
    p.category !== "arbeitsspeicher" &&
    p.category !== "smartphones" &&
    p.category !== "tablets" &&
    p.category !== "notebooks"
  ) {
    const priceVal = p.prices[countryCode] as number;
    if (!priceVal || priceVal <= 0) return null;

    const { popularityScore } = calculateDesirabilityScore(
      p,
      priceVal,
      p.title,
      "category",
    );

    const brand = normalizeBrand(p.brand || "Generic");

    return {
      id: p.id,
      slug: p.slug,
      asin: p.asin,
      title: p.title,
      modelTitle: p.modelTitle || getProductIdentity(p).modelTitle,
      variantSuffix: p.variantSuffix || getProductIdentity(p).variantSuffix,
      subtitle: p.subtitle || undefined,
      price: priceVal,
      usedPrice: p.usedPrices?.[countryCode] ?? undefined,
      warehousePrice: p.warehousePrices?.[countryCode] ?? undefined,
      pricePerUnit: p.pricesPerUnit?.[countryCode] || 0,
      popularityScore: popularityScore,
      savings: p.savings || 0,
      listPrice: p.listPrice?.[countryCode] ?? undefined,
      category: p.category || categorySlug,
      image: p.image || p.imageUrl || "",
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
      officialSpecifications:
        typeof p.officialSpecifications === "string"
          ? JSON.parse(p.officialSpecifications)
          : p.officialSpecifications,
      officialTitle: p.officialTitle || undefined,
      specificationsSource: p.specificationsSource || undefined,
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
      "arbeitsspeicher",
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

  const identity = getProductIdentity({ ...p, title });
  const modelTitle = p.modelTitle || identity.modelTitle;
  const variantSuffix = p.variantSuffix || identity.variantSuffix;

  const useIdentityForDisplay = [
    "arbeitsspeicher",
    "ram",
    "smartphones",
    "handy",
    "tablets",
    "notebooks",
    "laptops",
    "monitors",
    "monitore",
    "televisions",
    "fernseher",
  ].includes(actualCategory);

  let displayTitle = title;
  let canonicalSlug = p.slug;
  if (useIdentityForDisplay) {
    displayTitle = identity.displayTitle;
    const variantFamilyIdentity = getFamilyIdentity({ ...p, title }, []);
    canonicalSlug = variantFamilyIdentity.slug;
  }

  if (!price || price <= 0) return null;

  let socket = p.socket;
  let cores = p.cores;

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

  let capacity = p.capacity;
  let capacityUnit = p.capacityUnit || "";
  let normCap = p.normalizedCapacity || 0;

  if (storageOrRam && (!normCap || normCap === 0)) {
    if (p.specifications && typeof p.specifications === "object") {
      const specs = p.specifications as Record<string, unknown>;
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

  const capacityMB =
    capacityUnit === "TB" && capacity
      ? capacity * 1024 * 1024
      : capacityUnit === "GB" && capacity
        ? capacity * 1024
        : capacity;
  const pricePerUnit =
    capacityMB && capacityMB > 0 ? ((price || 0) / capacityMB) * 1024 : 0;

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
    slug: canonicalSlug,
    asin,
    title: displayTitle,
    modelTitle,
    variantSuffix,
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
    officialSpecifications:
      typeof (p.officialSpecifications || p.official_specifications) ===
      "string"
        ? JSON.parse(
            (p.officialSpecifications || p.official_specifications) as string,
          )
        : ((p.officialSpecifications || p.official_specifications) as Record<
            string,
            unknown
          >),
    officialTitle: (p.officialTitle || p.official_title) as string,
    mpn: p.mpn,
    specificationsSource: (p.specificationsSource ||
      p.specifications_source) as string,
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
): Promise<LocalizedProduct[]> {
  let rawProducts;
  if (categorySlug === "deals") {
    rawProducts = await getAllDeals(250, countryCode);
  } else {
    rawProducts = await getProductsByCategory(categorySlug, true, 2000);
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
) {
  const virtual = VIRTUAL_CATEGORY_MAP[categorySlug];
  const queryCategory = virtual ? virtual.dbCategory : categorySlug;

  let rawProducts;
  if (categorySlug === "deals") {
    rawProducts = await getAllDeals(1000, countryCode);
  } else {
    rawProducts = await getRawProductsByCategory(
      queryCategory,
      countryCode,
      2000,
    );
  }

  return rawProducts
    .map((p) => {
      const localized = mapRawToLocalizedProduct(
        p as Product,
        countryCode,
        categorySlug,
      );
      if (!localized) return null;

      if (virtual?.forcedFilters) {
        const matchesAll = Object.entries(virtual.forcedFilters).every(
          ([field, allowedValues]) => {
            const valLower = String(localized[field] || "").toLowerCase();
            return allowedValues.some((v) => v.toLowerCase() === valLower);
          },
        );
        if (!matchesAll) return null;
      }

      return localized;
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

    const { popularityScore } = calculateDesirabilityScore(
      p,
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
      lastUpdated:
        live.lastUpdated && !isNaN(new Date(live.lastUpdated).getTime())
          ? new Date(live.lastUpdated).toISOString()
          : new Date(1735689600000).toISOString(),
    };
  });
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
  const rawProducts = await getProductsByIds(ids, countryCode, true);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filters: Record<string, any> = {
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
    condition: filterParams.condition || [],
    brand: filterParams.brand || [],
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
    if (typeof value === "boolean") return;
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
  // [GSC FIX] getLeanCategoryProducts now handles mapping of virtual categories (e.g. apple-iphone -> smartphones)
  const leanProducts = await getLeanCategoryProducts(categorySlug, countryCode);

  const category = allCategories[categorySlug as CategorySlug];
  const unitLabel = category?.unitType || "TB";

  // [PERFORMANCE] Pre-compute filter values once to avoid redundant work in the 2000-item loop
  const searchLower = filters.search?.toLowerCase() || "";
  const filterSummary = {
    socket: new Set(
      (Array.isArray(filters.socket) ? filters.socket : [filters.socket]).map(
        (s: string) => s.toLowerCase(),
      ),
    ),
    cores: new Set(
      (Array.isArray(filters.cores) ? filters.cores : [filters.cores]).map(
        (c: string) => c.toLowerCase(),
      ),
    ),
    condition: new Set(
      (Array.isArray(filters.condition)
        ? filters.condition
        : [filters.condition]
      ).map((c: string) => c.toLowerCase()),
    ),
    brand: new Set(
      (Array.isArray(filters.brand) ? filters.brand : [filters.brand]).map(
        (b: string) => b.toLowerCase(),
      ),
    ),
  };

  // 3. Optimized Single-Pass Processing (Filtering, Facet Counting, Price Ranges)
  const dynamicFilterCounts: FilterCounts = {};
  const filterFields = category?.filterGroups?.map((g) => g.field) || [];
  if (!filterFields.includes("brand")) filterFields.push("brand");
  filterFields.forEach((f) => (dynamicFilterCounts[f] = {}));

  const filteredLeanProducts: LocalizedProduct[] = [];
  const leanMatchingNonPrice: LocalizedProduct[] = [];
  const orphanedProducts: LocalizedProduct[] = [];
  const familyVariants: Record<string, LocalizedProduct[]> = {};

  let contextMinPrice = Infinity;
  let contextMaxPrice = -Infinity;

  leanProducts.forEach((p) => {
    // A. Field Match Status
    const matches: Record<string, boolean> = {};
    const pBrandLower = (p.brand || "").toLowerCase();
    matches.brand =
      !filterSummary.brand.size || filterSummary.brand.has(pBrandLower);

    category?.filterGroups?.forEach((group) => {
      if (group.field === "brand") return;
      const selected = filters[group.field];
      if (!selected || (Array.isArray(selected) && selected.length === 0)) {
        matches[group.field] = true;
      } else {
        const pVal =
          group.field === "capacity"
            ? String(p.normalizedCapacity || p.capacity || "")
            : String(p[group.field] || "");

        const pValLower = pVal.toLowerCase();

        // Support both array and single value
        if (Array.isArray(selected)) {
          matches[group.field] = selected.some(
            (s) => s.toLowerCase() === pValLower,
          );
        } else {
          matches[group.field] = selected.toLowerCase() === pValLower;
        }
      }
    });

    // B. Global Match Status (Search & Condition & Capacity Range)
    const matchesSearch =
      !searchLower || p.title.toLowerCase().includes(searchLower);

    const pConditionLower = (p.condition || "New").toLowerCase();
    const matchesCondition =
      !filterSummary.condition.size ||
      filterSummary.condition.has(pConditionLower);

    // Capacity Range (Storage/PSU)
    const cap = p.capacity || 0;
    let matchesCapRange = true;
    if (filters.minCapacity !== null) {
      const minValReal =
        ((filters.minCapacity as number) || 0) *
        (unitLabel === "TB" ? 1000 : 1);
      if (cap < minValReal) matchesCapRange = false;
    }
    if (filters.maxCapacity !== null) {
      const maxValReal =
        ((filters.maxCapacity as number) || 999999) *
        (unitLabel === "TB" ? 1000 : 1);
      if (cap > maxValReal) matchesCapRange = false;
    }

    if (!matchesSearch || !matchesCondition || !matchesCapRange) return;

    // C. Price Match Status
    const matchesPrice =
      (!filters.minPrice || p.price >= (filters.minPrice as number)) &&
      (!filters.maxPrice ||
        (p.price > 0 && p.price <= (filters.maxPrice as number))) &&
      p.price > 0;

    // D. Final Logic
    const matchesAllFields = filterFields.every((f) => matches[f]);

    if (matchesAllFields && matchesPrice) {
      filteredLeanProducts.push(p);
    }

    if (matchesAllFields) {
      leanMatchingNonPrice.push(p);

      // [PERFORMANCE] Track min/max inline
      if (p.price > 0) {
        if (p.price < contextMinPrice) contextMinPrice = p.price;
        if (p.price > contextMaxPrice) contextMaxPrice = p.price;
      }

      if (p.parentAsin) {
        const pIdentity = getProductIdentity(p);
        const familyKey = `${p.parentAsin}_${(pIdentity.modelTitle || "").toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
        if (familyKey) {
          if (!familyVariants[familyKey]) familyVariants[familyKey] = [];
          familyVariants[familyKey].push(p);
        } else {
          orphanedProducts.push(p);
        }
      } else {
        orphanedProducts.push(p);
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
              : String(p[field] || "");

        if (pVal && pVal !== "0" && pVal !== "null" && pVal !== "undefined") {
          dynamicFilterCounts[field][pVal] =
            (dynamicFilterCounts[field][pVal] || 0) + 1;
        }
      }
    });
  });

  // --- GENERATE HUB CARDS ---
  const { getFamilyIdentity, getFamilyRepresentative } =
    await import("../product-families");
  const { getCanonicalFamilyIdsBatch } = await import("../product-registry");
  const collapsedLeanProducts: Record<string, LocalizedProduct> = {};

  const familyEntries = Object.entries(familyVariants);

  // 1. Prepare batch requests for canonical IDs for all identified families
  const familiesToResolve = familyEntries
    .map(([familyKey, variants]) => {
      const representative = getFamilyRepresentative(variants);
      if (!representative) return null;
      return {
        familyKey,
        parentAsin: representative.parentAsin || "",
        currentId: representative.id || 0,
        modelTitle: representative.modelTitle,
        representative,
        variants,
      };
    })
    .filter((f): f is NonNullable<typeof f> => !!f && !!f.parentAsin);

  // 2. Fetch all canonical IDs in ONE round-trip
  const canonicalIdMap = await getCanonicalFamilyIdsBatch(familiesToResolve);

  // 3. Process families using the pre-resolved IDs
  familiesToResolve.forEach((family) => {
    const { familyKey, variants, representative } = family;

    // Collect all variants that match filters for this hub
    const matchingVariants = variants.filter((v: LocalizedProduct) => {
      const matchesPrice =
        (!((filters.minPrice as number | null) || 0) ||
          v.price >= (filters.minPrice as number)) &&
        (!((filters.maxPrice as number | null) || 0) ||
          (v.price > 0 && v.price <= (filters.maxPrice as number))) &&
        v.price > 0;
      return matchesPrice;
    });

    if (matchingVariants.length === 0) return;

    const canonicalId = canonicalIdMap.get(family) || representative.id || 0;

    const familyIdentity = getFamilyIdentity(
      {
        ...representative,
        isParentView: true,
        syntheticId: canonicalId,
      } as Product,
      variants as Product[],
    );

    // Hub adopts the consensus identity
    collapsedLeanProducts[familyKey] = {
      ...representative,
      isParentView: true,
      variantCount: variants.length,
      displayId: representative.id,
      canonicalId: canonicalId,
      title: familyIdentity.modelTitle || familyIdentity.fullModel,
      modelTitle: familyIdentity.modelTitle,
      variantSuffix: familyIdentity.variantSuffix,
      slug: familyIdentity.slug,
    };
  });

  // Keep ALL original products, PLUS the Hub Cards
  const finalFilteredLeanProducts = [
    ...filteredLeanProducts,
    ...Object.values(collapsedLeanProducts).filter(
      (h) => (h.variantCount ?? 0) > 1,
    ),
  ];

  const totalFilteredCount = finalFilteredLeanProducts.length;

  // 4. Sort and Paginate (on Lean data)
  const sortedLeanProducts = sortProducts(
    finalFilteredLeanProducts,
    filters.sortBy as string,
    filters.sortOrder,
  );

  const page = filterParams.page ? parseInt(filterParams.page) : 1;
  const pageSize = 24;
  const skip = (page - 1) * pageSize;
  const pageLeanProducts = sortedLeanProducts.slice(skip, skip + pageSize);

  // 5. HYDRATION: Fetch full objects only for the 24 visible items
  // We fetch them from the deep cache using the IDs from our lean set
  // This is surgical: we only hydrate what we actually display.
  // Deduplicate IDs because a Hub card and its cheapest variant might share the same display ID
  const hydrationIds = Array.from(
    new Set(
      pageLeanProducts
        .map((p) => (p.isParentView ? p.displayId : p.id))
        .filter((id): id is number => typeof id === "number"),
    ),
  );

  const rawPaginatedProducts = await getLocalizedProductsByIds(
    hydrationIds,
    categorySlug,
    countryCode,
  );

  // Merge live prices (the final display step)
  // [STABILITY SHIELD] Unified path for Shared Cache stability.
  // Cache is now the shield, so we serve fresh data to everyone.
  const paginatedProducts = await mergeLivePricesIntoLocalized(
    rawPaginatedProducts,
    countryCode,
  );

  const finalPaginatedProducts = pageLeanProducts
    .map((lean) => {
      const rawId = lean.isParentView ? lean.displayId : lean.id;
      const rp = paginatedProducts.find((p) => p.id === rawId);
      if (!rp) return null;

      if (lean.isParentView) {
        const syntheticId = 900000000 + (lean.canonicalId || lean.id);
        return {
          ...rp,
          isParentView: true,
          variantCount: lean.variantCount,
          id: syntheticId,
          slug: lean.slug,
          title: lean.title,
          modelTitle: lean.modelTitle,
          variantSuffix: lean.variantSuffix,
        };
      }

      return { ...rp };
    })
    .filter(Boolean) as LocalizedProduct[];

  const contextMinPriceFinal =
    contextMinPrice === Infinity ? 0 : Math.floor(contextMinPrice);
  const contextMaxPriceFinal =
    contextMaxPrice === -Infinity ? 1000 : Math.ceil(contextMaxPrice);

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(totalFilteredCount / pageSize),
    pageSize,
    totalItems: totalFilteredCount,
  };

  return serializeSafe(
    assertSerializable(
      {
        products: finalPaginatedProducts,
        totalCount: leanProducts.length,
        filteredCount: totalFilteredCount,
        unitLabel,
        hasProducts: finalFilteredLeanProducts.length > 0,
        filters: {
          socket: Array.from(filterSummary.socket),
          cores: Array.from(filterSummary.cores),
          condition: Array.from(filterSummary.condition),
          brand: Array.from(filterSummary.brand),
        },
        filterCounts: dynamicFilterCounts,
        minPriceInCategory: contextMinPriceFinal,
        maxPriceInCategory: contextMaxPriceFinal,
        priceRanges: calculatePriceRangeBuckets(leanMatchingNonPrice),
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
      },
      "getCategoryProducts",
    ),
  );
}

/**
 * Calculates price range buckets for the filter panel.
 */
function calculatePriceRangeBuckets(products: LocalizedProduct[]): {
  label: string;
  count: number;
  min: number;
  max: number;
}[] {
  if (products.length === 0) return [];
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  if (prices.length === 0) return [];

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;

  if (range <= 0) {
    return [
      {
        label: `${Math.floor(min)}€`,
        count: products.length,
        min,
        max,
      },
    ];
  }

  const bucketCount = 5;
  const bucketSize = Math.ceil(range / bucketCount);
  const buckets = [];

  for (let i = 0; i < bucketCount; i++) {
    const bMin = min + i * bucketSize;
    const bMax = bMin + bucketSize;
    const count = prices.filter((p) => p >= bMin && p < bMax).length;
    if (count > 0) {
      buckets.push({
        label: `${Math.floor(bMin)} - ${Math.floor(bMax)}€`,
        count,
        min: bMin,
        max: bMax,
      });
    }
  }
  return buckets;
}
