/**
 * Keepa Product Discovery
 *
 * Uses Keepa API to discover popular products for import.
 * Focuses on bestsellers and products with good data coverage.
 */

import type { CountryCode } from "@/lib/countries";

// Environment variable
const KEEPA_API_KEY = process.env.KEEPA_API_KEY || "";

// Keepa domain codes
export const KEEPA_DOMAINS: Record<string, number> = {
  us: 1,
  uk: 2,
  de: 3,
  fr: 4,
  ca: 6,
  it: 8,
  es: 9,
};

// Amazon Browse Node IDs for our categories
// These are Amazon's category identifiers for bestseller queries
export const CATEGORY_BROWSE_NODES: Record<string, Record<string, string>> = {
  // Hard Drives & SSDs
  "hard-drives": {
    us: "1292116011", // Internal SSDs
    de: "430516031",
  },
  ssd: {
    us: "1292116011",
    de: "430516031",
  },
  hdd: {
    us: "1254762011",
    de: "430498031",
  },
  // RAM
  ram: {
    us: "172500",
    de: "430469031",
  },
  // Power Supplies
  "power-supplies": {
    us: "1161760",
    de: "430513031",
  },
  psu: {
    us: "1161760",
    de: "430513031",
  },
  // CPUs (future)
  cpu: {
    us: "229189",
    de: "428657031",
  },
  // GPUs (future)
  gpu: {
    us: "284822",
    de: "430502031",
  },
};

// Keepa product interface (relevant fields for discovery)
export interface KeepaProductRaw {
  asin: string;
  title?: string;
  brand?: string;
  productType?: number;
  imagesCSV?: string;
  features?: string[];
  description?: string;
  rootCategory?: number;
  stats?: {
    current?: (number | null)[];
    avg?: (number | null)[];
    avg30?: (number | null)[];
    avg90?: (number | null)[];
    min?: (number | null)[];
    max?: (number | null)[];
  };
  salesRanks?: Record<number, number[][]>;
  lastUpdate?: number;
  parentAsin?: string;
  variationCSV?: string;
  categories?: number[];
}

// Search results type
export interface KeepaSearchResult {
  asinList?: string[];
  categoryCount?: number;
  totalResults?: number;
}

// Response types
interface KeepaProductResponse {
  tokensConsumed?: number;
  tokensLeft?: number;
  products?: KeepaProductRaw[];
  error?: { type: string; message: string };
}

interface KeepaSearchResponse {
  tokensConsumed?: number;
  tokensLeft?: number;
  asinList?: string[];
  totalResults?: number;
  error?: { type: string; message: string };
}

interface KeepaBestSellersResponse {
  tokensConsumed?: number;
  tokensLeft?: number;
  bestSellersList?: {
    asinList?: string[];
    lastUpdate?: number;
    categoryId?: number;
    domainId?: number;
  };
  error?: { type: string; message: string };
}

const BASE_URL = "https://api.keepa.com";

/**
 * Check remaining API tokens
 */
export async function getTokenStatus(): Promise<{
  tokensLeft: number;
  refillRate: number;
}> {
  const response = await fetch(`${BASE_URL}/token?key=${KEEPA_API_KEY}`);
  const data = await response.json();
  return {
    tokensLeft: data.tokensLeft || 0,
    refillRate: data.refillRate || 0,
  };
}

/**
 * Search for products by keyword
 * Cost: 1 token per 50 ASINs returned
 */
export async function searchProducts(
  keyword: string,
  country: CountryCode = "us",
  options: {
    limit?: number;
    sort?: "best" | "current" | "rating" | "sales";
  } = {},
): Promise<string[]> {
  if (!KEEPA_API_KEY) {
    throw new Error("KEEPA_API_KEY not configured");
  }

  const domain = KEEPA_DOMAINS[country];
  if (!domain) {
    throw new Error(`Country ${country} not supported by Keepa`);
  }

  const params = new URLSearchParams({
    key: KEEPA_API_KEY,
    domain: domain.toString(),
    type: "product",
    term: keyword,
    page: "0",
    perPage: (options.limit || 50).toString(),
  });

  // Sort mapping
  if (options.sort) {
    const sortMap = { best: "0", current: "1", rating: "2", sales: "3" };
    params.set("sort", sortMap[options.sort]);
  }

  const response = await fetch(`${BASE_URL}/search?${params}`);
  const data: KeepaSearchResponse = await response.json();

  if (data.error) {
    throw new Error(`Keepa search error: ${data.error.message}`);
  }

  console.log(
    `[Keepa] Search "${keyword}": ${data.asinList?.length || 0} results, ${data.tokensLeft} tokens left`,
  );

  return data.asinList || [];
}

/**
 * Get bestsellers for a category
 * Cost: ~1 token
 */
export async function getBestsellers(
  categorySlug: string,
  country: CountryCode = "us",
  limit: number = 100,
): Promise<string[]> {
  if (!KEEPA_API_KEY) {
    throw new Error("KEEPA_API_KEY not configured");
  }

  const domain = KEEPA_DOMAINS[country];
  if (!domain) {
    throw new Error(`Country ${country} not supported by Keepa`);
  }

  const categoryId = CATEGORY_BROWSE_NODES[categorySlug]?.[country];
  if (!categoryId) {
    console.warn(
      `No browse node for ${categorySlug} in ${country}, using search instead`,
    );
    // Fallback to keyword search
    return searchProducts(categorySlug.replace(/-/g, " "), country, {
      limit,
      sort: "sales",
    });
  }

  const params = new URLSearchParams({
    key: KEEPA_API_KEY,
    domain: domain.toString(),
    category: categoryId,
  });

  const response = await fetch(`${BASE_URL}/bestsellers?${params}`);
  const data: KeepaBestSellersResponse = await response.json();

  if (data.error) {
    throw new Error(`Keepa bestsellers error: ${data.error.message}`);
  }

  const asins = data.bestSellersList?.asinList || [];
  console.log(
    `[Keepa] Bestsellers ${categorySlug}/${country}: ${asins.length} ASINs, token info: ${data.tokensLeft}`,
  );

  return asins.slice(0, limit);
}

/**
 * Get full product data for ASINs
 * Cost: 1 token per product
 */
export async function getProducts(
  asins: string[],
  country: CountryCode = "us",
  options: {
    includeHistory?: boolean;
    days?: number;
  } = {},
): Promise<KeepaProductRaw[]> {
  if (!KEEPA_API_KEY) {
    throw new Error("KEEPA_API_KEY not configured");
  }

  if (asins.length === 0) return [];

  const domain = KEEPA_DOMAINS[country];
  if (!domain) {
    throw new Error(`Country ${country} not supported by Keepa`);
  }

  // Keepa allows up to 100 ASINs per request
  const batch = asins.slice(0, 100);

  const params = new URLSearchParams({
    key: KEEPA_API_KEY,
    domain: domain.toString(),
    asin: batch.join(","),
    stats: options.days?.toString() || "90",
    history: options.includeHistory ? "1" : "0",
    buybox: "0",
    offers: "0",
  });

  const response = await fetch(`${BASE_URL}/product?${params}`);
  const data: KeepaProductResponse = await response.json();

  if (data.error) {
    throw new Error(`Keepa product error: ${data.error.message}`);
  }

  console.log(
    `[Keepa] Products: ${data.products?.length || 0} fetched, ${data.tokensLeft} tokens left`,
  );

  return data.products || [];
}

/**
 * Discover products for a category
 * Combines bestsellers + keyword search for comprehensive coverage
 */
export async function discoverProducts(
  categorySlug: string,
  country: CountryCode = "us",
  targetCount: number = 100,
): Promise<KeepaProductRaw[]> {
  const allAsins = new Set<string>();

  // 1. Get bestsellers (most important)
  try {
    const bestsellers = await getBestsellers(categorySlug, country, 50);
    bestsellers.forEach((asin) => allAsins.add(asin));
    console.log(
      `[Keepa] Got ${bestsellers.length} bestsellers for ${categorySlug}`,
    );
  } catch (error) {
    console.error(`[Keepa] Bestsellers failed for ${categorySlug}:`, error);
  }

  // 2. Supplement with keyword searches
  const keywords = getCategoryKeywords(categorySlug);
  for (const keyword of keywords) {
    if (allAsins.size >= targetCount) break;

    try {
      const results = await searchProducts(keyword, country, {
        limit: 30,
        sort: "sales",
      });
      results.forEach((asin) => allAsins.add(asin));
    } catch (error) {
      console.error(`[Keepa] Search failed for "${keyword}":`, error);
    }

    // Small delay to be nice to the API
    await new Promise((r) => setTimeout(r, 200));
  }

  // 3. Fetch full product data
  const asinList = Array.from(allAsins).slice(0, targetCount);
  console.log(`[Keepa] Fetching details for ${asinList.length} products...`);

  // Batch fetching (100 at a time)
  const products: KeepaProductRaw[] = [];
  for (let i = 0; i < asinList.length; i += 100) {
    const batch = asinList.slice(i, i + 100);
    const batchProducts = await getProducts(batch, country, {
      includeHistory: false,
    });
    products.push(...batchProducts);

    // Small delay between batches
    if (i + 100 < asinList.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return products;
}

/**
 * Get search keywords for a category
 */
function getCategoryKeywords(categorySlug: string): string[] {
  const keywordMap: Record<string, string[]> = {
    "hard-drives": [
      "NVMe SSD 2TB",
      "NVMe SSD 1TB",
      "SATA SSD 2TB",
      "Internal HDD 8TB",
      "Samsung 990 Pro",
      "WD Black SN850X",
      "Crucial P3 Plus",
    ],
    ssd: [
      "NVMe SSD",
      "SATA SSD",
      "Samsung SSD",
      "WD SSD",
      "Crucial SSD",
      "Kingston SSD",
    ],
    hdd: [
      "Internal HDD",
      "External HDD",
      "Seagate HDD",
      "WD HDD",
      "Toshiba HDD",
    ],
    ram: [
      "DDR5 RAM 32GB",
      "DDR4 RAM 32GB",
      "DDR5 RAM 64GB",
      "Corsair Vengeance DDR5",
      "G.Skill Trident Z5",
      "Kingston Fury Beast",
    ],
    "power-supplies": [
      "ATX power supply 850W",
      "ATX power supply 1000W",
      "Corsair PSU",
      "Seasonic PSU",
      "EVGA PSU",
    ],
    psu: ["80 Plus Gold PSU", "Modular power supply", "750W PSU", "850W PSU"],
    cpu: [
      "AMD Ryzen 9",
      "AMD Ryzen 7",
      "Intel Core i9",
      "Intel Core i7",
      "AMD Ryzen 5",
    ],
    gpu: [
      "NVIDIA RTX 4090",
      "NVIDIA RTX 4080",
      "NVIDIA RTX 4070",
      "AMD Radeon RX 7900",
      "AMD Radeon RX 7800",
    ],
  };

  return keywordMap[categorySlug] || [categorySlug.replace(/-/g, " ")];
}

/**
 * Check if Keepa is configured
 */
export function isKeepaConfigured(): boolean {
  return Boolean(KEEPA_API_KEY);
}
