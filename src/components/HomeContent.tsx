"use cache";

import { IdealoHomePage } from "@/components/landing/IdealoHomePage";
import {
  OrganizationSchema,
  WebSiteSchema,
} from "@/components/seo/ProductSchema";
import { type CountryCode } from "@/lib/countries";
import { curateProductList } from "@/lib/product-curation";
import { getCountryByCode } from "@/lib/server/cached-countries";
import {
  getBestDeals,
  getDiverseMostPopular,
  getNewArrivals,
} from "@/lib/server/cached-products";
import { getAmazonImageUrl } from "@/lib/utils/images";
import { cacheLife } from "next/cache";

export default async function HomeContent({
  country,
}: {
  country: CountryCode;
}) {
  cacheLife("static" as any);
  const countryConfig = await getCountryByCode(country);
  const countryCode = countryConfig?.code || country;

  // Fetch enough data for curation with margin for filtering
  const [rawDeals, rawPopular, rawNew] = await Promise.all([
    getBestDeals(40, countryCode, "New"),
    getDiverseMostPopular(8, countryCode), // Candidates from every category
    getNewArrivals(50, countryCode, "New"),
  ]);

  // Global duplicate tracker across ALL sections
  const globalSeen = new Set<string>();
  const globalSeenParents = new Set<string>();

  // Helper to update seen set
  const markSeen = (items: any[]) => {
    items.forEach((p) => {
      globalSeen.add(p.slug);
      if (p.parentAsin) globalSeenParents.add(p.parentAsin);
    });
  };

  // 1. Hero Section: "Revenue Kings"
  // High Price (>200€) + High Volume = The true market flagships (iPhones, GPUs, Consoles)
  const heroProducts = curateProductList(rawPopular, countryCode, {
    maxItems: 5,
    minPrice: 200,
    sortBy: "revenue",
    categoryLimit: 1,
    excludeIds: globalSeen,
    excludeParentIds: globalSeenParents,
  });
  markSeen(heroProducts);

  // 2. Bestsellers: "Volume Kings"
  const bestsellers = curateProductList(rawPopular, countryCode, {
    maxItems: 10,
    sortBy: "quality",
    categoryLimit: 1,
    excludeIds: globalSeen,
    excludeParentIds: globalSeenParents,
  });
  markSeen(bestsellers);

  // 3. Top Deals
  const deals = curateProductList(rawDeals, countryCode, {
    maxItems: 10,
    requireDiscount: true,
    sortBy: "quality",
    categoryLimit: 2,
    excludeIds: globalSeen,
    excludeParentIds: globalSeenParents,
  }).map((p) => ({ ...p, badgeText: "Top Deal" }));
  markSeen(deals);

  // 4. New Arrivals
  const newArrivals = curateProductList(rawNew, countryCode, {
    maxItems: 12,
    sortBy: "date",
    categoryLimit: 4, // Higher limit for new arrivals to fill the carousel better
    excludeIds: globalSeen,
    excludeParentIds: globalSeenParents,
  });

  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />

      {/* Performance: Preload first 2 hero images for immediate LCP improvement */}
      {heroProducts.slice(0, 2).map((p) =>
        p.image ? (
          <link
            key={p.slug}
            rel="preload"
            as="image"
            href={getAmazonImageUrl({
              src: p.image,
              width: 320,
              quality: 40,
              format: "webp",
            })}
            // @ts-ignore - fetchpriority is supported in modern browsers
            fetchpriority="high"
          />
        ) : null,
      )}

      <IdealoHomePage
        popular={heroProducts}
        deals={deals}
        bestsellers={bestsellers}
        newArrivals={newArrivals}
        country={countryCode}
      />
    </>
  );
}
