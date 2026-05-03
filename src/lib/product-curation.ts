import { allCategories, type CategorySlug } from "./categories";
import { type Product } from "./product-registry";
import { calculateDesirabilityScore } from "./server/scoring";
import {
  calculateProductDiscount,
  getLocalizedProductData,
  isProductBestseller,
} from "./utils/products";
import { isProductHighQuality } from "./utils/quality";

interface DashboardProduct {
  id?: number;
  title: string;
  price: number;
  slug: string;
  image: string | null;
  rating: number | null;
  ratingCount: number | null;
  testRating?: number;
  testCount?: number;
  categoryName?: string;
  discountRate?: number;
  isBestseller: boolean;
  variationAttributes?: string | null;
  badgeText?: string;
  parentAsin?: string | null;
  groupKey?: string;
  brand: string | null;
  pricesLastUpdated?: Record<string, string>;
}

interface CurationOptions {
  maxItems?: number;
  categoryLimit?: number; // Strict limit per category
  minPrice?: number; // Filter out cheap items (e.g. for Hero section)
  sortBy?: "revenue" | "quality" | "discount" | "date"; // Sorting strategy
  requireDiscount?: boolean;
  excludeIds?: Set<string>;
  excludeParentIds?: Set<string>;
  excludeGroupKeys?: Set<string>;
}

interface CandidateItem {
  original: Product;
  display: DashboardProduct;
  score: number;
  revenue: number;
  discountRate: number;
  category: string;
}

/**
 * Curates a raw list of products into a polished, display-ready list.
 * Replaces hardcoded keyword logic with data-driven metrics (Revenue, Sales Velocity).
 */
/**
 * Generate a deduplication key to identify variants even if parentAsin is missing.
 * Strips common variant modifiers (colors, capacities, etc.) and normalizes gaming consoles.
 */
function getProductGroupKey(p: Product): string {
  if (p.parentAsin) return p.parentAsin;

  let title = (p.title || "").toLowerCase();

  // 1. Aggressive Console Normalization
  if (
    title.includes("playstation 5") ||
    title.includes("ps5") ||
    title.includes("playstation®5")
  )
    return "ps5";
  if (
    title.includes("playstation 4") ||
    title.includes("ps4") ||
    title.includes("playstation®4")
  )
    return "ps4";
  if (title.includes("xbox series x")) return "xbox series x";
  if (title.includes("xbox series s")) return "xbox series s";
  if (title.includes("nintendo switch")) return "switch";

  // 2. Strip Brand Prefixes (e.g. "Sony PlayStation..." -> "PlayStation...")
  const brand = (p.brand || "").toLowerCase();
  if (brand && title.startsWith(brand)) {
    title = title.substring(brand.length).trim();
  }

  // 3. Strip common variant noise
  // Remove technical/marketing filler words (but keep "Pro", "Max", "Ultra" as they distinguish models)
  return title
    .split(/[\(\)\[\]\|,\-]/)[0] // Take first part before delimiters
    .replace(
      /\b(schwarz|weiß|grau|blau|rot|grün|gelb|rosa|gold|silber|black|white|grey|gray|blue|red|green|yellow|pink|gold|silver)\b/g,
      "",
    )
    .replace(
      /\b(kompakt|compact|wireless|kabellos|bluetooth|trueplay|smart|edition|subwoofer|lautsprecher|speaker|soundbar|portable|tragbar)\b/g,
      "",
    )
    .replace(/\b\d+\s?(gb|tb|mb|gb|tb|core|kerne|zoll|inch)\b/g, "")
    .replace(/\b(v[23456]|gen\s?\d+|202\d)\b/g, "")
    .trim()
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .substring(0, 30); // Use first 30 chars of cleaned title as group ID
}

import { getSafeNow } from "./server/deterministic-time";

const CURRENT_YEAR = new Date(getSafeNow()).getFullYear();

export function curateProductList(
  list: Product[],
  countryCode: string,
  options: CurationOptions = {},
): DashboardProduct[] {
  const {
    maxItems = 10,
    categoryLimit = 1,
    minPrice = 0,
    sortBy = "quality",
    requireDiscount = false,
  } = options;
  // The provided code snippet for `parentSlug` uses React hooks (`useMemo`) and undefined variables (`currentProduct`, `variants`, `getFamilyIdentity`).
  // It also contains a syntax error: `});.excludeIds`.
  // As this function is not a React component, and to maintain syntactical correctness, this specific snippet cannot be directly inserted.
  // If the intent was to define `excludeIds`, `excludeParentIds`, and `excludeGroupKeys` differently, please provide a syntactically valid JavaScript/TypeScript implementation.
  const excludeIds = options.excludeIds || new Set<string>();
  const excludeParentIds = options.excludeParentIds || new Set<string>();
  const excludeGroupKeys = options.excludeGroupKeys || new Set<string>();

  const validCandidates: CandidateItem[] = list
    .map((p): CandidateItem | null => {
      // 1. Basic Data Integrity
      if (p.condition !== "New") return null;
      if (excludeIds.has(p.slug)) return null;
      if (p.parentAsin && excludeParentIds.has(p.parentAsin)) return null;

      const groupKey = getProductGroupKey(p);
      if (excludeGroupKeys.has(groupKey)) return null;

      const { price, title } = getLocalizedProductData(p, countryCode);

      // 1. Basic Availability Guard
      if (price === null || price <= 0) return null;

      // 2. High Quality Guard (Unified Logic)
      if (
        !isProductHighQuality(p, {
          checkPrice: true,
          countryCode,
          isParentView: false,
        })
      ) {
        return null;
      }

      if (price < minPrice) return null;

      // 2. Strict Recency Filter for "New Arrivals"
      if (sortBy === "date") {
        const titleLower = title.toLowerCase();
        const cutoffYear = CURRENT_YEAR - 2; // Allow 2024, 2025, 2026. Reject 2023 and older.

        // 1. TRUSTED SOURCE: Release Date from specifications
        if (p.releaseDate) {
          const releaseMatch = p.releaseDate.match(/\b(20[0-9]{2})\b/);
          if (releaseMatch) {
            const releaseYear = parseInt(releaseMatch[1]);
            if (releaseYear > 0 && releaseYear < cutoffYear) return null;
          }
        }

        // 2. Detect "Old Tech" keywords
        const oldTechKeywords = [
          "iphone 11",
          "iphone 12",
          "iphone 13",
          "iphone x",
          "iphone 8",
          "galaxy s10",
          "galaxy s20",
          "galaxy s21",
          "galaxy note",
          "ryzen 3000",
          "ryzen 5000",
          "intel 9th",
          "intel 10th",
          "intel 11th",
          "ps4",
          "playstation 4",
          "xbox one",
        ];
        if (oldTechKeywords.some((kw) => titleLower.includes(kw))) return null;

        // 3. Last Resort: Title Regex (Only for explicit "Modelljahr XXXX")
        if (
          titleLower.includes("modelljahr") ||
          titleLower.includes("model year")
        ) {
          const yearRegex = /\b(20[12][0-9])\b/;
          const titleMatch = title.match(yearRegex);
          if (titleMatch) {
            const yearFromTitle = parseInt(titleMatch[1]);
            if (yearFromTitle > 0 && yearFromTitle < cutoffYear) return null;
          }
        }

        // 4. Fallback to createdAt
        const yearFromDate = p.createdAt
          ? new Date(p.createdAt).getFullYear()
          : 0;

        if (yearFromDate > 0 && yearFromDate < cutoffYear) return null;
      }

      const discountRate = calculateProductDiscount(p, countryCode);

      if (requireDiscount && discountRate <= 0) return null;

      // --- Core Desirability Scoring (Shared) ---
      const { popularityScore, revenue } = calculateDesirabilityScore(
        p,
        price,
        title,
        "landing",
      );
      let score = popularityScore;

      // Discount Bonus (Specific to curation view)
      if (discountRate >= 20) score += discountRate * 2;

      // 4. Quality Gates
      // Absolute rejection for junk (negative scores) regardless of discount
      if (score < 0) return null;

      if (!requireDiscount && sortBy !== "date" && price < 50 && score < 100)
        return null;

      return {
        original: p,
        display: {
          title: title || p.title,
          price: price as number,
          slug: p.slug,
          image: (p.imageUrl || p.image || "") as string,
          rating: p.rating || 0,
          ratingCount: p.reviewCount || 0,
          testRating: undefined,
          testCount: undefined,
          categoryName:
            p.category !== "uncategorized"
              ? allCategories[p.category as CategorySlug]?.singularName ||
                allCategories[p.category as CategorySlug]?.name
              : undefined,
          discountRate: discountRate > 0 ? discountRate : undefined,
          isBestseller: isProductBestseller(p),
          brand: p.brand || "Generic",
          variationAttributes: p.variationAttributes,
          parentAsin: p.parentAsin,
          groupKey, // Pass groupKey for global tracking
          pricesLastUpdated: p.pricesLastUpdated,
          id: p.id,
        },
        score,
        revenue,
        discountRate,
        category: p.category,
      };
    })
    .filter((item): item is CandidateItem => item !== null);

  // 5. Sort
  validCandidates.sort((a, b) => {
    if (sortBy === "revenue") return b.revenue - a.revenue;
    if (sortBy === "discount") return b.discountRate - a.discountRate;
    if (sortBy === "date") {
      const dateA = a.original.createdAt
        ? new Date(a.original.createdAt).getTime()
        : 0;
      const dateB = b.original.createdAt
        ? new Date(b.original.createdAt).getTime()
        : 0;
      return dateB - dateA;
    }
    return b.score - a.score; // Default "quality"
  });

  // 6. Deduplicate & Limit
  const seenAsins = new Set<string>();
  const seenParents = new Set<string>();
  const seenGroups = new Set<string>();
  const categoryCounts: Record<string, number> = {};
  const result: (DashboardProduct & { groupKey: string })[] = [];

  for (const item of validCandidates) {
    if (result.length >= maxItems) break;

    const p = item.original;
    const groupKey = item.display.groupKey!;

    if (seenAsins.has(p.asin)) continue;
    if (p.parentAsin && seenParents.has(p.parentAsin)) continue;
    if (seenGroups.has(groupKey)) continue;

    // Strict Category Limit
    const cat = p.category as string;
    const currentCatCount = categoryCounts[cat] || 0;
    if (currentCatCount >= categoryLimit) continue;

    // Add to result
    seenAsins.add(p.asin);
    if (p.parentAsin) seenParents.add(p.parentAsin);
    seenGroups.add(groupKey);
    categoryCounts[cat] = currentCatCount + 1;

    result.push(item.display as DashboardProduct & { groupKey: string });
  }

  return result;
}
