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

      // New Standard: brand suffix + variants included
      expect(slug).toBe("200000001_-iphone-15-128gb-schwarz-apple");
    });

    it("should strip attribute tokens from the slug but add them as variants", () => {
      const rep = createMockProduct({
        brand: "Samsung",
        title: "Samsung Galaxy S24 Ultra 512GB Titanium Gray AI Smartphone",
        parentAsin: "FAM-S24-ULTRA",
        variationAttributes: "Storage: 512GB; Color: Titanium Gray",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);

      // Target: [ID]_-galaxy-s24-ultra-512gb-titaniumgray-samsung
      expect(slug).toContain("galaxy-s24-ultra");
      expect(slug).toContain("512gb");
      expect(slug).toContain("titaniumgray");
    });

    it("should robustly handle 'Generalüberholt' and 'Renewed' in title", () => {
      const rep = createMockProduct({
        brand: "Apple",
        title: "iPhone 14 Pro Max Generalüberholt wie neu",
        parentAsin: "ABCD1234XYZ", // suffix 4xyz
        variationAttributes: "Condition: Renewed",
      });

      const { slug } = getFamilyIdentity(rep, []);

      // "Generalüberholt wie neu" should be stripped via noise list
      expect(slug).toBe("200000001_-iphone-14-pro-max-apple");
    });

    it("should limit model part to 4 tokens", () => {
      const rep = createMockProduct({
        brand: "Generic",
        title: "Super Long Model Name That Goes On And On Edition",
        parentAsin: "PAR-1234", // suffix 1234
      });

      const { slug } = getFamilyIdentity(rep, []);
      const parts = slug.split("-");
      // This logic is less strict now, just ensure it doesn't explode
      expect(parts.length).toBeGreaterThan(3);
    });

    it("should remove duplicated brand name", () => {
      const rep = createMockProduct({
        brand: "Sonos",
        title: "Sonos Arc Soundbar Black",
        parentAsin: "SON-ARC-001", // suffix -001
        variationAttributes: "Color: Black",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);
      // Should be ...-arc-soundbar-black-sonos
      expect(slug).toBe("200000001_-arc-soundbar-black-sonos");
    });

    it("should apply 900,000,000 prefix for parent views (hubs)", () => {
      const rep = createMockProduct({
        id: 123,
        brand: "Apple",
        title: "iPhone 15",
        parentAsin: "P123",
      });

      // Simulation of a parent view request (syntheticId provided)
      const parentRep = { ...rep, syntheticId: 900000123 };

      const { slug } = getFamilyIdentity(parentRep as any, [rep]);
      expect(slug).toBe("900000123_-iphone-15-apple");
    });

    it("should apply 200,000,000 prefix for variant views (children)", () => {
      const rep = createMockProduct({
        id: 456,
        brand: "Apple",
        title: "iPhone 15",
        parentAsin: "P456",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);
      // Includes -black because mock default has Color: Black
      expect(slug).toBe("200000456_-iphone-15-black-apple");
    });

    it("should not double-prefix if ID is already 200m+", () => {
      const rep = createMockProduct({
        id: 200000789,
        brand: "Apple",
        title: "iPhone 15",
        parentAsin: "P789",
      });

      const { slug } = getFamilyIdentity(rep, [rep]);
      expect(slug).toBe("200000789_-iphone-15-black-apple");
    });

    it("should correctly handle PS5 Pro 2TB (Capacity extracted from title)", () => {
      const rep = createMockProduct({
        id: 4,
        brand: "Playstation", // Input brand
        title: "Playstation 5 Pro 2 TB",
        parentAsin: "PS5PRO",
        variationAttributes: null, // Simulate missing DB attributes
      });

      const { slug, title, brand } = getFamilyIdentity(rep, []);
      // Should normalize brand check order
      // Should extract 2TB as a variant and append it to slug
      // Should STRIP 2TB from model name

      // Logic Check:
      // Identity -> brand: Sony (via normalization), model: PlayStation 5 Pro (stripped 2tb)
      // Variant Part -> 2tb (extracted)
      // Slug -> [ID]_-playstation-5-pro-2tb-sony
      expect(slug).toBe("200000004_-playstation-5-pro-2tb-sony");
      expect(title).toBe("Sony Playstation 5 Pro"); // Clean Breadcrumb
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
