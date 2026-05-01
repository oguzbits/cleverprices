import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";

import { DEFAULT_COUNTRY } from "@/lib/countries";
import {
  litePriceColumns,
  liteProductColumns,
  Product,
} from "@/lib/product-definitions";
import { mapDbProduct } from "@/lib/utils/product-mapping";
import { db, IS_BUILD } from "../../db";
import { prices, products, type Product as DbProduct } from "../../db/schema";

/**
 * Get all deal products across all categories using a highly optimized two-step query.
 * "Deal" is determined by price drop compared to 90-day average.
 *
 * LEAN SCHEMA: Uses consolidated `price` column instead of amazonPrice/newPrice.
 */
export async function getAllDeals(
  limit: number = 24,
  countryCode: string = DEFAULT_COUNTRY,
): Promise<Product[]> {
  if (IS_BUILD) return [];

  // 1. Fetch top deal IDs directly in SQL (Much faster than fetching 50k+ rows)
  const priceRows = await db
    .select({
      productId: prices.productId,
      price: prices.price,
      priceAvg90: prices.priceAvg90,
    })
    .from(prices)
    .where(
      and(
        eq(prices.country, countryCode),
        gt(prices.priceAvg90, 0),
        gt(prices.price, 0),
        // Filter: only items where current price is 5% to 80% lower than 90d avg
        sql`${prices.price} < ${prices.priceAvg90} * 0.95`,
        sql`${prices.price} >= ${prices.priceAvg90} * 0.2`,
      ),
    )
    .orderBy(
      desc(
        sql`(CAST(${prices.priceAvg90} AS FLOAT) - ${prices.price}) / ${prices.priceAvg90}`,
      ),
    )
    .limit(limit);

  const topDealIds = priceRows.map((p) => p.productId);

  if (topDealIds.length === 0) return [];

  // 3. Fetch full product data only for the top deals
  const results = await db
    .select({
      product: liteProductColumns,
      price: litePriceColumns,
    })
    .from(products)
    .innerJoin(prices, eq(products.id, prices.productId))
    .where(
      and(eq(prices.country, countryCode), inArray(products.id, topDealIds)),
    );

  // 4. Restore the correct deal descending order
  const orderMap = new Map(topDealIds.map((id, index) => [id, index]));
  results.sort((a, b) => {
    const indexA = orderMap.get(a.product.id) ?? 9999;
    const indexB = orderMap.get(b.product.id) ?? 9999;
    return indexA - indexB;
  });

  return results.map((r) =>
    mapDbProduct(r.product as unknown as DbProduct, [r.price], [], true),
  );
}
