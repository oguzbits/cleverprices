/**
 * Keepa API Client
 *
 * Keepa provides:
 * - Historical price data (Amazon new, used, warehouse, etc.)
 * - Price drop alerts
 * - Sales rank history
 * - Product data (can be used as primary source!)
 *
 * Documentation: https://keepa.com/#!discuss/t/using-the-keepa-api/47
 *
 * Pricing: ~$19-49/month depending on token usage
 * - 1 token = 1 product query
 * - Historical data included
 *
 * SETUP:
 * 1. Sign up at https://keepa.com/
 * 2. Get API key from settings
 * 3. Add KEEPA_API_KEY to .env.local
 */

import type { CategorySlug } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";
import type { Currency } from "@/types";

import type {
  DataSourceProvider,
  FetchOptions,
  PriceAnalysis,
  PriceHistoryPoint,
  ProductCondition,
  SearchOptions,
  UnifiedProduct,
} from "./types";

// Environment variable
const KEEPA_API_KEY = process.env.KEEPA_API_KEY || "";

// Keepa domain codes (different from our country codes)
const KEEPA_DOMAINS: Record<CountryCode, number> = {
  us: 1, // .com
  uk: 2, // .co.uk
  de: 3, // .de
  fr: 4, // .fr
  // jp: 5,  // .co.jp
  ca: 6, // .ca
  // cn: 7,  // not currently available
  it: 8, // .it
  es: 9, // .es
  // in: 10, // .in
  // mx: 11, // .com.mx
};

// Currency mapping
const DOMAIN_CURRENCIES: Record<number, Currency> = {
  1: "USD",
  2: "GBP",
  3: "EUR",
  4: "EUR",
  6: "CAD",
  8: "EUR",
  9: "EUR",
};

/**
 * Keepa price types (indices in the csv array)
 * See: https://keepa.com/#!discuss/t/using-the-keepa-api/47
 */
const KEEPA_PRICE_TYPES = {
  AMAZON: 0, // Amazon price
  NEW: 1, // Marketplace new
  USED: 2, // Marketplace used
  SALES_RANK: 3, // Sales rank (not a price)
  LIST_PRICE: 4, // List/MSRP price
  COLLECTIBLE: 5, // Collectible
  REFURBISHED: 6, // Refurbished
  NEW_FBM: 7, // New FBM (Fulfilled by Merchant)
  LIGHTNING_DEAL: 8, // Lightning deal price
  WAREHOUSE: 9, // Amazon Warehouse deals
  NEW_FBA: 10, // New FBA (Fulfilled by Amazon)
  COUNT_NEW: 11, // Count of new offers
  COUNT_USED: 12, // Count of used offers
  COUNT_REFURB: 13, // Count of refurbished offers
  RATING: 16, // Product rating
  REVIEW_COUNT: 17, // Review count
} as const;

/**
 * Keepa API response types
 */
interface KeepaProduct {
  asin: string;
  title?: string;
  brand?: string;
  productType?: number;
  imagesCSV?: string;
  features?: string[];
  description?: string;
  csv?: (number | null)[][]; // Price history arrays
  stats?: {
    current?: number[];
    avg?: number[];
    avg30?: number[];
    avg90?: number[];
    min?: number[];
    max?: number[];
  };
  categories?: number[];
  rootCategory?: number;
  lastUpdate?: number;
}

interface KeepaResponse {
  timestamp?: number;
  tokensConsumed?: number;
  tokensLeft?: number;
  products?: KeepaProduct[];
  error?: {
    type: string;
    message: string;
  };
}

/**
 * Convert Keepa price (in cents/hundredths) to decimal
 * Returns null for null, undefined, or negative prices
 */
function keepaPriceToDecimal(price: number | null | undefined): number | null {
  if (price === null || price === undefined || price < 0) return null;
  return price / 100;
}

/**
 * Convert Keepa timestamp to JavaScript Date
 * Keepa uses minutes since 2011-01-01
 */
function keepaTimeToDate(keepaTime: number): Date {
  const KEEPA_EPOCH = new Date("2011-01-01T00:00:00Z").getTime();
  return new Date(KEEPA_EPOCH + keepaTime * 60 * 1000);
}

/**
 * Keepa Data Source Provider
 */
export class KeepaDataSource implements DataSourceProvider {
  id = "keepa" as const;
  name = "Keepa Price History";

  private baseUrl = "https://api.keepa.com";

  isAvailable(): boolean {
    return Boolean(KEEPA_API_KEY);
  }

  /**
   * Fetch products by ASINs
   */
  async fetchProducts(
    category: CategorySlug,
    country: CountryCode,
    options?: FetchOptions,
  ): Promise<UnifiedProduct[]> {
    // Keepa doesn't support category-based fetching directly
    // You'd need to have ASINs already or use search
    console.warn(
      "Keepa: fetchProducts requires ASINs. Use fetchProductsByAsins instead.",
    );
    return [];
  }

  /**
   * Fetch products by ASINs (the main way to use Keepa)
   */
  async fetchProductsByAsins(
    asins: string[],
    country: CountryCode,
    options?: { includeHistory?: boolean },
  ): Promise<UnifiedProduct[]> {
    if (!this.isAvailable()) {
      throw new Error("Keepa API key not configured");
    }

    const domain = KEEPA_DOMAINS[country];
    if (!domain) {
      throw new Error(`Keepa: Country ${country} not supported`);
    }

    // Keepa allows up to 100 ASINs per request
    const batchedAsins = asins.slice(0, 100);

    const params = new URLSearchParams({
      key: KEEPA_API_KEY,
      domain: domain.toString(),
      asin: batchedAsins.join(","),
      stats: "1", // Include statistics
      history: options?.includeHistory ? "1" : "0",
      offers: "0", // We don't need third-party offers for now
    });

    const response = await fetch(`${this.baseUrl}/product?${params}`);

    if (!response.ok) {
      throw new Error(`Keepa API error: ${response.status}`);
    }

    const data: KeepaResponse = await response.json();

    if (data.error) {
      throw new Error(`Keepa error: ${data.error.message}`);
    }

    if (!data.products) {
      return [];
    }

    return data.products.map((product) =>
      this.transformProduct(product, country),
    );
  }

  /**
   * Fetch a single product by ASIN
   */
  async fetchProduct(
    productId: string,
    country: CountryCode,
  ): Promise<UnifiedProduct | null> {
    const products = await this.fetchProductsByAsins([productId], country, {
      includeHistory: true,
    });
    return products[0] || null;
  }

  /**
   * Fetch price history for a product
   */
  async fetchPriceHistory(
    productId: string,
    country: CountryCode,
    days: number = 90,
  ): Promise<PriceHistoryPoint[]> {
    if (!this.isAvailable()) {
      throw new Error("Keepa API key not configured");
    }

    const domain = KEEPA_DOMAINS[country];
    if (!domain) {
      throw new Error(`Keepa: Country ${country} not supported`);
    }

    const params = new URLSearchParams({
      key: KEEPA_API_KEY,
      domain: domain.toString(),
      asin: productId,
      history: "1",
      stats: "0",
      days: days.toString(),
    });

    const response = await fetch(`${this.baseUrl}/product?${params}`);

    if (!response.ok) {
      throw new Error(`Keepa API error: ${response.status}`);
    }

    const data: KeepaResponse = await response.json();

    if (data.error || !data.products?.[0]) {
      return [];
    }

    return this.extractPriceHistory(data.products[0], country);
  }

  /**
   * Search products by keyword
   */
  async searchProducts(
    query: string,
    country: CountryCode,
    options?: SearchOptions,
  ): Promise<UnifiedProduct[]> {
    if (!this.isAvailable()) {
      throw new Error("Keepa API key not configured");
    }

    const domain = KEEPA_DOMAINS[country];
    if (!domain) {
      throw new Error(`Keepa: Country ${country} not supported`);
    }

    const params = new URLSearchParams({
      key: KEEPA_API_KEY,
      domain: domain.toString(),
      type: "product",
      term: query,
      stats: "1",
      history: "0",
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`);

    if (!response.ok) {
      throw new Error(`Keepa API error: ${response.status}`);
    }

    const data: KeepaResponse = await response.json();

    if (data.error || !data.products) {
      return [];
    }

    let products = data.products.map((p) => this.transformProduct(p, country));

    if (options?.limit) {
      products = products.slice(0, options.limit);
    }

    return products;
  }

  /**
   * Transform Keepa product to UnifiedProduct
   */
  private transformProduct(
    product: KeepaProduct,
    country: CountryCode,
  ): UnifiedProduct {
    const currency = DOMAIN_CURRENCIES[KEEPA_DOMAINS[country]];

    // Get current prices from stats
    const currentPrices = product.stats?.current || [];
    const amazonPrice = keepaPriceToDecimal(
      currentPrices[KEEPA_PRICE_TYPES.AMAZON],
    );
    const newPrice = keepaPriceToDecimal(currentPrices[KEEPA_PRICE_TYPES.NEW]);
    const usedPrice = keepaPriceToDecimal(
      currentPrices[KEEPA_PRICE_TYPES.USED],
    );
    const warehousePrice = keepaPriceToDecimal(
      currentPrices[KEEPA_PRICE_TYPES.WAREHOUSE],
    );

    // Best new price (Amazon or marketplace)
    const bestNewPrice = amazonPrice ?? newPrice;

    // Build offers array
    const offers = [];

    if (amazonPrice !== null) {
      offers.push({
        source: "keepa" as const,
        price: amazonPrice,
        currency,
        displayPrice: this.formatPrice(amazonPrice, currency),
        affiliateLink: `https://www.amazon.com/dp/${product.asin}?tag=${process.env.PAAPI_PARTNER_TAG || ""}`,
        condition: "new" as ProductCondition,
        availability: "unknown" as const,
        seller: "Amazon",
        lastUpdated: new Date(),
        country,
      });
    }

    if (usedPrice !== null) {
      offers.push({
        source: "keepa" as const,
        price: usedPrice,
        currency,
        displayPrice: this.formatPrice(usedPrice, currency),
        affiliateLink: `https://www.amazon.com/dp/${product.asin}?tag=${process.env.PAAPI_PARTNER_TAG || ""}`,
        condition: "used" as ProductCondition,
        availability: "unknown" as const,
        lastUpdated: new Date(),
        country,
      });
    }

    if (warehousePrice !== null) {
      offers.push({
        source: "keepa" as const,
        price: warehousePrice,
        currency,
        displayPrice: this.formatPrice(warehousePrice, currency),
        affiliateLink: `https://www.amazon.com/dp/${product.asin}?tag=${process.env.PAAPI_PARTNER_TAG || ""}`,
        condition: "renewed" as ProductCondition,
        availability: "unknown" as const,
        seller: "Amazon Warehouse",
        lastUpdated: new Date(),
        country,
      });
    }

    // Calculate price analysis if we have stats
    let priceAnalysis: PriceAnalysis | undefined;
    if (product.stats && bestNewPrice !== null) {
      priceAnalysis = this.calculatePriceAnalysis(product.stats, bestNewPrice);
    }

    // Get image URL
    let imageUrl: string | undefined;
    if (product.imagesCSV) {
      const firstImage = product.imagesCSV.split(",")[0];
      if (firstImage) {
        imageUrl = `https://images-na.ssl-images-amazon.com/images/I/${firstImage}`;
      }
    }

    return {
      id: product.asin,
      title: product.title || product.asin,
      category: "hard-drives", // Default category - would need to map from Keepa categories
      imageUrl,
      specifications: {
        brand: product.brand,
      },
      offers,
      bestOffer: offers.find((o) => o.condition === "new"),
      priceAnalysis,
      rating:
        keepaPriceToDecimal(
          product.stats?.current?.[KEEPA_PRICE_TYPES.RATING],
        ) ?? undefined,
      reviewCount:
        product.stats?.current?.[KEEPA_PRICE_TYPES.REVIEW_COUNT] ?? undefined,
      features: product.features,
      description: product.description,
      lastUpdated: product.lastUpdate
        ? keepaTimeToDate(product.lastUpdate)
        : new Date(),
      primarySource: "keepa",
      sources: ["keepa"],
    };
  }

  /**
   * Extract price history from Keepa csv data
   */
  private extractPriceHistory(
    product: KeepaProduct,
    country: CountryCode,
  ): PriceHistoryPoint[] {
    const currency = DOMAIN_CURRENCIES[KEEPA_DOMAINS[country]];
    const history: PriceHistoryPoint[] = [];

    // Amazon prices (type 0)
    const amazonCsv = product.csv?.[KEEPA_PRICE_TYPES.AMAZON];
    if (amazonCsv) {
      for (let i = 0; i < amazonCsv.length; i += 2) {
        const time = amazonCsv[i];
        const price = amazonCsv[i + 1];
        if (time !== null && price !== null && price >= 0) {
          history.push({
            date: keepaTimeToDate(time),
            price: price / 100,
            currency,
            condition: "new",
            source: "keepa",
          });
        }
      }
    }

    // Sort by date
    history.sort((a, b) => a.date.getTime() - b.date.getTime());

    return history;
  }

  /**
   * Calculate price analysis from Keepa stats
   */
  private calculatePriceAnalysis(
    stats: NonNullable<KeepaProduct["stats"]>,
    currentPrice: number,
  ): PriceAnalysis {
    const avg90 =
      keepaPriceToDecimal(stats.avg90?.[KEEPA_PRICE_TYPES.AMAZON]) ||
      currentPrice;
    const minPrice =
      keepaPriceToDecimal(stats.min?.[KEEPA_PRICE_TYPES.AMAZON]) ||
      currentPrice;
    const maxPrice =
      keepaPriceToDecimal(stats.max?.[KEEPA_PRICE_TYPES.AMAZON]) ||
      currentPrice;

    const percentFromAverage = ((currentPrice - avg90) / avg90) * 100;
    const percentFromLowest = ((currentPrice - minPrice) / minPrice) * 100;

    // Determine recommendation
    let recommendation: PriceAnalysis["recommendation"];
    let recommendationText: string;

    if (percentFromAverage <= -15) {
      recommendation = "great_deal";
      recommendationText = `Great deal! ${Math.abs(Math.round(percentFromAverage))}% below 90-day average`;
    } else if (percentFromAverage <= -5) {
      recommendation = "good_price";
      recommendationText = `Good price! ${Math.abs(Math.round(percentFromAverage))}% below average`;
    } else if (percentFromAverage <= 5) {
      recommendation = "fair";
      recommendationText = "Fair price, near 90-day average";
    } else {
      recommendation = "wait";
      recommendationText = `Consider waiting, ${Math.round(percentFromAverage)}% above average`;
    }

    return {
      currentPrice,
      averagePrice: avg90,
      lowestPrice: minPrice,
      highestPrice: maxPrice,
      percentFromAverage,
      percentFromLowest,
      recommendation,
      recommendationText,
      daysAnalyzed: 90,
    };
  }

  /**
   * Format price for display
   */
  private formatPrice(amount: number, currency: Currency): string {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    });
    return formatter.format(amount);
  }
}

/**
 * Singleton instance
 */
export const keepaDataSource = new KeepaDataSource();

/**
 * Check if Keepa is configured
 */
export function isKeepaConfigured(): boolean {
  return Boolean(KEEPA_API_KEY);
}
