/**
 * Static Data Source
 *
 * Fallback data source that reads from local JSON files.
 * This is always available and serves as the safety net when other APIs fail.
 */

import type { CategorySlug } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";
import type { Currency, Product } from "@/types";

import type {
  AvailabilityStatus,
  DataSourceProvider,
  FetchOptions,
  ProductOffer,
  UnifiedProduct,
} from "./types";

/**
 * Map country codes to currencies
 */
const COUNTRY_CURRENCIES: Record<CountryCode, Currency> = {
  us: "USD",
  uk: "GBP",
  ca: "CAD",
  de: "EUR",
  fr: "EUR",
  es: "EUR",
  it: "EUR",
};

/**
 * Static Data Source Provider
 *
 * Reads product data from local JSON files in /src/lib/data/
 */
class StaticDataSource implements DataSourceProvider {
  id = "static" as const;
  name = "Static JSON Data";

  isAvailable(): boolean {
    // Static data is always available
    return true;
  }

  async fetchProducts(
    category: CategorySlug,
    country: CountryCode,
    options?: FetchOptions,
  ): Promise<UnifiedProduct[]> {
    try {
      // Dynamic import of JSON data
      // Files are expected at: src/lib/data/[country]/[category].json
      const data = await this.loadCategoryData(category, country);

      if (!Array.isArray(data)) {
        console.warn(`No data found for ${category}/${country}`);
        return [];
      }

      let products = data.map((product: Product) =>
        this.transformToUnified(product, category, country),
      );

      // Apply options
      if (options?.limit) {
        products = products.slice(options.offset || 0, options.limit);
      }

      return products;
    } catch (error) {
      console.error(
        `Failed to load static data for ${category}/${country}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Load category data from JSON files
   */
  private async loadCategoryData(
    category: CategorySlug,
    country: CountryCode,
  ): Promise<Product[]> {
    try {
      // Try country-specific data first
      const countryPath = `@/lib/data/${country}/${category}.json`;
      const module = await import(/* webpackIgnore: true */ countryPath);
      return module.default || module;
    } catch {
      try {
        // Fall back to US data
        const fallbackPath = `@/lib/data/us/${category}.json`;
        const module = await import(/* webpackIgnore: true */ fallbackPath);
        return module.default || module;
      } catch {
        return [];
      }
    }
  }

  /**
   * Transform legacy Product type to UnifiedProduct
   */
  private transformToUnified(
    product: Product,
    category: CategorySlug,
    country: CountryCode,
  ): UnifiedProduct {
    const currency = COUNTRY_CURRENCIES[country];

    // Create offer from product data
    const offer: ProductOffer = {
      source: "static",
      price: product.price.amount,
      currency: product.price.currency,
      displayPrice: product.price.displayAmount,
      affiliateLink: product.url,
      condition: "new",
      availability: "in_stock" as AvailabilityStatus,
      freeShipping: true,
      shippingCost: 0,
      deliveryTime: "2-4 Werktage",
      seller: "Amazon",
      merchantRating: 4.5,
      merchantReviewCount: 1000,
      paymentMethods: ["Visa", "PayPal", "Bankeinzug"],
      lastUpdated: new Date(),
      country,
    };

    // Parse capacity from the capacity string
    const capacityMatch = product.capacity?.match(/^([\d.]+)\s*(\w+)$/);
    const capacityValue = capacityMatch
      ? parseFloat(capacityMatch[1])
      : undefined;
    const capacityUnit = capacityMatch ? capacityMatch[2] : undefined;

    return {
      id: product.asin,
      title: product.title,
      category,
      imageUrl: product.image,
      specifications: {
        capacity: product.capacity,
        capacityValue,
        capacityUnit,
      },
      offers: [offer],
      bestOffer: offer,
      rating: product.rating,
      reviewCount: product.reviewCount,
      lastUpdated: new Date(),
      primarySource: "static",
      sources: ["static"],
    };
  }
}

/**
 * Singleton instance
 */
export const staticDataSource = new StaticDataSource();
