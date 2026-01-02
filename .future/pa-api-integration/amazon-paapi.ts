/**
 * Amazon Product Advertising API v5 Client
 *
 * Documentation: https://webservices.amazon.com/paapi5/documentation/
 *
 * SETUP:
 * 1. Get approved for Amazon Associates (need 3 qualifying sales in 180 days)
 * 2. Apply for PA API access in Associates Central
 * 3. Get your Access Key, Secret Key, and Partner Tag
 * 4. Add credentials to .env.local
 */

import crypto from "crypto";

// Environment variables (add to .env.local)
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

// Partner tags per marketplace (you'll need one per country)
const PARTNER_TAGS: Record<string, string> = {
  us: process.env.PAAPI_PARTNER_TAG_US || PARTNER_TAG,
  uk: process.env.PAAPI_PARTNER_TAG_UK || "",
  de: process.env.PAAPI_PARTNER_TAG_DE || "",
  fr: process.env.PAAPI_PARTNER_TAG_FR || "",
  es: process.env.PAAPI_PARTNER_TAG_ES || "",
  it: process.env.PAAPI_PARTNER_TAG_IT || "",
  ca: process.env.PAAPI_PARTNER_TAG_CA || "",
};

/**
 * PA API Response Types
 */
export interface PaApiPrice {
  amount: number;
  currency: string;
  displayAmount: string;
}

export interface PaApiProduct {
  asin: string;
  title: string;
  url: string;
  imageUrl?: string;
  price?: PaApiPrice;
  listPrice?: PaApiPrice;
  availability?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  features?: string[];
}

export interface PaApiError {
  code: string;
  message: string;
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
): Record<string, string> {
  const service = "ProductAdvertisingAPI";
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  // Create canonical request
  const canonicalHeaders =
    `content-type:application/json; charset=UTF-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n`;

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

  // Create string to sign
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

  // Calculate signature
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
    const kSigning = crypto
      .createHmac("sha256", kService)
      .update("aws4_request")
      .digest();
    return kSigning;
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
    "X-Amz-Target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
    Authorization: authorizationHeader,
  };
}

/**
 * Get product details by ASINs
 * @param asins - Array of ASINs (max 10 per request)
 * @param marketplace - Country code (us, uk, de, etc.)
 */
export async function getItems(
  asins: string[],
  marketplace: string = "us",
): Promise<{ products: PaApiProduct[]; errors: PaApiError[] }> {
  if (!ACCESS_KEY || !SECRET_KEY) {
    throw new Error("PA API credentials not configured. Add to .env.local");
  }

  const endpoint = ENDPOINTS[marketplace];
  const partnerTag = PARTNER_TAGS[marketplace];

  if (!endpoint || !partnerTag) {
    throw new Error(`Marketplace ${marketplace} not configured`);
  }

  const path = "/paapi5/getitems";
  const payload = JSON.stringify({
    ItemIds: asins.slice(0, 10), // Max 10 per request
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.Features",
      "ItemInfo.ByLineInfo",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "Offers.Listings.Availability.Type",
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

  const data = await response.json();

  // Parse response
  const products: PaApiProduct[] = [];
  const errors: PaApiError[] = [];

  if (data.ItemsResult?.Items) {
    for (const item of data.ItemsResult.Items) {
      const listing = item.Offers?.Listings?.[0];

      products.push({
        asin: item.ASIN,
        title: item.ItemInfo?.Title?.DisplayValue || "",
        url: item.DetailPageURL || "",
        imageUrl: item.Images?.Primary?.Large?.URL,
        price: listing?.Price
          ? {
              amount: listing.Price.Amount,
              currency: listing.Price.Currency,
              displayAmount: listing.Price.DisplayAmount,
            }
          : undefined,
        listPrice: listing?.SavingBasis
          ? {
              amount: listing.SavingBasis.Amount,
              currency: listing.SavingBasis.Currency,
              displayAmount: listing.SavingBasis.DisplayAmount,
            }
          : undefined,
        availability: listing?.Availability?.Type,
        rating: item.CustomerReviews?.StarRating?.Value,
        reviewCount: item.CustomerReviews?.Count,
        brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
        features: item.ItemInfo?.Features?.DisplayValues,
      });
    }
  }

  if (data.Errors) {
    for (const err of data.Errors) {
      errors.push({ code: err.Code, message: err.Message });
    }
  }

  return { products, errors };
}

/**
 * Search for products by keyword
 * @param keywords - Search query
 * @param browseNodeId - Optional category filter
 * @param marketplace - Country code
 */
export async function searchItems(
  keywords: string,
  options: {
    browseNodeId?: string;
    marketplace?: string;
    sortBy?: "Price:LowToHigh" | "Price:HighToLow" | "AvgCustomerReviews";
    itemCount?: number;
  } = {},
): Promise<{ products: PaApiProduct[]; errors: PaApiError[] }> {
  const { marketplace = "us", sortBy, itemCount = 10, browseNodeId } = options;

  if (!ACCESS_KEY || !SECRET_KEY) {
    throw new Error("PA API credentials not configured. Add to .env.local");
  }

  const endpoint = ENDPOINTS[marketplace];
  const partnerTag = PARTNER_TAGS[marketplace];

  if (!endpoint || !partnerTag) {
    throw new Error(`Marketplace ${marketplace} not configured`);
  }

  const path = "/paapi5/searchitems";
  const payload = JSON.stringify({
    Keywords: keywords,
    BrowseNodeId: browseNodeId,
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    SearchIndex: "Electronics",
    SortBy: sortBy,
    ItemCount: Math.min(itemCount, 10),
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "Offers.Listings.Price",
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
  );
  headers["X-Amz-Target"] =
    "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

  const response = await fetch(`https://${endpoint.host}${path}`, {
    method: "POST",
    headers,
    body: payload,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PA API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Parse response (same structure as getItems)
  const products: PaApiProduct[] = [];
  const errors: PaApiError[] = [];

  if (data.SearchResult?.Items) {
    for (const item of data.SearchResult.Items) {
      const listing = item.Offers?.Listings?.[0];

      products.push({
        asin: item.ASIN,
        title: item.ItemInfo?.Title?.DisplayValue || "",
        url: item.DetailPageURL || "",
        imageUrl: item.Images?.Primary?.Large?.URL,
        price: listing?.Price
          ? {
              amount: listing.Price.Amount,
              currency: listing.Price.Currency,
              displayAmount: listing.Price.DisplayAmount,
            }
          : undefined,
        availability: listing?.Availability?.Type,
        rating: item.CustomerReviews?.StarRating?.Value,
        reviewCount: item.CustomerReviews?.Count,
        brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      });
    }
  }

  if (data.Errors) {
    for (const err of data.Errors) {
      errors.push({ code: err.Code, message: err.Message });
    }
  }

  return { products, errors };
}

/**
 * Check if PA API is configured
 */
export function isPaApiConfigured(): boolean {
  return Boolean(ACCESS_KEY && SECRET_KEY && PARTNER_TAG);
}
