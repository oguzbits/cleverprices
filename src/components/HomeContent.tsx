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
import { cacheLife } from "next/cache";

export default async function HomeContent({
  country,
}: {
  country: CountryCode;
}) {
  cacheLife("dynamic" as any); // 5 minute revalidation for home page content
  const countryConfig = await getCountryByCode(country);
  const countryCode = countryConfig?.code || country;

  // Fetch enough data for curation with margin for filtering
  const [rawDeals, rawPopular, rawNew] = await Promise.all([
    getBestDeals(40, countryCode, "New"),
    getDiverseMostPopular(8, countryCode), // Candidates from every category
    getNewArrivals(100, countryCode, "New"),
  ]);

  // Global duplicate tracker across ALL sections
  const globalSeen = new Set<string>();
  const globalSeenParents = new Set<string>();
  const globalSeenGroups = new Set<string>();

  // Helper to update seen sets
  const markSeen = (items: any[]) => {
    items.forEach((p) => {
      globalSeen.add(p.slug);
      if (p.parentAsin) globalSeenParents.add(p.parentAsin);
      if (p.groupKey) globalSeenGroups.add(p.groupKey);
    });
  };

  // 1. Hero Section: "Revenue Kings"
  const heroProducts = curateProductList(rawPopular, countryCode, {
    maxItems: 5,
    minPrice: 200,
    sortBy: "revenue",
    categoryLimit: 1,
    excludeIds: globalSeen,
    excludeParentIds: globalSeenParents,
    excludeGroupKeys: globalSeenGroups,
  });
  markSeen(heroProducts);

  // 2. Bestsellers: "Volume Kings"
  const bestsellers = curateProductList(rawPopular, countryCode, {
    maxItems: 10,
    sortBy: "quality",
    categoryLimit: 1,
    excludeIds: globalSeen,
    excludeParentIds: globalSeenParents,
    excludeGroupKeys: globalSeenGroups,
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
    excludeGroupKeys: globalSeenGroups,
  }).map((p) => ({ ...p, badgeText: "Top Deal" }));
  markSeen(deals);

  // 4. New Arrivals
  const newArrivals = curateProductList(rawNew, countryCode, {
    maxItems: 12,
    sortBy: "date",
    categoryLimit: 2,
    excludeIds: globalSeen,
    excludeParentIds: globalSeenParents,
    excludeGroupKeys: globalSeenGroups,
  });

  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />

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
