/**
 * Amazon Product Advertising API v5 Client
 *
 * This is an adapted version of the PA API client that implements
 * the DataSourceProvider interface for the unified data layer.
 *
 * Documentation: https://webservices.amazon.com/paapi5/documentation/
 *
 * SETUP:
 * 1. Get approved for Amazon Associates (need 3 qualifying sales in 180 days)
 * 2. Apply for PA API access in Associates Central
 * 3. Get your Access Key, Secret Key, and Partner Tag
 * 4. Add credentials to .env.local:
 *    PAAPI_ACCESS_KEY=your_access_key
 *    PAAPI_SECRET_KEY=your_secret_key
 *    PAAPI_PARTNER_TAG=yoursite-20
 */

import crypto from "crypto";

import type { CategorySlug } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";
import type { Currency } from "@/types";

import type {
  AvailabilityStatus,
  DataSourceProvider,
  FetchOptions,
  ProductCondition,
  ProductOffer,
  SearchOptions,
  UnifiedProduct,
} from "./types";

// Environment variables
const ACCESS_KEY = process.env.PAAPI_ACCESS_KEY || "";
const SECRET_KEY = process.env.PAAPI_SECRET_KEY || "";
const PARTNER_TAG = process.env.PAAPI_PARTNER_TAG || "";

// API endpoints by marketplace
const ENDPOINTS: Record<string, { host: string; region: string }> = {
  us: { host: "webservices.amazon.com", region: "us-east-1" },
  uk: { host: "webservices.amazon.co.uk", region: "eu-west-1" },
  de: { host: "webservices.amazon.de", region: "eu-west-1" },
  fr: { host: "webservices.amazon.fr", region: "eu-west-1" },
  es: { host: "webservices.amazon.es", region: "eu-west-1" },
  it: { host: "webservices.amazon.it", region: "eu-west-1" },
  ca: { host: "webservices.amazon.ca", region: "us-east-1" },
};

// Partner tags per marketplace
const PARTNER_TAGS: Record<string, string> = {
  us: process.env.PAAPI_PARTNER_TAG_US || PARTNER_TAG,
  uk: process.env.PAAPI_PARTNER_TAG_UK || "",
  de: process.env.PAAPI_PARTNER_TAG_DE || "",
  fr: process.env.PAAPI_PARTNER_TAG_FR || "",
  es: process.env.PAAPI_PARTNER_TAG_ES || "",
  it: process.env.PAAPI_PARTNER_TAG_IT || "",
  ca: process.env.PAAPI_PARTNER_TAG_CA || "",
};

// Browse Node IDs for our categories
// See: https://webservices.amazon.com/paapi5/documentation/locale-reference.html
// Using string keys for flexibility - maps to CategorySlug or aliases
const BROWSE_NODE_IDS: Record<string, Record<string, string>> = {
  // Main categories matching CategorySlug
  "hard-drives": {
    us: "1254762011", // Data Storage (covers HDDs and SSDs)
    uk: "430498031",
    de: "430500031",
    ca: "3312068011",
  },
  ram: {
    us: "172500",
    uk: "430467031",
    de: "430469031",
    ca: "677252011",
  },
  "power-supplies": {
    us: "1161760",
    uk: "430511031",
    de: "430513031",
    ca: "677249011",
  },
  electronics: {
    us: "541966", // Computer Components
    uk: "340831031",
    de: "571284",
    ca: "677241011",
  },
  // Aliases for more specific searches (future expansion)
  ssd: {
    us: "1292116011",
    uk: "430514031",
    de: "430516031",
    ca: "3312069011",
  },
  hdd: {
    us: "1254762011",
    uk: "430498031",
    de: "430500031",
    ca: "3312068011",
  },
};

// Currency mapping
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
 * Raw PA API response types
 */
interface PaApiRawItem {
  ASIN: string;
  DetailPageURL?: string;
  ItemInfo?: {
    Title?: { DisplayValue: string };
    Features?: { DisplayValues: string[] };
    ByLineInfo?: { Brand?: { DisplayValue: string } };
  };
  Images?: {
    Primary?: { Large?: { URL: string } };
  };
  Offers?: {
    Listings?: Array<{
      Price?: {
        Amount: number;
        Currency: string;
        DisplayAmount: string;
      };
      SavingBasis?: {
        Amount: number;
        Currency: string;
        DisplayAmount: string;
      };
      Availability?: {
        Type?: string;
      };
      Condition?: {
        Value?: string;
      };
      IsPrimeEligible?: boolean;
    }>;
  };
  CustomerReviews?: {
    Count?: number;
    StarRating?: { Value: number };
  };
}

interface PaApiRawResponse {
  ItemsResult?: { Items?: PaApiRawItem[] };
  SearchResult?: { Items?: PaApiRawItem[] };
  Errors?: Array<{ Code: string; Message: string }>;
}

/**
 * Sign a request using AWS Signature Version 4
 */
function signRequest(
  method: string,
  host: string,
  path: string,
  payload: string,
  region: string,
  target: string,
): Record<string, string> {
  const service = "ProductAdvertisingAPI";
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:-]|\.\\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders =
    `content-type:application/json; charset=UTF-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;

  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";
  const payloadHash = crypto.createHash("sha256").update(payload).digest("hex");

  const canonicalRequest = [
    method,
    path,
    "", // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");

  const getSignatureKey = (
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string,
  ) => {
    const kDate = crypto
      .createHmac("sha256", `AWS4${key}`)
      .update(dateStamp)
      .digest();
    const kRegion = crypto
      .createHmac("sha256", kDate)
      .update(regionName)
      .digest();
    const kService = crypto
      .createHmac("sha256", kRegion)
      .update(serviceName)
      .digest();
    return crypto
      .createHmac("sha256", kService)
      .update("aws4_request")
      .digest();
  };

  const signingKey = getSignatureKey(SECRET_KEY, dateStamp, region, service);
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  const authorizationHeader = `${algorithm} Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    "Content-Type": "application/json; charset=UTF-8",
    "X-Amz-Date": amzDate,
    "X-Amz-Target": target,
    Authorization: authorizationHeader,
  };
}

/**
 * Map PA API condition to our standard
 */
function mapCondition(paApiCondition?: string): ProductCondition {
  switch (paApiCondition?.toLowerCase()) {
    case "new":
      return "new";
    case "used":
      return "used";
    case "refurbished":
    case "renewed":
      return "renewed";
    default:
      return "new";
  }
}

/**
 * Map PA API availability to our standard
 */
function mapAvailability(paApiAvailability?: string): AvailabilityStatus {
  switch (paApiAvailability) {
    case "Now":
      return "in_stock";
    case "OutOfStock":
      return "out_of_stock";
    case "PreOrder":
      return "preorder";
    default:
      return "unknown";
  }
}

/**
 * Amazon PA API Data Source Provider
 */
class AmazonPaApiSource implements DataSourceProvider {
  id = "amazon-paapi" as const;
  name = "Amazon PA API";

  isAvailable(): boolean {
    return Boolean(ACCESS_KEY && SECRET_KEY && PARTNER_TAG);
  }

  async fetchProducts(
    category: CategorySlug,
    country: CountryCode,
    options?: FetchOptions,
  ): Promise<UnifiedProduct[]> {
    const browseNodeId = BROWSE_NODE_IDS[category]?.[country];

    if (!browseNodeId) {
      console.warn(`PA API: No browse node for ${category}/${country}`);
      return [];
    }

    // Use SearchItems with browse node filter
    return this.searchProducts("", country, {
      ...options,
      browseNodeId,
      category,
    });
  }

  async fetchProduct(
    productId: string,
    country: CountryCode,
  ): Promise<UnifiedProduct | null> {
    const products = await this.fetchProductsByAsins([productId], country);
    return products[0] || null;
  }

  async searchProducts(
    query: string,
    country: CountryCode,
    options?: SearchOptions,
  ): Promise<UnifiedProduct[]> {
    if (!this.isAvailable()) {
      throw new Error("PA API credentials not configured");
    }

    const endpoint = ENDPOINTS[country];
    const partnerTag = PARTNER_TAGS[country] || PARTNER_TAG;

    if (!endpoint || !partnerTag) {
      throw new Error(`PA API: Marketplace ${country} not configured`);
    }

    const path = "/paapi5/searchitems";
    const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

    const requestBody: Record<string, unknown> = {
      PartnerTag: partnerTag,
      PartnerType: "Associates",
      SearchIndex: "Electronics",
      ItemCount: Math.min(options?.limit || 10, 10),
      Resources: [
        "ItemInfo.Title",
        "ItemInfo.ByLineInfo",
        "ItemInfo.Features",
        "Offers.Listings.Price",
        "Offers.Listings.SavingBasis",
        "Offers.Listings.Availability.Type",
        "Offers.Listings.Condition",
        "Offers.Listings.IsPrimeEligible",
        "Images.Primary.Large",
        "CustomerReviews.Count",
        "CustomerReviews.StarRating",
      ],
    };

    if (query) {
      requestBody.Keywords = query;
    }

    if (options?.browseNodeId) {
      requestBody.BrowseNodeId = options.browseNodeId;
    }

    if (options?.sortBy === "price") {
      requestBody.SortBy =
        options.sortOrder === "desc" ? "Price:HighToLow" : "Price:LowToHigh";
    }

    const payload = JSON.stringify(requestBody);
    const headers = signRequest(
      "POST",
      endpoint.host,
      path,
      payload,
      endpoint.region,
      target,
    );

    const response = await fetch(`https://${endpoint.host}${path}`, {
      method: "POST",
      headers,
      body: payload,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PA API error: ${response.status} - ${error}`);
    }

    const data: PaApiRawResponse = await response.json();

    if (data.Errors?.length) {
      console.error("PA API errors:", data.Errors);
    }

    const items = data.SearchResult?.Items || [];
    return items.map((item) =>
      this.transformItem(item, options?.category || "hard-drives", country),
    );
  }

  /**
   * Fetch products by ASINs (up to 10 per request)
   */
  async fetchProductsByAsins(
    asins: string[],
    country: CountryCode,
  ): Promise<UnifiedProduct[]> {
    if (!this.isAvailable()) {
      throw new Error("PA API credentials not configured");
    }

    const endpoint = ENDPOINTS[country];
    const partnerTag = PARTNER_TAGS[country] || PARTNER_TAG;

    if (!endpoint || !partnerTag) {
      throw new Error(`PA API: Marketplace ${country} not configured`);
    }

    const path = "/paapi5/getitems";
    const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";

    const payload = JSON.stringify({
      ItemIds: asins.slice(0, 10),
      PartnerTag: partnerTag,
      PartnerType: "Associates",
      Resources: [
        "ItemInfo.Title",
        "ItemInfo.ByLineInfo",
        "ItemInfo.Features",
        "Offers.Listings.Price",
        "Offers.Listings.SavingBasis",
        "Offers.Listings.Availability.Type",
        "Offers.Listings.Condition",
        "Offers.Listings.IsPrimeEligible",
        "Images.Primary.Large",
        "CustomerReviews.Count",
        "CustomerReviews.StarRating",
      ],
    });

    const headers = signRequest(
      "POST",
      endpoint.host,
      path,
      payload,
      endpoint.region,
      target,
    );

    const response = await fetch(`https://${endpoint.host}${path}`, {
      method: "POST",
      headers,
      body: payload,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PA API error: ${response.status} - ${error}`);
    }

    const data: PaApiRawResponse = await response.json();

    if (data.Errors?.length) {
      console.error("PA API errors:", data.Errors);
    }

    const items = data.ItemsResult?.Items || [];
    return items.map((item) =>
      this.transformItem(item, "hard-drives", country),
    );
  }

  /**
   * Transform PA API item to UnifiedProduct
   */
  private transformItem(
    item: PaApiRawItem,
    category: CategorySlug,
    country: CountryCode,
  ): UnifiedProduct {
    const currency = COUNTRY_CURRENCIES[country];
    const listing = item.Offers?.Listings?.[0];

    const offers: ProductOffer[] = [];

    if (listing?.Price) {
      offers.push({
        source: "amazon-paapi",
        price: listing.Price.Amount,
        listPrice: listing.SavingBasis?.Amount,
        currency: listing.Price.Currency as Currency,
        displayPrice: listing.Price.DisplayAmount,
        affiliateLink: item.DetailPageURL || "",
        condition: mapCondition(listing.Condition?.Value),
        availability: mapAvailability(listing.Availability?.Type),
        freeShipping: listing.IsPrimeEligible,
        seller: "Amazon",
        lastUpdated: new Date(),
        country,
      });
    }

    return {
      id: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || item.ASIN,
      category,
      imageUrl: item.Images?.Primary?.Large?.URL,
      specifications: {
        brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      },
      offers,
      bestOffer: offers[0],
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count,
      features: item.ItemInfo?.Features?.DisplayValues,
      lastUpdated: new Date(),
      primarySource: "amazon-paapi",
      sources: ["amazon-paapi"],
    };
  }
}

/**
 * Singleton instance
 */
export const amazonPaApiSource = new AmazonPaApiSource();

/**
 * Check if PA API is configured
 */
export function isPaApiConfigured(): boolean {
  return Boolean(ACCESS_KEY && SECRET_KEY && PARTNER_TAG);
}
