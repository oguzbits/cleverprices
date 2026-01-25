import { describe, expect, it, mock } from "bun:test";

// Mock must happen BEFORE imports that use it
mock.module("@/lib/product-registry", () => ({
  parseVariationAttributes: (attrs: string) => {
    if (!attrs) return {};
    return Object.fromEntries(
      attrs.split(";").map((pair) => {
        const [k, v] = pair.split(":");
        return [k.trim(), v.trim()];
      }),
    );
  },
  Product: {},
}));

mock.module("next/cache", () => ({
  cacheLife: () => {},
  unstable_cache: (fn: any) => fn,
}));

import {
  getFamilyIdentity,
  getFamilyRepresentative,
  getFamilyStats,
} from "./product-families";

// Mock Product Helper
const createMockProduct = (overrides: Partial<any>): any => ({
  id: 1,
  slug: "test-slug",
  title: "Test Product",
  brand: "TestBrand",
  prices: { de: 100 },
  variationAttributes: "Color: Black",
  ...overrides,
});

describe("Product Families Logic", () => {
  describe("getFamilyRepresentative (Selecting the 'Face' of the family)", () => {
    it("should prioritize 'New' condition items matching user request", () => {
      const variants = [
        createMockProduct({ id: 1, condition: "Used", prices: { de: 50 } }), // Cheaper but used
        createMockProduct({ id: 2, condition: "New", prices: { de: 100 } }), // Expensive but new
      ];

      const result = getFamilyRepresentative(variants);
      expect(result?.id).toBe(2);
    });

    it("should pick cheapest among multiple 'New' items", () => {
      const variants = [
        createMockProduct({ id: 1, condition: "New", prices: { de: 200 } }),
        createMockProduct({ id: 2, condition: "New", prices: { de: 150 } }),
        createMockProduct({ id: 3, condition: "New", prices: { de: 300 } }),
      ];

      const result = getFamilyRepresentative(variants);
      expect(result?.id).toBe(2);
    });

    it("should fallback to cheapest Overall if NO 'New' items exist", () => {
      const variants = [
        createMockProduct({ id: 1, condition: "Renewed", prices: { de: 80 } }),
        createMockProduct({ id: 2, condition: "Used", prices: { de: 60 } }), // Cheapest overall
      ];

      const result = getFamilyRepresentative(variants);
      expect(result?.id).toBe(2);
    });

    it("should handle LocalizedProduct shape (flattened 'price' field)", () => {
      // Simulate category page data where price is a number, not an object
      const variants = [
        createMockProduct({
          id: 1,
          condition: "New",
          price: 120,
          prices: undefined,
        }),
        createMockProduct({
          id: 2,
          condition: "New",
          price: 90,
          prices: undefined,
        }), // Cheapest
      ];

      const result = getFamilyRepresentative(variants);
      expect(result?.id).toBe(2);
    });

    it("should return undefined for empty list", () => {
      expect(getFamilyRepresentative([])).toBeUndefined();
    });
  });

  describe("getFamilyIdentity (Slug & Title Generation)", () => {
    it("should generate a clean neutral slug from representative product", () => {
      const rep = createMockProduct({
        brand: "Apple",
        title: "Apple iPhone 15 128GB Schwarz",
        parentAsin: "B0_IPHONE15_PARENT",
        variationAttributes: "Storage: 128GB; Color: Schwarz",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);

      // Expected: brand-model-parentSuffix
      // suffix of B0_IPHONE15_PARENT -> rent
      // model tokens: iphone, 15
      expect(slug).toBe("apple-iphone-15-rent");
    });

    it("should strip attribute tokens from the slug", () => {
      const rep = createMockProduct({
        brand: "Samsung",
        title: "Samsung Galaxy S24 Ultra 512GB Titanium Gray AI Smartphone",
        parentAsin: "FAM-S24-ULTRA",
        variationAttributes: "Storage: 512GB; Color: Titanium Gray",
      });

      // We pass the variant itself to ensure its attributes are registered for stripping
      const { slug } = getFamilyIdentity(rep, [rep]);

      // AI, Smartphone, 512GB, Titanium, Gray should be stripped or ignored
      // Target: samsung-galaxy-s24-ultra-ltra
      expect(slug).toContain("samsung-galaxy-s24-ultra");
      expect(slug).not.toContain("512gb");
      expect(slug).not.toContain("gray");
    });

    it("should robustly handle 'Generalüberholt' and 'Renewed' in title", () => {
      const rep = createMockProduct({
        brand: "Apple",
        title: "iPhone 14 Pro Max Generalüberholt wie neu",
        parentAsin: "ABCD1234XYZ", // suffix 4xyz
        variationAttributes: "Condition: Renewed",
      });

      const { slug } = getFamilyIdentity(rep, []);

      expect(slug).toBe("apple-iphone-14-pro-max-4xyz");
      expect(slug).not.toContain("generalueberholt");
    });

    it("should limit model part to 4 tokens", () => {
      const rep = createMockProduct({
        brand: "Generic",
        title: "Super Long Model Name That Goes On And On Edition",
        parentAsin: "PAR-1234", // suffix 1234
      });

      const { slug } = getFamilyIdentity(rep, []);
      const parts = slug.split("-");
      // generic (1) + model (4) + suffix (1) = 6 parts max
      expect(parts.length).toBeLessThanOrEqual(6);
    });

    it("should remove duplicated brand name", () => {
      const rep = createMockProduct({
        brand: "Sonos",
        title: "Sonos Arc Soundbar Black",
        parentAsin: "SON-ARC-001", // suffix -001
        variationAttributes: "Color: Black",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);
      // Should NOT be sonos-sonos-arc-...
      expect(slug).toMatch(/^sonos-arc/);
    });
  });

  describe("getFamilyStats (Counting)", () => {
    it("should count unique variation combinations, not raw IDs", () => {
      const variants = [
        createMockProduct({
          id: 1,
          variationAttributes: "Color: Black; Size: S",
        }),
        createMockProduct({
          id: 2,
          variationAttributes: "Color: Black; Size: S",
        }), // Duplicate config (e.g. diff seller)
        createMockProduct({
          id: 3,
          variationAttributes: "Color: White; Size: S",
        }),
      ];

      const { variantCount } = getFamilyStats(variants);
      expect(variantCount).toBe(2); // Black/S and White/S
    });

    it("should fallback to ID counting if no variation attributes present", () => {
      const variants = [
        createMockProduct({ id: 1, variationAttributes: undefined }),
        createMockProduct({ id: 2, variationAttributes: undefined }),
      ];

      const { variantCount } = getFamilyStats(variants);
      expect(variantCount).toBe(2);
    });
  });
});
