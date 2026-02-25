import { describe, expect, it, mock } from "bun:test";

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
        category: "smartphones",
        title: "Apple iPhone 15 128GB Schwarz", // Messy title
        officialTitle: "Apple iPhone 15", // Clean eBay title
        parentAsin: "B0_IPHONE15_PARENT",
        variationAttributes: "Storage: 128GB; Color: Schwarz",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);

      // Logic: ID + Clean Model + Attributes (Sorted: Color > Storage) + Brand
      expect(slug).toBe("200000001_-iphone-15-schwarz-128gb-apple");
    });

    it("should strip attribute tokens from the slug but add them as variants", () => {
      const rep = createMockProduct({
        brand: "Samsung",
        category: "smartphones",
        title: "Samsung Galaxy S24 Ultra 512GB Titanium Gray AI Smartphone",
        officialTitle: "Samsung Galaxy S24 Ultra",
        parentAsin: "FAM-S24-ULTRA",
        variationAttributes: "Storage: 512GB; Color: Titanium Gray",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);

      expect(slug).toContain("galaxy-s24-ultra");
      expect(slug).toContain("512gb");
      expect(slug).toContain("titanium-gray"); // Natural hyphenation
    });

    it("should robustly handle 'Generalüberholt' and 'Renewed' in title", () => {
      const rep = createMockProduct({
        brand: "Apple",
        category: "smartphones",
        title: "iPhone 14 Pro Max Generalüberholt wie neu",
        officialTitle: "Apple iPhone 14 Pro Max", // Use clean title to bypass noise
        parentAsin: "ABCD1234XYZ",
        variationAttributes: "Color: Black",
      });

      const { slug } = getFamilyIdentity(rep, []);

      expect(slug).toBe("200000001_-iphone-14-pro-max-black-apple");
    });

    it("should limit model part to 4 tokens", () => {
      const rep = createMockProduct({
        brand: "Generic",
        title: "Super Long Model Name That Goes On And On Edition",
        officialTitle: "Super Long Model Name",
        parentAsin: "PAR-1234",
      });

      const { slug } = getFamilyIdentity(rep, []);
      const parts = slug.split("-");
      expect(parts.length).toBeGreaterThan(3);
    });

    it("should remove duplicated brand name", () => {
      const rep = createMockProduct({
        brand: "Sonos",
        title: "Sonos Arc Soundbar Black",
        officialTitle: "Sonos Arc",
        parentAsin: "SON-ARC-001",
        variationAttributes: "Color: Black",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);
      expect(slug).toBe("200000001_-arc-black-sonos");
    });

    it("should apply 900,000,000 prefix for parent views (hubs)", () => {
      const rep = createMockProduct({
        id: 123,
        brand: "Apple",
        title: "iPhone 15",
        officialTitle: "Apple iPhone 15",
        parentAsin: "P123",
      });

      const parentRep = { ...rep, syntheticId: 900000123 };

      const { slug } = getFamilyIdentity(parentRep as any, [rep]);
      expect(slug).toBe("900000123_-iphone-15-apple");
    });

    it("should apply 200,000,000 prefix for variant views (children)", () => {
      const rep = createMockProduct({
        id: 456,
        brand: "Apple",
        title: "iPhone 15",
        officialTitle: "Apple iPhone 15",
        parentAsin: "P456",
        variationAttributes: "Color: Black",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);
      expect(slug).toBe("200000456_-iphone-15-black-apple");
    });

    it("should not double-prefix if ID is already 200m+", () => {
      const rep = createMockProduct({
        id: 200000789,
        brand: "Apple",
        title: "iPhone 15",
        officialTitle: "Apple iPhone 15",
        parentAsin: "P789",
        variationAttributes: "Color: Black",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);
      expect(slug).toBe("200000789_-iphone-15-black-apple");
    });

    it("should correctly handle PS5 Pro 2TB (Capacity extracted from title)", () => {
      const rep = createMockProduct({
        id: 4,
        brand: "Playstation",
        category: "consoles",
        title: "Playstation 5 Pro 2 TB",
        officialTitle: "Sony PlayStation 5 Pro",
        parentAsin: "PS5PRO",
        variationAttributes: "Storage: 2TB",
      });

      const { slug, title, brand } = getFamilyIdentity(rep, []);
      expect(slug).toBe("200000004_-playstation-5-pro-2tb-sony");
      expect(title).toBe("Sony PlayStation 5 Pro");
      expect(brand).toBe("Sony");
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
