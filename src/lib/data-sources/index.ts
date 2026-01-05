/**
 * Data Aggregator - Unified Multi-Source Interface
 *
 * This is the main entry point for fetching product data.
 * It attempts multiple sources in priority order and combines results.
 *
 * Priority:
 * 1. Amazon PA API (live prices, if configured)
 * 2. Keepa (backup pricing + historical data)
 * 3. Static JSON (always-available fallback)
 *
 * Additional sources (for comparison):
 * - eBay (used/refurbished alternatives)
 */

import type { CategorySlug } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";

import { ebayDataSource, isEbayConfigured } from "./ebay";
import { isKeepaConfigured, keepaDataSource } from "./keepa";
import { staticDataSource } from "./static-data";
import type {
  AggregatedResult,
  DataSourceId,
  DataSourceProvider,
  FetchOptions,
  PriceHistoryPoint,
  UnifiedProduct,
} from "./types";

// Re-export types for convenience
export type {
  AggregatedResult,
  DataSourceId,
  FetchOptions,
  PriceAnalysis,
  PriceHistoryPoint,
  ProductOffer,
  UnifiedProduct,
} from "./types";

/**
 * Check if Amazon PA API is configured
 * This checks environment variables at runtime
 */
function isPaApiConfiguredSync(): boolean {
  return Boolean(
    process.env.PAAPI_ACCESS_KEY &&
    process.env.PAAPI_SECRET_KEY &&
    process.env.PAAPI_PARTNER_TAG,
  );
}

/**
 * Async version for consistent API
 */
async function isPaApiConfigured(): Promise<boolean> {
  return isPaApiConfiguredSync();
}

/**
 * Get Amazon PA API source if available
 * We import it lazily to avoid loading when not needed
 */
async function getAmazonPaApiSource(): Promise<DataSourceProvider | null> {
  if (!isPaApiConfiguredSync()) {
    return null;
  }

  try {
    // Dynamic import - the module exists, but may not be configured
    const { amazonPaApiSource, isPaApiConfigured: checkPaApi } = await import(
      /* webpackChunkName: "amazon-paapi" */ "./amazon-paapi"
    );
    if (checkPaApi()) {
      return amazonPaApiSource;
    }
  } catch (error) {
    // PA API module failed to load
    console.warn("Amazon PA API module not available:", error);
  }
  return null;
}

/**
 * Data Aggregator Class
 *
 * Manages multiple data sources and provides a unified interface
 */
class DataAggregator {
  private sources: DataSourceProvider[] = [];
  private initialized = false;

  /**
   * Initialize available data sources
   */
  private async init(): Promise<void> {
    if (this.initialized) return;

    // Always add static data source (fallback)
    this.sources.push(staticDataSource);

    // Add Keepa if configured
    if (isKeepaConfigured()) {
      this.sources.push(keepaDataSource);
    }

    // Add eBay if configured
    if (isEbayConfigured()) {
      this.sources.push(ebayDataSource);
    }

    // Try to add Amazon PA API
    const paApiSource = await getAmazonPaApiSource();
    if (paApiSource) {
      // PA API should be first priority
      this.sources.unshift(paApiSource);
    }

    this.initialized = true;
  }

  /**
   * Get all available (configured) sources
   */
  async getAvailableSources(): Promise<DataSourceId[]> {
    await this.init();
    return this.sources.filter((s) => s.isAvailable()).map((s) => s.id);
  }

  /**
   * Fetch products with fallback across sources
   *
   * This tries the primary source first, then falls back to others.
   * Returns combined results when multiple sources succeed.
   */
  async fetchProducts(
    category: CategorySlug,
    country: CountryCode,
    options?: FetchOptions,
  ): Promise<AggregatedResult> {
    await this.init();

    const result: AggregatedResult = {
      products: [],
      sources: [],
      failedSources: [],
      timestamp: new Date(),
      hasStaleData: false,
    };

    // Try each source in priority order
    for (const source of this.sources) {
      if (!source.isAvailable()) continue;

      try {
        const products = await source.fetchProducts(category, country, options);

        if (products.length > 0) {
          result.products = this.mergeProducts(result.products, products);
          result.sources.push(source.id);

          // Check for stale data
          for (const product of products) {
            const hoursSinceUpdate =
              (Date.now() - product.lastUpdated.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate > 24) {
              result.hasStaleData = true;
              break;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
        result.failedSources.push(source.id);
      }
    }

    // Sort combined results
    result.products = this.sortProducts(result.products, options);

    return result;
  }

  /**
   * Fetch a single product by ID
   */
  async fetchProduct(
    productId: string,
    country: CountryCode,
  ): Promise<UnifiedProduct | null> {
    await this.init();

    for (const source of this.sources) {
      if (!source.isAvailable() || !source.fetchProduct) continue;

      try {
        const product = await source.fetchProduct(productId, country);
        if (product) {
          return product;
        }
      } catch (error) {
        console.error(`Error fetching product from ${source.name}:`, error);
      }
    }

    return null;
  }

  /**
   * Fetch price history for a product
   */
  async fetchPriceHistory(
    productId: string,
    country: CountryCode,
    days: number = 90,
  ): Promise<PriceHistoryPoint[]> {
    await this.init();

    // Only Keepa provides price history
    if (isKeepaConfigured()) {
      try {
        return await keepaDataSource.fetchPriceHistory(
          productId,
          country,
          days,
        );
      } catch (error) {
        console.error("Error fetching price history from Keepa:", error);
      }
    }

    return [];
  }

  /**
   * Fetch alternative offers (e.g., eBay used listings)
   */
  async fetchAlternativeOffers(
    productQuery: string,
    country: CountryCode,
    options?: FetchOptions,
  ): Promise<UnifiedProduct[]> {
    await this.init();

    const alternatives: UnifiedProduct[] = [];

    // Check eBay for used/refurbished alternatives
    if (isEbayConfigured()) {
      try {
        const ebayProducts = await ebayDataSource.searchProducts(
          productQuery,
          country,
          {
            ...options,
            limit: 5,
          },
        );
        alternatives.push(...ebayProducts);
      } catch (error) {
        console.error("Error fetching eBay alternatives:", error);
      }
    }

    return alternatives;
  }

  /**
   * Merge products from multiple sources
   *
   * Products with the same ID are combined, with offers from all sources
   */
  private mergeProducts(
    existing: UnifiedProduct[],
    incoming: UnifiedProduct[],
  ): UnifiedProduct[] {
    const productMap = new Map<string, UnifiedProduct>();

    // Add existing products to map
    for (const product of existing) {
      productMap.set(product.id, product);
    }

    // Merge or add incoming products
    for (const product of incoming) {
      const existingProduct = productMap.get(product.id);

      if (existingProduct) {
        // Merge offers
        existingProduct.offers.push(...product.offers);

        // Update best offer if incoming is better
        if (
          product.bestOffer &&
          (!existingProduct.bestOffer ||
            product.bestOffer.price < existingProduct.bestOffer.price)
        ) {
          existingProduct.bestOffer = product.bestOffer;
        }

        // Merge sources
        for (const source of product.sources) {
          if (!existingProduct.sources.includes(source)) {
            existingProduct.sources.push(source);
          }
        }

        // Use newer data for other fields
        if (product.lastUpdated > existingProduct.lastUpdated) {
          existingProduct.title = product.title || existingProduct.title;
          existingProduct.imageUrl =
            product.imageUrl || existingProduct.imageUrl;
          existingProduct.rating = product.rating ?? existingProduct.rating;
          existingProduct.reviewCount =
            product.reviewCount ?? existingProduct.reviewCount;
          existingProduct.priceHistory =
            product.priceHistory || existingProduct.priceHistory;
          existingProduct.priceAnalysis =
            product.priceAnalysis || existingProduct.priceAnalysis;
          existingProduct.lastUpdated = product.lastUpdated;
        }
      } else {
        productMap.set(product.id, product);
      }
    }

    return Array.from(productMap.values());
  }

  /**
   * Sort products based on options
   */
  private sortProducts(
    products: UnifiedProduct[],
    options?: FetchOptions,
  ): UnifiedProduct[] {
    if (!options?.sortBy) return products;

    const multiplier = options.sortOrder === "desc" ? -1 : 1;

    return [...products].sort((a, b) => {
      switch (options.sortBy) {
        case "price":
          const priceA = a.bestOffer?.price ?? Infinity;
          const priceB = b.bestOffer?.price ?? Infinity;
          return (priceA - priceB) * multiplier;

        case "rating":
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          return (ratingA - ratingB) * multiplier;

        default:
          return 0;
      }
    });
  }
}

/**
 * Singleton instance
 */
export const dataAggregator = new DataAggregator();

/**
 * Convenience exports for checking source availability
 */
export { isEbayConfigured } from "./ebay";
export { isKeepaConfigured } from "./keepa";
export { isPaApiConfigured };
