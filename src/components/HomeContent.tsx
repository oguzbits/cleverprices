import { IdealoHomePage } from "@/components/landing/IdealoHomePage";
import type { LivePriceData } from "@/components/landing/IdealoProductCard";
import { ServerBusy } from "@/components/ui/ServerBusy";
import { DatabaseBusyError } from "@/db/utils";
import { type CountryCode } from "@/lib/countries";
import { curateProductList } from "@/lib/product-curation";
import { getCountryByCode } from "@/lib/server/cached-countries";
import { getCachedLivePrices } from "@/lib/server/cached-products";
import { fetchHomeData } from "@/lib/server/home-data";

export default async function HomeContent({
  country,
}: {
  country: CountryCode;
}) {
  const countryConfig = await getCountryByCode(country);
  const countryCode = countryConfig?.code || country;

  const homeData = await (async () => {
    try {
      // Fetch enough data for curation with margin for filtering
      const [rawDeals, rawPopular, rawNew] = await fetchHomeData(countryCode);
      return { rawDeals, rawPopular, rawNew, isBusy: false };
    } catch (error: any) {
      if (
        error instanceof DatabaseBusyError ||
        error?.name === "DatabaseBusyError"
      ) {
        return { isBusy: true, rawDeals: [], rawPopular: [], rawNew: [] };
      }
      throw error;
    }
  })();

  if (homeData.isBusy) return <ServerBusy />;

  const { rawDeals, rawPopular, rawNew } = homeData;

  console.log(
    `🏠 Home Data: Deals=${rawDeals.length}, Popular=${rawPopular.length}, New=${rawNew.length}`,
  );

  // Global duplicate tracker across ALL sections
  const globalSeen = new Set<string>();
  const globalSeenParents = new Set<string>();
  const globalSeenGroups = new Set<string>();

  // Helper to update seen sets
  const markSeen = (
    items: { slug: string; parentAsin?: string; groupKey?: string }[],
  ) => {
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
    !isBuild
  ) {
    console.warn("Home page curated 0 products. DB empty or query timeout.");
    return (
      <ServerBusy
        title="Willkommen bei CleverPrices"
        message="Wir aktualisieren gerade unsere Angebote. Bitte schauen Sie in Kürze wieder vorbei."
      />
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

  let livePriceMap = new Map<number, LivePriceData>();
  try {
    const priceRecord = await getCachedLivePrices(
      allHomeProductIds,
      countryCode,
    );
    livePriceMap = new Map(
      Object.entries(priceRecord).map(([id, data]) => [Number(id), data]),
    ) as any;
  } catch (error: any) {
    if (
      error instanceof DatabaseBusyError ||
      error?.name === "DatabaseBusyError"
    ) {
      return (
        <ServerBusy
          title="Willkommen bei CleverPrices"
          message="Wir aktualisieren gerade unsere Angebote. Bitte schauen Sie in Kürze wieder vorbei."
        />
      );
    }
    throw error;
  }

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
