import { type Price, prices, products } from "@/db/schema";

// Virtual Category Mapping
// Many categories in our manifest are actually specific views of a larger DB category.
// For example, 'apple-iphone' is actually 'smartphones' with 'brand=Apple'.
// Without this mapping, these high-intent SEO pages would appear empty and be noindexed.
export const VIRTUAL_CATEGORY_MAP: Record<
  string,
  { dbCategory: string; forcedFilters?: Record<string, string[]> }
> = {
  "apple-iphone": {
    dbCategory: "smartphones",
    forcedFilters: { brand: ["Apple"] },
  },
  "samsung-galaxy": {
    dbCategory: "smartphones",
    forcedFilters: { brand: ["Samsung"] },
  },
};

// Lightweight price columns - lean schema

export interface LocalizedProduct {
  id: number;
  slug: string;
  asin: string;
  title: string;
  modelTitle?: string;
  variantSuffix?: string;
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
  brand: string | null;
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
  officialSpecifications?: Record<string, unknown>; // Structured official specs
  specificationsSource?: string;
  officialTitle?: string;
  updatedAt?: string;
  mpn?: string;
  canonicalId?: number | null;
  [key: string]: unknown;
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

export type FilterCounts = Record<string, Record<string, number>>;

export const litePriceColumns = {
  id: prices.id,
  productId: prices.productId,
  country: prices.country,
  price: prices.price,
  usedPrice: prices.usedPrice,
  warehousePrice: prices.warehousePrice,
  listPrice: prices.listPrice,
  priceAvg90: prices.priceAvg90,
  pricePerUnit: prices.pricePerUnit,
  currency: prices.currency,
  lastUpdated: prices.lastUpdated,
};

// ULTRA-lightweight price columns for variant lists
export const superLitePriceColumns = {
  id: prices.id,
  productId: prices.productId,
  country: prices.country,
  price: prices.price,
  usedPrice: prices.usedPrice,
  warehousePrice: prices.warehousePrice,
  currency: prices.currency,
  lastUpdated: prices.lastUpdated,
};

// Define lightweight columns for list views
export const liteProductColumns = {
  id: products.id,
  asin: products.asin,
  gtin: products.gtin,
  mpn: products.mpn,
  slug: products.slug,
  title: products.title,
  brand: products.brand,
  category: products.category,
  imageUrl: products.imageUrl,
  manufacturer: products.manufacturer,
  capacity: products.capacity,
  capacityUnit: products.capacityUnit,
  normalizedCapacity: products.normalizedCapacity,
  formFactor: products.formFactor,
  technology: products.technology,
  condition: products.condition,
  rating: products.rating,
  reviewCount: products.reviewCount,
  salesRank: products.salesRank,
  monthlySold: products.monthlySold,
  parentAsin: products.parentAsin,
  variationAttributes: products.variationAttributes,
  specifications: products.specifications,
  officialSpecifications: products.officialSpecifications,
  officialTitle: products.officialTitle,
  energyLabel: products.energyLabel,
  historySeeded: products.historySeeded,
  icecatId: products.icecatId,
  enrichmentStatus: products.enrichmentStatus,
  specificationsSource: products.specificationsSource,
  completenessScore: products.completenessScore,
  lastEnrichedAt: products.lastEnrichedAt,
  canonicalId: products.canonicalId,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
};

// ULTRA-lean columns for the filtering tier
export const filteringProductColumns = {
  id: products.id,
  slug: products.slug,
  asin: products.asin,
  gtin: products.gtin,
  mpn: products.mpn,
  title: products.title,
  brand: products.brand,
  category: products.category,
  manufacturer: products.manufacturer,
  condition: products.condition,
  capacity: products.capacity,
  capacityUnit: products.capacityUnit,
  normalizedCapacity: products.normalizedCapacity,
  formFactor: products.formFactor,
  technology: products.technology,
  salesRank: products.salesRank,
  rating: products.rating,
  reviewCount: products.reviewCount,
  monthlySold: products.monthlySold,
  parentAsin: products.parentAsin,
  variationAttributes: products.variationAttributes,
  canonicalId: products.canonicalId,
  officialSpecifications: products.officialSpecifications,
  specificationsSource: products.specificationsSource,
  officialTitle: products.officialTitle,
  enrichmentStatus: products.enrichmentStatus,
  updatedAt: products.updatedAt,
};

export interface Product {
  id?: number;
  slug: string;
  asin: string;
  title: string;
  modelTitle?: string; // Pre-computed SSOT title
  variantSuffix?: string; // Pre-computed SSOT variant suffix
  rawTitle?: string;
  subtitle?: string;
  category: string;
  imageUrl?: string;
  image?: string; // Legacy field
  affiliateUrl?: string; // Optional for some views
  gtin?: string | null;
  brand: string | null;
  prices: Record<string, number>;
  usedPrices?: Record<string, number>;
  warehousePrices?: Record<string, number>;
  price?: number; // Normalized active price for display
  usedPrice?: number;
  warehousePrice?: number;
  currency?: string;
  pricePerUnit?: number;
  pricesLastUpdated?: Record<string, string>;
  parentAsin?: string;
  variationAttributes?: string;
  specifications?: Record<string, unknown>;
  officialSpecifications?: Record<string, unknown>;
  officialTitle?: string | null;
  socket?: string;
  cores?: string;
  manufacturer?: string;
  features?: string[];
  capacity: number;
  capacityUnit: string;
  normalizedCapacity?: number;
  formFactor: string;
  technology?: string;
  condition: "New" | "Used" | "Renewed";
  priceHistory?: { date: string; price: number }[];
  rating?: number;
  reviewCount?: number;
  energyLabel?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  salesRank?: number;
  priceAvg90?: Record<string, number>;
  monthlySold?: number;
  mpn?: string | null;
  popularityScore?: number;
  createdAt?: string;
  releaseDate?: string;
  savings?: number;
  listPrice?: Record<string, number>;
  pricesPerUnit?: Record<string, number>;
  isParentView?: boolean;
  variantCount?: number;
  syntheticId?: number;
  icecatId?: number | null;
  specificationsSource?: string | null;
  enrichmentStatus?:
    | "pending"
    | "processed"
    | "not_found"
    | "error"
    | "optimized"
    | "scavenged"
    | "untrusted_source"
    | null;
  category_id?: string | number;
  completenessScore?: number | null;
  missingSpecs?: string | null;
  lastEnrichedAt?: string | null;
  canonicalId?: number | null;
  [key: string]: unknown;
}

export type LitePrice = Pick<
  Price,
  | "id"
  | "productId"
  | "country"
  | "price"
  | "usedPrice"
  | "warehousePrice"
  | "listPrice"
  | "priceAvg90"
  | "pricePerUnit"
  | "currency"
  | "lastUpdated"
> & { historyJson?: Price["historyJson"] };
