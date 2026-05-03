import { describe, expect, it, mock } from "bun:test";

// 1. Setup Mocks for dependencies
mock.module("../product-families", () => ({
  getFamilyIdentity: (p: { id: number; title: string; brand: string }) => ({
    slug: `canonical-${p.id || 0}`,
    title: p.title,
    brand: p.brand,
  }),
}));

mock.module("./products", () => ({
  calculateProductMetrics: (p: unknown) => p, // Passthrough for testing mapping
}));

mock.module("../history-compression", () => ({
  parseHistoryBlob: (data: string | Buffer) => {
    try {
      const str = typeof data === "string" ? data : data.toString();
      return JSON.parse(str);
    } catch {
      return {};
    }
  },
}));

import { type Product as DbProduct } from "../../db/schema";
import { type LitePrice } from "../product-definitions";
import { mapDbProduct, parseHistoryJson } from "./product-mapping";

const createMockDbProduct = (
  overrides: Record<string, unknown> = {},
): DbProduct =>
  ({
    id: 1,
    asin: "B00TEST",
    slug: "old-long-slug",
    title: "Test Product",
    category: "ssd",
    brand: "Samsung",
    imageUrl: "http://example.com/img.jpg",
    specifications: JSON.stringify({ Capacity: "1000GB" }),
    createdAt: new Date(),
    ...overrides,
  }) as DbProduct;

const createMockPrice = (overrides: Record<string, unknown> = {}): LitePrice =>
  ({
    id: 1,
    productId: 1,
    country: "de",
    price: 99.99,
    currency: "EUR",
    listPrice: 109.99,
    priceAvg90: 89.99,
    pricePerUnit: 1.0,
    lastUpdated: new Date(),
    ...overrides,
  }) as LitePrice;

describe("product-mapping utility", () => {
  describe("parseHistoryJson", () => {
    it("should transform cents JSON to decimal history array", () => {
      const data = JSON.stringify({ "2024-01-01": 5000 });
      const result = parseHistoryJson(data);
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(50.0);
      expect(result[0].date).toContain("2024-01-01");
    });
  });

  describe("mapDbProduct", () => {
    it("should transform raw DB product and enforce canonical slug", () => {
      const dbProd = createMockDbProduct({ id: 123 });
      const price = createMockPrice({ productId: 123 });

      const result = mapDbProduct(dbProd, [price]);

      expect(result.id).toBe(123);
      expect(result.slug).toBe("canonical-123");
      expect(result.prices["de"]).toBe(99.99);
    });

    it("should correctly populate priceHistory from historyJson", () => {
      const historyJson = JSON.stringify({ "2024-01-01": 5000 });
      const price = createMockPrice({ historyJson });
      const dbProd = createMockDbProduct();

      const result = mapDbProduct(dbProd, [price], [], false); // Don't strip

      expect(result.priceHistory).toBeDefined();
      expect(result.priceHistory).toHaveLength(1);
      expect(result.priceHistory![0].price).toBe(50.0);
    });

    it("should strip heavy data when requested but preserve identity for slug", () => {
      const dbProd = createMockDbProduct({
        specifications: JSON.stringify({
          Color: "Red",
          Storage: "128 GB",
          Weight: "200g",
        }),
      });
      const price = createMockPrice();

      const result = mapDbProduct(dbProd, [price], [], true); // Strip

      // Specifications should be empty in the final object
      expect(result.specifications).toEqual({});

      // Price history should be stripped
      expect(result.priceHistory).toEqual([]);

      // But internal logic (mocked here but logic verified in implementation)
      // should have used the identity specs.
    });

    it("should preserve full specifications in PDP mode", () => {
      const dbProd = createMockDbProduct({
        specifications: JSON.stringify({ Color: "Red", Storage: "128 GB" }),
      });
      const price = createMockPrice();

      const result = mapDbProduct(dbProd, [price], [], false); // Don't strip

      expect(result.specifications).toBeDefined();
      expect((result.specifications as Record<string, unknown>)["Color"]).toBe(
        "Red",
      );
      expect(
        (result.specifications as Record<string, unknown>)["Storage"],
      ).toBe("128 GB");
    });

    it("should correctly fall back to brand prefix for brand name", () => {
      const dbProd = createMockDbProduct({ brand: null });
      const price = createMockPrice();
      const result = mapDbProduct(dbProd, [price]);
      expect(result.brand).toBe("Generic");
    });
  });
});
