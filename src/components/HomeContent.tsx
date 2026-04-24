import { IdealoHomePage } from "@/components/landing/IdealoHomePage";
import { type CountryCode } from "@/lib/countries";
import { curateProductList } from "@/lib/product-curation";
import { getCountryByCode } from "@/lib/server/cached-countries";
import {
  getBestDeals,
  getDiverseMostPopular,
  getNewArrivals,
} from "@/lib/server/cached-products";
import { getLivePricesForProducts as getPricesFromDb } from "@/lib/server/live-data";
import { cacheLife } from "next/cache";
import { CACHE_VERSION } from "@/lib/site-config";

async function fetchHomeData(countryCode: string) {
  "use cache";
  cacheLife("category");
  const _v = CACHE_VERSION;
  try {
    return await Promise.all([
      getBestDeals(40, countryCode, "New").catch(() => []),
      getDiverseMostPopular(8, countryCode).catch(() => []),
      getNewArrivals(100, countryCode, "New").catch(() => []),
    ]);
  } catch (error) {
    console.error("Critical error fetching home page data:", error);
    return [[], [], []];
  }
}

export default async function HomeContent({
  country,
}: {
  country: CountryCode;
}) {
  const countryConfig = await getCountryByCode(country);
  const countryCode = countryConfig?.code || country;

  // Fetch enough data for curation with margin for filtering
  const [rawDeals, rawPopular, rawNew] = await fetchHomeData(countryCode);
  console.log(
    `🏠 Home Data: Deals=${rawDeals.length}, Popular=${rawPopular.length}, New=${rawNew.length}`,
  );

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

  // SAFETY CHECK
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";

  if (
    heroProducts.length === 0 &&
    bestsellers.length === 0 &&
    deals.length === 0 &&
    newArrivals.length === 0 &&
    process.env.NODE_ENV === "production" &&
    !isBuild
  ) {
    console.error("Home page curated 0 products. DB empty or query timeout.");
    throw new Error(
      "Home page curated 0 products. Database might be empty or still syncing. Please reload in a few seconds.",
    );
  }

  // 5. Batch fetch live prices for all visible products
  const allHomeProductIds = [
    ...heroProducts.map((p) => p.id),
    ...bestsellers.map((p) => p.id),
    ...deals.map((p) => p.id),
    ...newArrivals.map((p) => p.id),
  ]
    .filter(Boolean)
    .filter((id) => typeof id === "number") as number[];

  const livePriceMap = await getPricesFromDb(allHomeProductIds, countryCode);

  // 6. Return curated data
  return (
    <div className="flex flex-col gap-6">
      <IdealoHomePage
        heroProducts={heroProducts}
        bestsellers={bestsellers}
        deals={deals}
        newArrivals={newArrivals}
        categories={[]} // Categories not handled here yet
        countryCode={countryCode}
        livePriceMap={livePriceMap}
      />
    </div>
  );
}
