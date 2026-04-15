import { db, dbReady, IS_BUILD } from "@/db";
import { prices, products } from "@/db/schema";
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { cache } from "react";
import { withRetry } from "../../db/utils";
import {
  filteringProductColumns,
  litePriceColumns,
  liteProductColumns,
  superLitePriceColumns,
  type Product,
} from "../product-definitions";
import { mapDbProduct } from "../utils/product-mapping";

/**
 * Helper: Index an array of prices by productId for O(1) lookups.
 */
export function indexPricesById<T extends { productId: number }>(
  pricesList: T[],
): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const pr of pricesList) {
    if (!map.has(pr.productId)) map.set(pr.productId, []);
    map.get(pr.productId)!.push(pr);
  }
  return map;
}

/**
 * [CONSISTENCY FIX] Ensures that listing views see the same siblings as the product page.
 */
export async function enrichWithFullSiblings(
  prods: any[],
  pricesByProduct: Map<number, any[]>,
  countryCode: string,
  stripHeavyData: boolean = true,
  collapseFamilies: boolean = false,
): Promise<Product[]> {
  if (prods.length === 0) return [];

  const parentAsins = [
    ...new Set(prods.map((p) => p.parentAsin).filter(Boolean)),
  ];

  let allSiblings: any[] = [];
  if (parentAsins.length > 0) {
    allSiblings = await db
      .select(liteProductColumns)
      .from(products)
      .where(inArray(products.parentAsin, parentAsins as string[]));
  }

  const siblingsByParent = new Map<string, any[]>();
  const allSiblingIds = allSiblings.map((s) => s.id);

  const allSiblingPrices =
    allSiblingIds.length > 0
      ? await withRetry(() =>
          db
            .select(superLitePriceColumns)
            .from(prices)
            .where(
              and(
                inArray(prices.productId, allSiblingIds),
                eq(prices.country, countryCode),
              ),
            ),
        )
      : [];

  const pricesBySiblingId = indexPricesById(allSiblingPrices);

  for (const s of allSiblings) {
    if (s.parentAsin) {
      if (!siblingsByParent.has(s.parentAsin))
        siblingsByParent.set(s.parentAsin, []);

      const nodePrices = pricesBySiblingId.get(s.id!) || [];
      const mappedSibling = {
        ...s,
        prices:
          nodePrices.length > 0
            ? Object.fromEntries(nodePrices.map((pr) => [pr.country, pr.price]))
            : {},
      };
      siblingsByParent.get(s.parentAsin)!.push(mappedSibling);
    }
  }

  const { getFamilyRepresentative } = await import("../product-families");

  const seenFamilies = new Set<string>();
  const results: Product[] = [];

  for (const p of prods) {
    const familyKey = p.parentAsin || `singleton-${p.id}`;

    if (collapseFamilies) {
      if (seenFamilies.has(familyKey)) continue;
      seenFamilies.add(familyKey);

      const siblings = p.parentAsin
        ? siblingsByParent.get(p.parentAsin) || [p]
        : [p];

      const representative = getFamilyRepresentative(siblings) || p;

      const repPrices =
        pricesByProduct.get(representative.id!) ||
        pricesBySiblingId.get(representative.id!) ||
        [];

      results.push(
        mapDbProduct(
          representative,
          repPrices,
          siblingsByParent.get(representative.parentAsin!) || [],
          stripHeavyData,
        ),
      );
    } else {
      const prs = pricesByProduct.get(p.id!) || [];
      results.push(
        mapDbProduct(
          p,
          prs,
          siblingsByParent.get(p.parentAsin!) || [],
          stripHeavyData,
        ),
      );
    }
  }

  return results;
}

export async function getProductsByCategory(
  category: string,
  stripHeavyData: boolean = true,
  limit?: number,
  collapseFamilies: boolean = false,
): Promise<Product[]> {
  const isScript =
    typeof globalThis === "undefined" ||
    (!(globalThis as any).__incrementalCache && !process.env.NEXT_RUNTIME);

  if (isScript || IS_BUILD || !category) {
    if (IS_BUILD || !category) return [];

    // Direct sync execution for scripts/build
    await dbReady;
    const { prods, prs } = await withRetry(async () => {
      let query = db
        .select(liteProductColumns)
        .from(products)
        .where(
          and(eq(products.category, category), isNotNull(products.imageUrl)),
        );

      if (limit) {
        // @ts-ignore
        query = query.orderBy(asc(products.salesRank)).limit(limit);
      }

      const prods = await query;
      if (prods.length === 0) return { prods: [], prs: [] };

      const ids = prods.map((p) => p.id);
      const prs = await db
        .select(litePriceColumns)
        .from(prices)
        .where(inArray(prices.productId, ids));

      return { prods, prs };
    });

    if (prods.length === 0) return [];
    const pricesByProduct = indexPricesById(prs);
    return enrichWithFullSiblings(
      prods,
      pricesByProduct,
      "de",
      stripHeavyData,
      collapseFamilies,
    );
  }

  const cachedFetch = async () => {
    "use cache";
    cacheLife("category");

    await dbReady;
    const { prods, prs } = await withRetry(async () => {
      let query = db
        .select(liteProductColumns)
        .from(products)
        .where(
          and(eq(products.category, category), isNotNull(products.imageUrl)),
        );

      if (limit) {
        // @ts-ignore
        query = query.orderBy(asc(products.salesRank)).limit(limit);
      }

      const prods = await query;
      if (prods.length === 0) return { prods: [], prs: [] };

      const ids = prods.map((p) => p.id);
      const prs = await db
        .select(litePriceColumns)
        .from(prices)
        .where(inArray(prices.productId, ids));

      return { prods, prs };
    });

    if (prods.length === 0) return [];
    const pricesByProduct = indexPricesById(prs);
    return enrichWithFullSiblings(
      prods,
      pricesByProduct,
      "de",
      stripHeavyData,
      collapseFamilies,
    );
  };

  return cachedFetch();
}

export async function getRawProductsByCategory(
  category: string,
  countryCode: string = "de",
  limit: number = 2000,
) {
  const isScript =
    typeof globalThis === "undefined" ||
    (!(globalThis as any).__incrementalCache && !process.env.NEXT_RUNTIME);

  if (isScript || IS_BUILD || !category) {
    if (IS_BUILD || !category) return [];
    await dbReady;
    const { prods, prs } = await withRetry(async () => {
      const prods = await db
        .select(filteringProductColumns)
        .from(products)
        .where(
          and(eq(products.category, category), isNotNull(products.imageUrl)),
        )
        .orderBy(asc(products.salesRank))
        .limit(limit);

      if (prods.length === 0) return { prods: [], prs: [] };

      const foundIds = prods.map((p) => p.id);
      const prs = await db
        .select(superLitePriceColumns)
        .from(prices)
        .where(
          and(
            inArray(prices.productId, foundIds),
            eq(prices.country, countryCode),
          ),
        );

      return { prods, prs };
    });

    if (prods.length === 0) return [];

    const pricesByProduct = new Map<number, any>();
    prs.forEach((pr) => pricesByProduct.set(pr.productId, pr));

    return prods.map((p) => {
      const live = pricesByProduct.get(p.id);
      const code = countryCode.toLowerCase();
      return {
        ...p,
        prices: { [code]: live?.price || 0 },
        usedPrices: { [code]: live?.usedPrice || 0 },
        warehousePrices: { [code]: live?.warehousePrice || 0 },
        priceAvg90: { [code]: live?.priceAvg90 || 0 },
        pricePerUnit: { [code]: live?.pricePerUnit || 0 },
        pricesLastUpdated: { [code]: live?.lastUpdated },
      };
    });
  }

  const cachedFetch = async () => {
    "use cache";
    cacheLife("category");
    const _v = "v207";

    await dbReady;
    const { prods, prs } = await withRetry(async () => {
      const prods = await db
        .select(filteringProductColumns)
        .from(products)
        .where(
          and(eq(products.category, category), isNotNull(products.imageUrl)),
        )
        .orderBy(asc(products.salesRank))
        .limit(limit);

      if (prods.length === 0) return { prods: [], prs: [] };

      const foundIds = prods.map((p) => p.id);
      const prs = await db
        .select(superLitePriceColumns)
        .from(prices)
        .where(
          and(
            inArray(prices.productId, foundIds),
            eq(prices.country, countryCode),
          ),
        );

      return { prods, prs };
    });

    if (prods.length === 0) return [];

    const pricesByProduct = new Map<number, any>();
    prs.forEach((pr) => pricesByProduct.set(pr.productId, pr));

    return prods.map((p) => {
      const live = pricesByProduct.get(p.id);
      const code = countryCode.toLowerCase();
      return {
        ...p,
        prices: { [code]: live?.price || 0 },
        usedPrices: { [code]: live?.usedPrice || 0 },
        warehousePrices: { [code]: live?.warehousePrice || 0 },
        priceAvg90: { [code]: live?.priceAvg90 || 0 },
        pricePerUnit: { [code]: live?.pricePerUnit || 0 },
        pricesLastUpdated: { [code]: live?.lastUpdated },
      };
    });
  };

  return cachedFetch();
}

async function fetchProductsByIdsInternal(
  ids: number[],
  countryCode: string = "de",
  stripHeavyData: boolean = true,
): Promise<Product[]> {
  await dbReady;
  const { prods, prs } = await withRetry(async () => {
    const prods = await db
      .select(liteProductColumns)
      .from(products)
      .where(inArray(products.id, ids));

    if (prods.length === 0) return { prods: [], prs: [] };

    const foundIds = prods.map((p) => p.id);
    const prs = await db
      .select(litePriceColumns)
      .from(prices)
      .where(
        and(
          inArray(prices.productId, foundIds),
          eq(prices.country, countryCode),
        ),
      );

    return { prods, prs };
  });

  if (prods.length === 0) return [];
  const pricesByProduct = indexPricesById(prs);
  return enrichWithFullSiblings(
    prods,
    pricesByProduct,
    countryCode,
    stripHeavyData,
  );
}

export const getProductsByIds = cache(async function getProductsByIds(
  ids: number[],
  countryCode: string = "de",
  stripHeavyData: boolean = true,
): Promise<Product[]> {
  if (IS_BUILD || !ids || ids.length === 0) return [];

  const isScript =
    typeof globalThis === "undefined" ||
    (!(globalThis as any).__incrementalCache && !process.env.NEXT_RUNTIME);

  if (isScript) {
    return fetchProductsByIdsInternal(ids, countryCode, stripHeavyData);
  }

  const cachedFetch = async (
    targetIds: number[],
    code: string,
    strip: boolean,
  ) => {
    "use cache";
    cacheLife("product_v3");
    const _v = "v207";
    return fetchProductsByIdsInternal(targetIds, code, strip);
  };

  return cachedFetch(ids, countryCode, stripHeavyData);
});
