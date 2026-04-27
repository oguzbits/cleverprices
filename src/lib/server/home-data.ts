import { cacheLife } from "next/dist/server/use-cache/cache-life";

import {
  getBestDeals,
  getDiverseMostPopular,
  getNewArrivals,
} from "@/lib/product-registry";

const CACHE_VERSION = "v212";

/**
 * Server-side data fetching for the homepage.
 * Complies with strict project rules by isolating "use cache" in the server layer.
 */
export async function fetchHomeData(countryCode: string) {
  "use cache";
  cacheLife("category");
  const _v = CACHE_VERSION;

  try {
    const [deals, popular, newArrivals] = await Promise.all([
      getBestDeals(40, countryCode, "New").catch((e: unknown) => {
        console.error("[Home Server] Deals fetch error:", e);
        return [];
      }),
      getDiverseMostPopular(12, countryCode).catch((e: unknown) => {
        console.error("[Home Server] Popular fetch error:", e);
        return [];
      }),
      getNewArrivals(100, countryCode, "New").catch((e: unknown) => {
        console.error("[Home Server] New Arrivals fetch error:", e);
        return [];
      }),
    ]);

    return [deals, popular, newArrivals];
  } catch (error) {
    console.error(
      "[Home Server] Critical error fetching home page data:",
      error,
    );
    return [[], [], []];
  }
}
