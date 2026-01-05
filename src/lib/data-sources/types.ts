/**
 * Multi-Source Data Types
 *
 * Unified interfaces for product data from any source.
 * These types abstract away the differences between Amazon, eBay, Keepa, etc.
 */

import type { CategorySlug } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";
import type { Currency } from "@/types";

/**
 * Data source identifiers
 */
export type DataSourceId =
  | "amazon"
  | "amazon-paapi"
  | "keepa"
  | "ebay"
  | "newegg"
  | "bhphoto"
  | "walmart"
  | "static";

/**
 * Product condition across all sources
 */
export type ProductCondition = "new" | "renewed" | "used" | "refurbished";

/**
 * Availability status
 */
export type AvailabilityStatus =
  | "in_stock"
  | "out_of_stock"
  | "limited"
  | "preorder"
  | "unknown";

/**
 * A single price offer from any source
 */
export interface ProductOffer {
  /** Source of the offer */
  source: DataSourceId;

  /** Price amount */
  price: number;

  /** Original/list price if on sale */
  listPrice?: number;

  /** Currency code */
  currency: Currency;

  /** Formatted display amount (e.g., "$49.99") */
  displayPrice: string;

  /** Affiliate link with tracking */
  affiliateLink: string;

  /** Product condition */
  condition: ProductCondition;

  /** Availability */
  availability: AvailabilityStatus;

  /** Is this a Prime/free shipping offer? */
  freeShipping?: boolean;

  /** Seller name (for marketplace items) */
  seller?: string;

  /** When this price was last verified (optional for static data) */
  lastUpdated?: Date;

  /** Country/marketplace this offer is for */
  country: CountryCode;
}

/**
 * A point in price history (from Keepa or similar)
 */
export interface PriceHistoryPoint {
  /** Timestamp */
  date: Date;

  /** Price at this time */
  price: number;

  /** Currency */
  currency: Currency;

  /** Which condition (new, used, etc.) */
  condition: ProductCondition;

  /** Source of the historical data */
  source: DataSourceId;
}

/**
 * Price analytics for a product
 */
export interface PriceAnalysis {
  /** Current price */
  currentPrice: number;

  /** Average price over lookback period */
  averagePrice: number;

  /** Lowest price ever recorded */
  lowestPrice: number;

  /** Highest price ever recorded */
  highestPrice: number;

  /** Percent difference from average */
  percentFromAverage: number;

  /** Percent difference from lowest */
  percentFromLowest: number;

  /** Is this a good deal? */
  recommendation: "great_deal" | "good_price" | "fair" | "wait" | "unknown";

  /** Human-readable recommendation */
  recommendationText: string;

  /** Days of data analyzed */
  daysAnalyzed: number;
}

/**
 * Product specifications (category-specific)
 */
export interface ProductSpecifications {
  /** Brand name */
  brand?: string;

  /** Model number */
  model?: string;

  /** Capacity (for storage, RAM, PSUs) */
  capacity?: string;

  /** Capacity in numeric form for sorting */
  capacityValue?: number;

  /** Capacity unit (GB, TB, W) */
  capacityUnit?: string;

  /** Form factor (for SSDs, HDDs, RAM) */
  formFactor?: string;

  /** Technology (DDR4, DDR5, NVMe, SATA) */
  technology?: string;

  /** Speed/frequency */
  speed?: string;

  /** Wattage (for PSUs) */
  wattage?: number;

  /** Efficiency rating (for PSUs) */
  efficiencyRating?: string;

  /** Interface type */
  interface?: string;

  /** Read speed (for storage) */
  readSpeed?: string;

  /** Write speed (for storage) */
  writeSpeed?: string;

  /** Generic key-value for other specs */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Unified product representation across all sources
 */
export interface UnifiedProduct {
  /** Unique product ID (usually ASIN for Amazon products) */
  id: string;

  /** Product title */
  title: string;

  /** Clean/shortened title for display */
  shortTitle?: string;

  /** Category slug */
  category: CategorySlug;

  /** Product image URL */
  imageUrl?: string;

  /** Additional image URLs */
  additionalImages?: string[];

  /** Product specifications */
  specifications: ProductSpecifications;

  /** All available offers from different sources */
  offers: ProductOffer[];

  /** Best (lowest new price) offer */
  bestOffer?: ProductOffer;

  /** Price history (from Keepa) */
  priceHistory?: PriceHistoryPoint[];

  /** Price analysis (calculated from history) */
  priceAnalysis?: PriceAnalysis;

  /** Customer rating (0-5) */
  rating?: number;

  /** Number of reviews */
  reviewCount?: number;

  /** Key features/bullet points */
  features?: string[];

  /** Description */
  description?: string;

  /** When this product data was last updated */
  lastUpdated: Date;

  /** Primary data source */
  primarySource: DataSourceId;

  /** All sources that contributed data */
  sources: DataSourceId[];
}

/**
 * Interface for a data source provider
 */
export interface DataSourceProvider {
  /** Unique source ID */
  id: DataSourceId;

  /** Human-readable name */
  name: string;

  /** Is this source currently available/configured? */
  isAvailable(): boolean;

  /** Fetch products by category and country */
  fetchProducts(
    category: CategorySlug,
    country: CountryCode,
    options?: FetchOptions,
  ): Promise<UnifiedProduct[]>;

  /** Fetch a single product by ID */
  fetchProduct?(
    productId: string,
    country: CountryCode,
  ): Promise<UnifiedProduct | null>;

  /** Fetch price history for a product */
  fetchPriceHistory?(
    productId: string,
    country: CountryCode,
    days?: number,
  ): Promise<PriceHistoryPoint[]>;

  /** Search products by keyword */
  searchProducts?(
    query: string,
    country: CountryCode,
    options?: SearchOptions,
  ): Promise<UnifiedProduct[]>;
}

/**
 * Options for fetching products
 */
export interface FetchOptions {
  /** Maximum number of products to fetch */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Sort by field */
  sortBy?: "price" | "rating" | "relevance";

  /** Sort order */
  sortOrder?: "asc" | "desc";

  /** Filter by condition */
  condition?: ProductCondition[];

  /** Filter by minimum price */
  minPrice?: number;

  /** Filter by maximum price */
  maxPrice?: number;

  /** Force refresh (bypass cache) */
  forceRefresh?: boolean;
}

/**
 * Options for searching products
 */
export interface SearchOptions extends FetchOptions {
  /** Category to search within */
  category?: CategorySlug;

  /** Browse node ID (Amazon-specific) */
  browseNodeId?: string;
}

/**
 * Aggregated result from multiple sources
 */
export interface AggregatedResult {
  /** Combined products */
  products: UnifiedProduct[];

  /** Sources that contributed */
  sources: DataSourceId[];

  /** Sources that failed */
  failedSources: DataSourceId[];

  /** Timestamp of aggregation */
  timestamp: Date;

  /** Is any data stale? */
  hasStaleData: boolean;
}
