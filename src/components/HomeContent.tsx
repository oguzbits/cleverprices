import { IdealoHomePage } from "@/components/landing/IdealoHomePage";
import { type CountryCode } from "@/lib/countries";
import { getCountryByCode } from "@/lib/server/cached-countries";
import {
  getBestDeals,
  getMostPopular,
  getNewArrivals,
} from "@/lib/server/cached-products";
import {
  getLocalizedProductData,
  calculateProductMetrics,
} from "@/lib/utils/products";
import { allCategories, type CategorySlug } from "@/lib/categories";
import Script from "next/script";

export async function HomeContent({ country }: { country: CountryCode }) {
  const countryConfig = await getCountryByCode(country);
  const countryCode = countryConfig?.code || country;

  // Fetch more than needed to allow for deduplication and filtering
  const [rawDeals, rawPopular, rawNew] = await Promise.all([
    getBestDeals(30, countryCode),
    getMostPopular(50, countryCode),
    getNewArrivals(30, countryCode),
  ]);

  const seenAsins = new Set<string>();

  // Helper to transform to display format with category limiting
  const processList = (
    list: any[],
    maxItems: number,
    requireDiscount: boolean = false,
  ) => {
    const categoryCounts: Record<string, number> = {};
    const result: any[] = [];

    for (const p of list) {
      if (result.length >= maxItems) break;
      if (seenAsins.has(p.asin)) continue;

      const { price, title } = getLocalizedProductData(p, countryCode);
      if (price === null || price === 0) continue;

      // Calculate discount rate
      const avg90 = p.priceAvg90?.[countryCode];
      const discountRate =
        avg90 && avg90 > price
          ? Math.round(((avg90 - price) / avg90) * 100)
          : 0;

      // ============================================
      // QUALITY SCORE SYSTEM (0-100 points)
      // Rebalanced for initial population phase
      // ============================================
      let qualityScore = 0;

      // 1. Sales Rank Signal (0-25 points)
      if (p.salesRank && p.salesRank > 0) {
        if (p.salesRank < 100) qualityScore += 25;
        else if (p.salesRank < 1000) qualityScore += 20;
        else if (p.salesRank < 10000) qualityScore += 15;
        else if (p.salesRank < 50000) qualityScore += 10;
        else if (p.salesRank < 100000) qualityScore += 5;
      }

      // 2. Review Signal (0-15 points)
      if (p.reviewCount) {
        if (p.reviewCount > 1000) qualityScore += 12;
        else if (p.reviewCount > 500) qualityScore += 10;
        else if (p.reviewCount > 100) qualityScore += 8;
        else if (p.reviewCount > 50) qualityScore += 5;
      }
      if (p.rating && p.rating >= 4.5) qualityScore += 3;

      // 3. Discount Depth Signal (0-30 points) - INCREASED
      if (discountRate >= 70) qualityScore += 30;
      else if (discountRate >= 50) qualityScore += 25;
      else if (discountRate >= 30) qualityScore += 20;
      else if (discountRate >= 20) qualityScore += 15;
      else if (discountRate >= 10) qualityScore += 10;

      // 4. Price Tier Signal (0-30 points) - INCREASED
      // Higher prices = more interesting for comparison
      if (price >= 500) qualityScore += 30;
      else if (price >= 300) qualityScore += 25;
      else if (price >= 200) qualityScore += 20;
      else if (price >= 100) qualityScore += 15;
      else if (price >= 50) qualityScore += 10;

      // Quality gate: Require minimum score of 15/100
      // (Temporarily lowered during initial database population)
      // TODO: Raise to 40 once we have 10,000+ products with full metadata
      if (qualityScore < 15) continue;

      // Strict discount check for deals carousel
      if (requireDiscount && (!discountRate || discountRate <= 0)) continue;

      // Category diversity check (max 2 per category)
      const cat = p.category as string;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (categoryCounts[cat] > 2) continue;

      const enhanced = calculateProductMetrics(p, price);

      seenAsins.add(p.asin);
      result.push({
        title: title || p.title,
        price,
        slug: p.slug,
        image: p.image,
        rating: p.rating,
        ratingCount: p.reviewCount,
        testRating: p.testRating,
        testCount: p.testCount,
        categoryName:
          allCategories[p.category as CategorySlug]?.name || p.category,
        discountRate: discountRate > 0 ? discountRate : undefined,
        isBestseller:
          (p.salesRank && p.salesRank > 0 && p.salesRank < 20000) ||
          (p.reviewCount && p.reviewCount > 100),
      });
    }
    return result;
  };

  const popular = processList(rawPopular, 8);
  const bestsellers = processList(rawPopular, 10);
  const deals = processList(rawDeals, 10, true).map((p) => ({
    ...p,
    badgeText: "Top Deal",
  }));
  const newArrivals = processList(rawNew, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "cleverprices.com",
    url: "https://cleverprices.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://cleverprices.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <IdealoHomePage
        popular={popular}
        deals={deals}
        bestsellers={bestsellers}
        newArrivals={newArrivals}
      />
    </>
  );
}

export default HomeContent;
