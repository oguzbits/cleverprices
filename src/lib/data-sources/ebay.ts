/**
 * eBay API Client (Browse API / Finding API)
 *
 * eBay provides:
 * - Live product listings (new, used, refurbished)
 * - Auction and Buy It Now prices
 * - Good alternative for price-conscious users
 *
 * Documentation:
 * - Browse API: https://developer.ebay.com/api-docs/buy/browse/overview.html
 * - Finding API: https://developer.ebay.com/Devzone/finding/Concepts/FindingAPIGuide.html
 *
 * SETUP:
 * 1. Join eBay Partner Network: https://partnernetwork.ebay.com/
 * 2. Create app at: https://developer.ebay.com/my/keys
 * 3. Get OAuth token for Browse API or App ID for Finding API
 * 4. Add credentials to .env.local
 */

import type { CategorySlug } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";
import type { Currency } from "@/types";

import type {
  DataSourceProvider,
  FetchOptions,
  ProductCondition,
  ProductOffer,
  SearchOptions,
  UnifiedProduct,
} from "./types";

// Environment variables
const EBAY_APP_ID = process.env.EBAY_APP_ID || "";
const EBAY_CAMPAIGN_ID = process.env.EBAY_CAMPAIGN_ID || ""; // EPN campaign

// eBay global IDs (site codes)
const EBAY_GLOBAL_IDS: Record<CountryCode, string> = {
  us: "EBAY-US",
  uk: "EBAY-GB",
  de: "EBAY-DE",
  fr: "EBAY-FR",
  es: "EBAY-ES",
  it: "EBAY-IT",
  ca: "EBAY-ENCA",
};

// Currency mapping
const EBAY_CURRENCIES: Record<CountryCode, Currency> = {
  us: "USD",
  uk: "GBP",
  de: "EUR",
  fr: "EUR",
  es: "EUR",
  it: "EUR",
  ca: "CAD",
};

// eBay category IDs for our product types
// See: https://www.isoldwhat.com/getcats/
// Using string keys for flexibility - maps to our CategorySlug or aliases
const EBAY_CATEGORY_IDS: Record<string, string> = {
  // Main categories matching CategorySlug
  "hard-drives": "56083", // Hard Drives (Internal) + SSDs
  ram: "170083", // Computer Memory (RAM)
  "power-supplies": "42017", // Power Supplies
  electronics: "175673", // Computer Components (parent)
  // Aliases for more specific searches
  ssd: "175669", // Solid State Drives
  hdd: "56083", // Hard Drives (Internal)
  gpu: "27386", // Graphics Cards
  cpu: "164", // CPUs/Processors
  psu: "42017", // Power Supplies (alias)
};

/**
 * eBay Finding API response types
 */
interface EbayFindingItem {
  itemId: string[];
  title: string[];
  globalId: string[];
  primaryCategory: { categoryId: string[]; categoryName: string[] }[];
  galleryURL?: string[];
  viewItemURL: string[];
  productId?: { "@type": string; __value__: string }[];
  paymentMethod?: string[];
  autoPay?: string[];
  location?: string[];
  country?: string[];
  shippingInfo?: {
    shippingServiceCost?: { "@currencyId": string; __value__: string }[];
    shippingType?: string[];
    shipToLocations?: string[];
    expeditedShipping?: string[];
    oneDayShippingAvailable?: string[];
    handlingTime?: string[];
  }[];
  sellingStatus: {
    currentPrice: { "@currencyId": string; __value__: string }[];
    convertedCurrentPrice?: { "@currencyId": string; __value__: string }[];
    sellingState?: string[];
  }[];
  listingInfo?: {
    bestOfferEnabled?: string[];
    buyItNowAvailable?: string[];
    startTime?: string[];
    endTime?: string[];
    listingType?: string[];
  }[];
  condition?: { conditionId: string[]; conditionDisplayName: string[] }[];
  topRatedListing?: string[];
}

interface EbayFindingResponse {
  findItemsByCategoryResponse?: {
    ack: string[];
    version: string[];
    timestamp: string[];
    searchResult: { "@count": string; item?: EbayFindingItem[] }[];
    paginationOutput?: {
      pageNumber: string[];
      entriesPerPage: string[];
      totalPages: string[];
      totalEntries: string[];
    }[];
  }[];
  findItemsByKeywordsResponse?: {
    ack: string[];
    searchResult: { "@count": string; item?: EbayFindingItem[] }[];
  }[];
}

/**
 * Map eBay condition IDs to our standard conditions
 */
function mapEbayCondition(conditionId?: string): ProductCondition {
  switch (conditionId) {
    case "1000": // New
    case "1500": // New other
      return "new";
    case "2000": // Certified Refurbished
    case "2010": // Excellent - Refurbished
    case "2020": // Very Good - Refurbished
    case "2030": // Good - Refurbished
    case "2500": // Seller refurbished
      return "refurbished";
    case "3000": // Used
    case "4000": // Very Good
    case "5000": // Good
    case "6000": // Acceptable
      return "used";
    default:
      return "used";
  }
}

/**
 * eBay Data Source Provider
 *
 * Uses the Finding API (simpler, works with App ID)
 */
export class EbayDataSource implements DataSourceProvider {
  id = "ebay" as const;
  name = "eBay";

  private baseUrl = "https://svcs.ebay.com/services/search/FindingService/v1";

  isAvailable(): boolean {
    return Boolean(EBAY_APP_ID);
  }

  /**
   * Fetch products by category
   */
  async fetchProducts(
    category: CategorySlug,
    country: CountryCode,
    options?: FetchOptions,
  ): Promise<UnifiedProduct[]> {
    if (!this.isAvailable()) {
      throw new Error("eBay API not configured");
    }

    const categoryId = EBAY_CATEGORY_IDS[category];
    if (!categoryId) {
      console.warn(`eBay: Category ${category} not mapped`);
      return [];
    }

    const globalId = EBAY_GLOBAL_IDS[country];
    if (!globalId) {
      throw new Error(`eBay: Country ${country} not supported`);
    }

    const params = new URLSearchParams({
      "OPERATION-NAME": "findItemsByCategory",
      "SERVICE-VERSION": "1.0.0",
      "SECURITY-APPNAME": EBAY_APP_ID,
      "RESPONSE-DATA-FORMAT": "JSON",
      "GLOBAL-ID": globalId,
      categoryId: categoryId,
      "paginationInput.entriesPerPage": (options?.limit || 20).toString(),
      sortOrder: this.mapSortOrder(options?.sortBy, options?.sortOrder),
      // Only show Buy It Now listings for consistent pricing
      "itemFilter(0).name": "ListingType",
      "itemFilter(0).value": "FixedPrice",
    });

    // Add condition filters if specified
    if (options?.condition?.length) {
      params.append("itemFilter(1).name", "Condition");
      options.condition.forEach((c, i) => {
        const ebayCondition = this.reverseMapCondition(c);
        params.append(`itemFilter(1).value(${i})`, ebayCondition);
      });
    }

    const response = await fetch(`${this.baseUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    const data: EbayFindingResponse = await response.json();
    const result = data.findItemsByCategoryResponse?.[0];

    if (result?.ack[0] !== "Success") {
      console.error("eBay API error:", result);
      return [];
    }

    const items = result.searchResult[0].item || [];
    return items.map((item) => this.transformItem(item, category, country));
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
      throw new Error("eBay API not configured");
    }

    const globalId = EBAY_GLOBAL_IDS[country];
    if (!globalId) {
      throw new Error(`eBay: Country ${country} not supported`);
    }

    const params = new URLSearchParams({
      "OPERATION-NAME": "findItemsByKeywords",
      "SERVICE-VERSION": "1.0.0",
      "SECURITY-APPNAME": EBAY_APP_ID,
      "RESPONSE-DATA-FORMAT": "JSON",
      "GLOBAL-ID": globalId,
      keywords: query,
      "paginationInput.entriesPerPage": (options?.limit || 20).toString(),
      sortOrder: this.mapSortOrder(options?.sortBy, options?.sortOrder),
      // Only Buy It Now
      "itemFilter(0).name": "ListingType",
      "itemFilter(0).value": "FixedPrice",
    });

    // Add category filter if specified
    if (options?.category) {
      const categoryId = EBAY_CATEGORY_IDS[options.category];
      if (categoryId) {
        params.append("categoryId", categoryId);
      }
    }

    const response = await fetch(`${this.baseUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    const data: EbayFindingResponse = await response.json();
    const result = data.findItemsByKeywordsResponse?.[0];

    if (result?.ack[0] !== "Success") {
      console.error("eBay API error:", result);
      return [];
    }

    const items = result.searchResult[0].item || [];
    return items.map((item) =>
      this.transformItem(item, options?.category || "hard-drives", country),
    );
  }

  /**
   * Transform eBay item to UnifiedProduct
   */
  private transformItem(
    item: EbayFindingItem,
    category: CategorySlug,
    country: CountryCode,
  ): UnifiedProduct {
    const currency = EBAY_CURRENCIES[country];
    const price = parseFloat(item.sellingStatus[0].currentPrice[0].__value__);
    const condition = mapEbayCondition(item.condition?.[0]?.conditionId[0]);
    const conditionName =
      item.condition?.[0]?.conditionDisplayName[0] || "Used";

    // Build affiliate link with EPN tracking
    let affiliateLink = item.viewItemURL[0];
    if (EBAY_CAMPAIGN_ID) {
      affiliateLink = `https://rover.ebay.com/rover/1/${EBAY_CAMPAIGN_ID}/1?mpre=${encodeURIComponent(item.viewItemURL[0])}`;
    }

    // Check for free shipping
    const shippingCost =
      item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__;
    const freeShipping = shippingCost === "0.0" || shippingCost === "0.00";

    const offer: ProductOffer = {
      source: "ebay",
      price,
      currency,
      displayPrice: this.formatPrice(price, currency),
      affiliateLink,
      condition,
      availability: "in_stock",
      freeShipping,
      lastUpdated: new Date(),
      country,
    };

    return {
      id: item.itemId[0],
      title: item.title[0],
      category,
      imageUrl: item.galleryURL?.[0],
      specifications: {},
      offers: [offer],
      bestOffer: offer,
      lastUpdated: new Date(),
      primarySource: "ebay",
      sources: ["ebay"],
    };
  }

  /**
   * Map our sort options to eBay sort orders
   */
  private mapSortOrder(
    sortBy?: "price" | "rating" | "relevance",
    order?: "asc" | "desc",
  ): string {
    switch (sortBy) {
      case "price":
        return order === "desc"
          ? "PricePlusShippingHighest"
          : "PricePlusShippingLowest";
      case "rating":
        return "BestMatch"; // eBay doesn't have direct rating sort
      default:
        return "BestMatch";
    }
  }

  /**
   * Reverse map our condition to eBay condition values
   */
  private reverseMapCondition(condition: ProductCondition): string {
    switch (condition) {
      case "new":
        return "New";
      case "refurbished":
        return "Seller refurbished";
      case "renewed":
        return "Certified refurbished";
      case "used":
        return "Used";
      default:
        return "Used";
    }
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
export const ebayDataSource = new EbayDataSource();

/**
 * Check if eBay is configured
 */
export function isEbayConfigured(): boolean {
  return Boolean(EBAY_APP_ID);
}
