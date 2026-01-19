import { db } from "@/db";
import { prices, products } from "@/db/schema";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import {
  Product,
  litePriceColumns,
  liteProductColumns,
  mapDbProduct,
} from "@/lib/product-registry";
import { CATEGORY_REVALIDATE_SECONDS } from "@/lib/site-config";
import { and, desc, eq, gt, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * Get all deal products across all categories using a highly optimized single query.
 * "Deal" is determined by price drop compared to 90-day average.
 */
export const getAllDeals = unstable_cache(
  async (
    limit: number = 24,
    countryCode: string = DEFAULT_COUNTRY,
  ): Promise<Product[]> => {
    // Use a direct database query to find deals across all categories.
    // This is MUCH faster than fetching products from every category individually.
    const results = await db
      .select({
        product: liteProductColumns,
        price: litePriceColumns,
      })
      .from(products)
      .innerJoin(prices, eq(products.id, prices.productId))
      .where(
        and(
          eq(prices.country, countryCode),
          gt(prices.priceAvg90, 0),
          or(gt(prices.amazonPrice, 0), gt(prices.newPrice, 0)),
          // Only show products where current price is significantly lower than 90d average
          sql`(${prices.priceAvg90} - COALESCE(${prices.amazonPrice}, ${prices.newPrice})) / ${prices.priceAvg90} > 0`,
        ),
      )
      .orderBy(
        desc(
          sql`(${prices.priceAvg90} - COALESCE(${prices.amazonPrice}, ${prices.newPrice})) / ${prices.priceAvg90}`,
        ),
      )
      .limit(limit);

    return results.map((r) =>
      mapDbProduct(r.product as any, [r.price], [], true),
    );
  },
  ["all-deals-v2"],
  {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["products", "deals"],
  },
);
