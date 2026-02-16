import { describe, expect, it } from "bun:test";
import {
  calculateProductDiscount,
  calculateProductMetrics,
  getOptimizedImageUrl,
  isProductBestseller,
  parseUnitValue,
} from "./products";

describe("products utility", () => {
  describe("parseUnitValue", () => {
    it("should parse numeric value from unit string", () => {
      expect(parseUnitValue("0.03€/GB")).toBe(0.03);
      expect(parseUnitValue("1.25$/TB")).toBe(1.25);
      expect(parseUnitValue("€15.50")).toBe(15.5);
    });

    it("should return Infinity for invalid or missing values", () => {
      expect(parseUnitValue(undefined)).toBe(Infinity);
      expect(parseUnitValue("")).toBe(Infinity);
      expect(parseUnitValue("no numbers")).toBe(Infinity);
    });
  });

  describe.skip("calculateProductMetrics", () => {
    it("should calculate price per unit for storage (GB)", () => {
      const product = {
        category: "ram", // Uses GB
        capacity: 32,
        capacityUnit: "GB",
        title: "Fast RAM",
      };
      const result = calculateProductMetrics(product, 160); // 160 / 32 GB
      expect(result.pricePerUnit).toBe(5);
    });

    it("should calculate price per unit for storage (TB)", () => {
      const product = {
        category: "ssds", // Uses TB
        capacity: 2000,
        capacityUnit: "GB",
        title: "Fast SSD",
      };
      const result = calculateProductMetrics(product, 200); // 200 / 2 TB
      expect(result.pricePerUnit).toBe(100);
    });

    it("should handle TB to GB conversion", () => {
      const product = {
        category: "hard-drives", // Uses TB
        capacity: 2,
        capacityUnit: "TB",
        title: "Big HDD",
      };
      const result = calculateProductMetrics(product, 200);
      expect(result.pricePerUnit).toBe(100);
    });

    it("should extract capacity from title if missing", () => {
      const product = {
        category: "ssds",
        title: "Samsung 980 Pro 2TB NVMe",
      };
      const result = calculateProductMetrics(product, 200);
      expect(result.normalizedCapacity).toBe(2000);
      expect(result.pricePerUnit).toBe(100);
    });

    it("should use German price if overridePrice is missing", () => {
      const product = {
        category: "ram",
        capacity: 16,
        capacityUnit: "GB",
        prices: { de: 80 },
      } as any;
      const result = calculateProductMetrics(product);
      expect(result.pricePerUnit).toBe(5); // 80 / 16
    });
  });

  describe("getOptimizedImageUrl", () => {
    it("should optimize Amazon image URLs", () => {
      const original =
        "https://m.media-amazon.com/images/I/71u9c6P-YpL._AC_SY600_.jpg";
      const optimized = getOptimizedImageUrl(original, 400);
      expect(optimized).toContain("._AC_SX400_");
      expect(optimized).not.toContain("._AC_SY600_");

      // Test with _SX2048_ pattern
      const large =
        "https://m.media-amazon.com/images/I/71u9c6P-YpL._SX2048_.jpg";
      const optimizedLarge = getOptimizedImageUrl(large, 400);
      expect(optimizedLarge).toContain("._AC_SX400_");

      // Test with multiple codes
      const complex =
        "https://m.media-amazon.com/images/I/71u9c6P-YpL._AC_SX200_SY400_.jpg";
      const optimizedComplex = getOptimizedImageUrl(complex, 500);
      expect(optimizedComplex).toContain("._AC_SX500_");
    });

    it("should return unchanged URL for non-Amazon images", () => {
      const url = "https://example.com/image.jpg";
      expect(getOptimizedImageUrl(url)).toBe(url);
    });
  });

  describe("calculateProductDiscount", () => {
    it("should calculate correct discount percentage", () => {
      const product = {
        prices: { de: 80 },
        priceAvg90: { de: 100 },
      };
      expect(calculateProductDiscount(product, "de")).toBe(20);
    });

    it("should return 0 if current price is higher than average", () => {
      const product = {
        prices: { de: 120 },
        priceAvg90: { de: 100 },
      };
      expect(calculateProductDiscount(product, "de")).toBe(0);
    });

    it("should return 0 for abnormal discounts (> 80%)", () => {
      const product = {
        prices: { de: 10 },
        priceAvg90: { de: 100 },
      };
      expect(calculateProductDiscount(product, "de")).toBe(0);
    });

    it("should NOT be affected by cheaper warehouse deals", () => {
      const product = {
        prices: { de: 80 },
        warehousePrices: { de: 40 }, // Extremely cheap warehouse deal
        priceAvg90: { de: 100 },
      };
      // Should still be based on the NEW price (80 vs 100 => 20%)
      expect(calculateProductDiscount(product, "de")).toBe(20);
    });

    it("should return 0 if new price is not a deal, even if used is a 'steal'", () => {
      const product = {
        prices: { de: 100 },
        usedPrices: { de: 50 },
        priceAvg90: { de: 100 },
      };
      // Used price (50) is 50% off avg (100), but we only care about new price (100)
      expect(calculateProductDiscount(product, "de")).toBe(0);
    });
  });

  describe("isProductBestseller", () => {
    it("should identify elite rank products as bestsellers", () => {
      const product = {
        salesRank: 150,
        rating: 4.5,
      };
      expect(isProductBestseller(product)).toBe(true);
    });

    it("should identify high volume products with good rating as bestsellers", () => {
      const product = {
        salesRank: 5000,
        monthlySold: 4000,
        rating: 4.2,
      };
      expect(isProductBestseller(product)).toBe(true);
    });

    it("should reject low quality products even with good rank", () => {
      const product = {
        salesRank: 50,
        rating: 3.2,
      };
      expect(isProductBestseller(product)).toBe(false);
    });
  });
});
