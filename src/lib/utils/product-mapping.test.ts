import { describe, expect, it, mock } from "bun:test";

// 1. Setup Mocks for dependencies
mock.module("../product-families", () => ({
  getFamilyIdentity: (p: any) => ({
    slug: `canonical-${p.id || 0}`,
    title: p.title,
    brand: p.brand,
  }),
}));

mock.module("./products", () => ({
  calculateProductMetrics: (p: any) => p, // Passthrough for testing mapping
}));

mock.module("../history-compression", () => ({
  parseHistoryBlob: (data: any) => {
    try {
      const str = typeof data === "string" ? data : data.toString();
      return JSON.parse(str);
    } catch {
      return {};
    }
  },
}));

import { mapDbProduct, parseHistoryJson } from "./product-mapping";

const createMockDbProduct = (overrides: Partial<any> = {}): any => ({
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
});

const createMockPrice = (overrides: Partial<any> = {}): any => ({
  productId: 1,
  country: "de",
  price: 99.99,
  currency: "EUR",
  lastUpdated: new Date().getTime(),
  ...overrides,
});

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

    it("should strip heavy data when requested", () => {
      const dbProd = createMockDbProduct();
      const price = createMockPrice({
        historyJson: JSON.stringify({ "2024": 100 }),
      });

      const result = mapDbProduct(dbProd, [price], [], true); // Strip

      expect(result.priceHistory).toEqual([]);
      expect(result.affiliateUrl).toBe("");
    });

    it("should correctly fall back to brand prefix for brand name", () => {
      const dbProd = createMockDbProduct({ brand: null });
      const price = createMockPrice();
      const result = mapDbProduct(dbProd, [price]);
      expect(result.brand).toBe("Generic");
    });
  });
});
