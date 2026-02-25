import { db, dbReady, IS_BUILD } from "@/db";
import { prices, products } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { withRetry } from "../../db/utils";
import {
  filteringProductColumns,
  litePriceColumns,
  liteProductColumns,
  superLitePriceColumns,
  type Product,
} from "../product-definitions";
import { CATEGORY_REVALIDATE_SECONDS } from "../site-config";
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

export const getProductsByCategory = cache(async function getProductsByCategory(
  category: string,
  stripHeavyData: boolean = true,
  limit?: number,
  collapseFamilies: boolean = false,
): Promise<Product[]> {
  if (IS_BUILD || !category) return [];
  const fetchProducts = async () => {
    await dbReady;
    const { prods, prs } = await withRetry(async () => {
      let query = db
        .select(liteProductColumns)
        .from(products)
        .where(eq(products.category, category));

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

  const isScript =
    typeof globalThis === "undefined" ||
    (!(globalThis as any).__incrementalCache && !process.env.NEXT_RUNTIME);
  if (isScript) return fetchProducts();

  return unstable_cache(
    fetchProducts,
    [`category-products-v34-${category}-${stripHeavyData}-${limit || "all"}`],
    {
      revalidate: CATEGORY_REVALIDATE_SECONDS,
      tags: ["category-products", `cat-${category}`, "v48"],
    },
  )();
});

export const getRawProductsByCategory = cache(
  async function getRawProductsByCategory(
    category: string,
    countryCode: string = "de",
    limit: number = 2000,
  ) {
    if (IS_BUILD || !category) return [];

    const fetchProducts = async () => {
      await dbReady;
      const { prods, prs } = await withRetry(async () => {
        const prods = await db
          .select(filteringProductColumns)
          .from(products)
          .where(eq(products.category, category))
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

    const isScript =
      typeof globalThis === "undefined" ||
      (!(globalThis as any).__incrementalCache && !process.env.NEXT_RUNTIME);
    if (isScript) return fetchProducts();

    return unstable_cache(
      fetchProducts,
      [`raw-category-products-v1-${category}-${countryCode}-${limit}`],
      {
        revalidate: CATEGORY_REVALIDATE_SECONDS,
        tags: ["category-products", `cat-${category}`, "v60"],
      },
    )();
  },
);

export const getProductsByIds = cache(async function getProductsByIds(
  ids: number[],
  countryCode: string = "de",
  stripHeavyData: boolean = true,
): Promise<Product[]> {
  if (IS_BUILD || !ids || ids.length === 0) return [];
  const fetchProducts = async () => {
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
  };

  const isScript =
    typeof globalThis === "undefined" ||
    (!(globalThis as any).__incrementalCache && !process.env.NEXT_RUNTIME);
  if (isScript) return fetchProducts();

  return unstable_cache(
    fetchProducts,
    [`products-by-ids-v1-${ids.join(",")}-${countryCode}`],
    {
      revalidate: CATEGORY_REVALIDATE_SECONDS,
      tags: ["products-by-ids", ...ids.map((id) => `prod-${id}`)],
    },
  )();
});
