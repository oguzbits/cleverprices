import { describe, expect, it, mock } from "bun:test";

import { type Product } from "../product-definitions";
import { mergeLivePrices } from "./live-data";

// Mock dependencies
mock.module("../../db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () =>
          Promise.resolve([
            {
              productId: 1,
              country: "de",
              price: 88.88,
              usedPrice: 77.77,
              warehousePrice: 66.66,
              lastUpdated: new Date().toISOString(),
            },
          ]),
      }),
    }),
  },
}));

mock.module("../../db/utils", () => ({
  withRetry: (fn: () => unknown) => fn(),
}));

describe("live-data / mergeLivePrices", () => {
  it("should merge live prices and populate the singular price property", async () => {
    const products: Product[] = [
      {
        id: 1,
        title: "Test Product",
        slug: "test-product",
        prices: { de: 99.99 },
        condition: "New",
      } as unknown as Product,
    ];

    const result = await mergeLivePrices(products, "de");

    expect(result[0].prices["de"]).toBe(88.88);
    expect(result[0].price).toBe(88.88);
    expect(result[0].usedPrices?.["de"]).toBe(77.77);
  });
});
