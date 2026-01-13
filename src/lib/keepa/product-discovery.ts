/**
 * Keepa Product Discovery
 *
 * Uses Keepa API to discover popular products for import.
 * Focuses on bestsellers and products with good data coverage.
 */

import { updateTokenStatus } from "./token-tracker";
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
  // --- Hub Leaf Categories (Idealo order) ---
  elektroartikel: { de: "569604" }, // Generic Electronics node
  tvs: { de: "1197292" },
  staubsauger: { de: "3597097031" },
  headphones: { de: "430254031" },
  notebooks: { de: "427957031" },
  tablets: { de: "427958031" },
  espressomaschinen: { de: "3340859031" },
  monitors: { de: "429868031" },
  speakers: { de: "429871031" },
  kuehlschraenke: { de: "16075771" },
  "elektrische-zahnbuersten": { de: "309873031" },
  waschmaschinen: { de: "16075751" },
  ssds: { de: "430168031" },
  multifunktionsdrucker: { de: "430113031" },
  geschirrspueler: { de: "16075761" },
  routers: { de: "430154031" },
  systemkameras: { de: "430121031" },
  backoefen: { de: "340801031" },
  kochfelder: { de: "3340578031" },
  soundbars: { de: "1957268031" },
  radios: { de: "571816" },
  waeschetrockner: { de: "16075781" },
  kuechenmaschinen: { de: "340799031" },
  "bartschneider-haarschneider": { de: "315488031" },
  receiver: { de: "571830" },
  mikrowellen: { de: "340795031" },
  dunstabzugshauben: { de: "340804031" },
  "hard-drives": { de: "430498031" },
  gefrierschraenke: { de: "16075791" },
  herde: { de: "16075841" },
  drones: { de: "2603417031" },
  nas: { de: "430138031" },
  "external-storage": { de: "430129031" },
  speicherkarten: { de: "562066" }, // Generic memory card node

  // --- PC Components & Additional ---
  smartphones: { de: "3468301" },
  consoles: { de: "160279031" },
  cpu: { de: "430177031" },
  gpu: { de: "430161031" },
  ram: { de: "430178031" },
  motherboards: { de: "430172031" },
  "pc-cases": { de: "430174031" },
  "power-supplies": { de: "430176031" },
  keyboards: { de: "430221031" },
  mice: { de: "430218031" },
  smartwatches: { de: "403290031" },
  "cpu-coolers": { de: "430204031" },
  "gaming-chairs": { de: "52173584031" },
  webcams: { de: "430292031" },
  microphones: { de: "412469031" },
  "vr-headsets": { de: "22477299031" }, // Virtual Reality > Standalone > Headsets

  // --- Elektrowerkzeuge (Power Tools) ---
  akkuschrauber: { de: "2077432031" },
  kreissaegen: { de: "1939390031" },

  // --- New / Combined Categories ---
  "drucker-scanner": { de: "430113031" }, // Reuse Multifunction Printers
  "gaming-elektrospielzeug": { de: "12950651" }, // Generic Toys (Spielzeug)

  bohrmaschinen: { de: "82512031" },
  schleifmaschinen: { de: "82544031" },
  fraesmaschinen: { de: "2077461031" },
  stichsaegen: { de: "2077473031" },
  kappsaegen: { de: "2077470031" },
  tauchsaegen: { de: "2077470031" }, // Circular saws general
  multitools: { de: "2077463031" },
};

// ... (in getCategoryKeywords function)

// High Priority Consumer Tech

// Keepa product interface (relevant fields for discovery)
export interface KeepaProductRaw {
  asin: string;
  title?: string;
  brand?: string;
  manufacturer?: string; // Fallback for brand
  model?: string; // Product model
  productType?: number;
  imagesCSV?: string;
  features?: string[];
  description?: string;
  rootCategory?: number;

  // Identifiers for multi-source matching
  eanList?: string[]; // EAN-13 barcodes (European)
  upcList?: string[]; // UPC-12 barcodes (US/Canada)
  mpn?: string; // Manufacturer Part Number

  // Price and stats
  stats?: {
    current?: (number | null)[];
    avg?: (number | null)[];
    avg30?: (number | null)[];
    avg90?: (number | null)[];
    min?: (number | null)[];
    max?: (number | null)[];
  };

  // Sales and availability
  monthlySold?: number; // Estimated monthly sales
  fbaFees?: object; // Presence indicates FBA/Prime eligible
  availabilityAmazon?: number; // Amazon stock status

  salesRanks?: Record<number, number[][]>;
  lastUpdate?: number;
  parentAsin?: string;
  variationCSV?: string;
  categories?: number[];
  categoryTree?: { catId: number; name: string }[];
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

interface KeepaDealResponse {
  tokensConsumed?: number;
  tokensLeft?: number;
  deals?: {
    asin?: string;
    title?: string;
    delta?: number;
    deltaPercent?: number;
    price?: number;
    current?: number;
  }[];
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

  if (data.tokensLeft !== undefined) {
    updateTokenStatus(data.tokensLeft);
  }

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

  const requestUrl = `${BASE_URL}/search?${params}`;
  console.log(
    `[Keepa Input] Search URL: ${requestUrl.replace(KEEPA_API_KEY, "KEY")}`,
  );
  const response = await fetch(requestUrl);
  const data: KeepaSearchResponse = await response.json();

  if (data.error) {
    throw new Error(`Keepa search error: ${data.error.message}`);
  }

  if (data.tokensLeft !== undefined) {
    updateTokenStatus(data.tokensLeft);
  }

  console.log(
    `[Keepa] Search "${keyword}": ${data.asinList?.length || 0} results, ${data.tokensLeft} tokens left`,
  );

  return data.asinList || [];
}

/**
 * Get bestsellers for a category
 * Cost: 50 tokens (for list of up to 500)
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
  if (!categoryId || categoryId === "0") {
    console.warn(
      `[Keepa] Skipping bestsellers: No Browse Node mapping found for category "${categorySlug}" in ${country}.`,
    );
    return [];
  }
  const params = new URLSearchParams({
    key: KEEPA_API_KEY,
    domain: domain.toString(),
    category: categoryId,
  });

  const requestUrl = `${BASE_URL}/bestsellers?${params}`;
  const response = await fetch(requestUrl);
  const data: KeepaBestSellersResponse = await response.json();

  if (data.error) {
    throw new Error(`Keepa bestsellers error: ${data.error.message}`);
  }

  if (data.tokensLeft !== undefined) {
    updateTokenStatus(data.tokensLeft);
  }

  const asins = data.bestSellersList?.asinList || [];
  console.log(
    `[Keepa] Bestsellers ${categorySlug}/${country}: ${asins.length} ASINs found`,
  );

  return asins.slice(0, limit);
}

/**
 * Get deals (price drops) for a category
 * Cost: 5 tokens per 150 items
 */
export async function getDeals(
  categorySlug: string,
  country: CountryCode = "us",
  limit: number = 150,
): Promise<string[]> {
  if (!KEEPA_API_KEY) {
    throw new Error("KEEPA_API_KEY not configured");
  }

  const domain = KEEPA_DOMAINS[country];
  if (!domain) {
    throw new Error(`Country ${country} not supported by Keepa`); // Should be domainId
  }

  const categoryId = CATEGORY_BROWSE_NODES[categorySlug]?.[country];
  if (!categoryId) {
    console.warn(
      `No browse node for ${categorySlug} in ${country}, skipping deals`,
    );
    return [];
  }

  // Define deal query params (looking for significant drops)
  // This is a complex object in Keepa API usually sent as JSON body
  try {
    const dealQuery = {
      page: 0,
      domainId: domain,
      includeCategories: [parseInt(categoryId)],
      priceTypes: [0, 1], // Amazon and Marketplace New
      deltaPercentRange: [20, 100],
      isPrime: true,
    };

    const response = await fetch(`${BASE_URL}/deal?key=${KEEPA_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dealQuery),
    });

    const data: KeepaDealResponse = await response.json();

    if (data.error) {
      console.warn(
        `[Keepa] Deals failed for ${categorySlug}: ${data.error.message}`,
      );
      return [];
    }

    if (data.tokensLeft !== undefined) {
      updateTokenStatus(data.tokensLeft);
    }

    const asins = data.deals?.map((d) => d.asin!) || [];
    console.log(
      `[Keepa] Deals ${categorySlug}/${country}: ${asins.length} ASINs found`,
    );

    return asins.slice(0, limit);
  } catch (error) {
    console.warn(`[Keepa] Deals error for ${categorySlug}:`, error);
    return [];
  }
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
    history: options.includeHistory ? "1" : "0",
  });

  if (options.days && options.days > 0) {
    params.set("stats", options.days.toString());
  } else if (options.days === undefined) {
    params.set("stats", "90");
  }

  const response = await fetch(`${BASE_URL}/product?${params}`);
  const data: KeepaProductResponse = await response.json();

  if (data.error) {
    throw new Error(`Keepa product error: ${data.error.message}`);
  }

  if (data.tokensLeft !== undefined) {
    updateTokenStatus(data.tokensLeft);
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
    // Increased limit to 100 to maximize yield per request (efficient)
    const bestsellers = await getBestsellers(categorySlug, country, 100);
    bestsellers.forEach((asin) => allAsins.add(asin));
    console.log(
      `[Keepa] Got ${bestsellers.length} bestsellers for ${categorySlug}`,
    );
  } catch (error) {
    console.error(`[Keepa] Bestsellers failed for ${categorySlug}:`, error);
  }

  // 2. Get Deals (highly token efficient: 5 tokens for 150 items)
  if (allAsins.size < targetCount) {
    try {
      // Increased limit to 100 to fill gaps
      const deals = await getDeals(categorySlug, country, 100);
      deals.forEach((asin) => allAsins.add(asin));
      console.log(`[Keepa] Added ${deals.length} deals for ${categorySlug}`);
    } catch (error) {
      console.error(`[Keepa] Deals failed for ${categorySlug}:`, error);
    }
  }

  // 3. Keyword searches removed to save tokens (low yield, high cost)
  // relying on Bestsellers + Deals is much more efficient.

  // 4. Fetch full product data
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
    "hard-drives": ["4TB HDD", "NAS Festplatte", "WD Red", "Seagate IronWolf"],
    ssds: [
      "Samsung 990 Pro",
      "Crucial T705",
      "WD Black SN850X",
      "NVMe SSD 2TB",
    ],
    "external-storage": [
      "External HDD 8TB",
      "Portable Drive 2TB",
      "Western Digital Elements",
    ],
    ram: ["DDR5 RAM 32GB", "Corsair Vengeance DDR5", "G.Skill Trident Z5"],
    "power-supplies": [
      "Corsair RM850x",
      "Seasonic Focus",
      "be quiet! Straight Power",
    ],
    cpu: ["AMD Ryzen 7 7800X3D", "Intel Core i7-14700K", "AMD Ryzen 5 7600"],
    gpu: ["NVIDIA RTX 4080 Super", "AMD Radeon RX 7900 XTX", "RTX 4070 Super"],
    motherboards: [
      "ASUS ROG Strix B650",
      "MSI MAG Z790",
      "Gigabyte Aorus X670",
    ],
    smartphones: ["iPhone 15 Pro", "Samsung Galaxy S24 Ultra", "Pixel 8 Pro"],
    notebooks: [
      "MacBook Air M3",
      "Dell XPS 13",
      "Lenovo Yoga",
      "Gaming Laptop",
    ],
    tvs: ["LG OLED G3", "Samsung S95C OLED", "Sony A95L", "4K TV 55 Zoll"],
    consoles: ["PlayStation 5 Slim", "Xbox Series X", "Nintendo Switch OLED"],
    monitors: ["Gaming Monitor 240Hz", "4K IPS Monitor", "LG UltraGear"],
    staubsauger: ["Dyson V15", "Roborock S8 Pro Ultra", "Miele Triflex"],
    espressomaschinen: ["DeLonghi Primadonna", "Siemens EQ900", "Sage Barista"],
    headphones: ["AirPods Pro 2", "Sony WH-1000XM5", "Bose QC Ultra"],
    tablets: ["iPad Pro M4", "Galaxy Tab S9 Ultra", "iPad Air M2"],
    speakers: ["JBL Authentics", "Sonos Era 300", "Bose Home Speaker"],
    kühlschränke: ["Samsung Side-by-Side", "Bosch NoFrost", "LG GSXV91BSAE"],
    "elektrische-zahnbürsten": [
      "Oral-B iO Series 10",
      "Philips Sonicare DiamondClean",
    ],
    waschmaschinen: ["Miele W1", "Bosch Serie 8", "Samsung WW90"],
    multifunktionsdrucker: ["HP OfficeJet Pro", "Epson EcoTank", "Brother MFC"],
    geschirrspüler: ["Bosch Serie 6", "Miele G 7000", "Siemens iQ700"],
    systemkameras: ["Sony A7 IV", "Canon R6 II", "Fujifilm X-T5"],
    drones: ["DJI Mini 4 Pro", "DJI Air 3", "DJI Mavic 3 Pro"],
    keyboards: ["Logitech MX Keys S", "Razer BlackWidow V4", "Keychron Q3"],
    mice: ["Logitech MX Master 3S", "Razer Viper V3 Pro", "G502 X Plus"],
  };

  return keywordMap[categorySlug] || [categorySlug.replace(/-/g, " ")];
}

/**
 * Check if Keepa is configured
 */
export function isKeepaConfigured(): boolean {
  return Boolean(KEEPA_API_KEY);
}
