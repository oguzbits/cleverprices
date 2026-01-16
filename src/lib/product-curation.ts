import { type Product } from "./product-registry";
import {
  getLocalizedProductData,
  calculateProductMetrics,
} from "./utils/products";
import { allCategories, type CategorySlug } from "./categories";
import { calculateDesirabilityScore } from "./server/scoring";

export interface DashboardProduct {
  title: string;
  price: number;
  slug: string;
  image: string;
  rating: number;
  ratingCount: number;
  testRating?: number;
  testCount?: number;
  categoryName: string;
  discountRate?: number;
  isBestseller: boolean;
  variationAttributes?: any;
  badgeText?: string;
  parentAsin?: string;
  brand: string;
  pricesLastUpdated?: Record<string, string>;
}

interface CurationOptions {
  maxItems?: number;
  categoryLimit?: number; // Strict limit per category
  minPrice?: number; // Filter out cheap items (e.g. for Hero section)
  sortBy?: "revenue" | "quality" | "discount"; // Sorting strategy
  requireDiscount?: boolean;
  excludeIds?: Set<string>;
  excludeParentIds?: Set<string>;
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
  const excludeIds = options.excludeIds || new Set<string>();
  const excludeParentIds = options.excludeParentIds || new Set<string>();

  const validCandidates: CandidateItem[] = list
    .map((p): CandidateItem | null => {
      // 1. Basic Data Integrity
      if (p.condition !== "New") return null;
      if (!p.image) return null;
      const imageUrl = p.image;
      if (excludeIds.has(p.slug)) return null;
      if (p.parentAsin && excludeParentIds.has(p.parentAsin)) return null;

      const { price, title } = getLocalizedProductData(p, countryCode);
      if (!price || price <= 0) return null;
      if (price < minPrice) return null;

      // 2. Discount Calculation (Safe)
      // No fallback to listPrice to avoid fake discounts
      const avg90 = p.priceAvg90?.[countryCode] || p.priceAvg30?.[countryCode];
      let discountRate = 0;
      if (avg90 && avg90 > price) {
        discountRate = Math.round(((avg90 - price) / avg90) * 100);
      }
      // Sanity check for bad data
      if (discountRate > 80) discountRate = 0;

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
      // Filter out low-effort junk unless requested
      // RELAXED: If it's a deal, we're more lenient
      if (!requireDiscount && price < 50 && score < 100) return null;

      return {
        original: p,
        display: {
          title: title || p.title,
          price,
          slug: p.slug,
          image: imageUrl,
          rating: p.rating || 0,
          ratingCount: p.reviewCount || 0,
          testRating: undefined,
          testCount: undefined,
          categoryName:
            allCategories[p.category as CategorySlug]?.name || p.category,
          discountRate: discountRate > 0 ? discountRate : undefined,
          isBestseller: !!(
            p.salesRank &&
            p.salesRank > 0 &&
            p.salesRank < 5000
          ),
          brand: p.brand || "Generic",
          variationAttributes: p.variationAttributes,
          parentAsin: p.parentAsin,
          pricesLastUpdated: p.pricesLastUpdated,
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
    return b.score - a.score; // Default "quality"
  });

  // 6. Deduplicate & Limit
  const seenAsins = new Set<string>();
  const seenParents = new Set<string>();
  const categoryCounts: Record<string, number> = {};
  const result: DashboardProduct[] = [];

  for (const item of validCandidates) {
    if (result.length >= maxItems) break;

    const p = item.original;
    if (seenAsins.has(p.asin)) continue;
    if (p.parentAsin && seenParents.has(p.parentAsin)) continue;

    // Strict Category Limit
    const cat = p.category as string;
    const currentCatCount = categoryCounts[cat] || 0;
    if (currentCatCount >= categoryLimit) continue;

    // Add to result
    seenAsins.add(p.asin);
    if (p.parentAsin) seenParents.add(p.parentAsin);
    categoryCounts[cat] = currentCatCount + 1;

    result.push(item.display);
  }

  return result;
}
