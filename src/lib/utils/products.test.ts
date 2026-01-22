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

  describe("calculateProductMetrics", () => {
    it("should calculate price per unit for storage", () => {
      const product = {
        category: "ssd",
        capacity: 1000,
        capacityUnit: "GB",
        title: "Fast SSD",
      };
      const result = calculateProductMetrics(product, 100); // 100 / 1000 GB
      expect(result.pricePerUnit).toBe(0.1);
    });

    it("should handle TB to GB conversion", () => {
      const product = {
        category: "hard-drives",
        capacity: 2,
        capacityUnit: "TB",
        title: "Big HDD",
      };
      // 2TB. category config for 'hard-drives' uses unitType: 'TB'
      // Price 200 / 2 TB = 100 per TB
      const result = calculateProductMetrics(product, 200);
      expect(result.pricePerUnit).toBe(100);
    });

    it("should extract capacity from title if missing", () => {
      const product = {
        category: "ssds", // uses unitType: 'TB'
        title: "Samsung 980 Pro 2TB NVMe",
      };
      const result = calculateProductMetrics(product, 200);
      expect(result.normalizedCapacity).toBe(2000);
      expect(result.pricePerUnit).toBe(100);
    });

    it("should handle CPU cores", () => {
      const product = {
        category: "cpu",
        title: "Intel Core i9-13900K (24 Kerne)",
      };
      const result = calculateProductMetrics(product, 600);
      expect(result.pricePerUnit).toBe(25); // 600 / 24
    });
  });

  describe("getOptimizedImageUrl", () => {
    it("should optimize Amazon image URLs", () => {
      const original =
        "https://m.media-amazon.com/images/I/71u9c6P-YpL._AC_SY600_.jpg";
      const optimized = getOptimizedImageUrl(original, 400);
      expect(optimized).toContain("._AC_SX400_");
      expect(optimized).not.toContain("._AC_SY600_");
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
