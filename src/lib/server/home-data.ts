import { cacheLife } from "next/cache";

import { dbReady } from "@/db";
import {
  fetchDeals as getBestDeals,
  fetchDiversePopular as getDiverseMostPopular,
  fetchNewArrivals as getNewArrivals,
} from "@/lib/product-registry";

import { CACHE_VERSION } from "../site-config";
import { assertSerializable, serializeSafe } from "../utils/serialization";

/**
 * Server-side data fetching for the homepage.
 * Complies with strict project rules by isolating "use cache" in the server layer.
 */
export async function fetchHomeData(countryCode: string) {
  "use cache";
  cacheLife("category");
  const _v = CACHE_VERSION;

  await dbReady;

  try {
    console.log(`[Home Server] Fetching home data for ${countryCode}...`);
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

    console.log(
      `[Home Server] Found: deals=${deals.length}, popular=${popular.length}, new=${newArrivals.length}`,
    );

    return serializeSafe(
      assertSerializable(
        [deals.slice(0, 20), popular, newArrivals],
        "fetchHomeData",
      ),
    );
  } catch (error) {
    console.error(
      "[Home Server] Critical error fetching home page data:",
      error,
    );
    return [[], [], []];
  }
}
