import { describe, expect, it, mock } from "bun:test";
import { getFamilyIdentity } from "./product-families";

// Mock dependencies
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
}));

mock.module("next/cache", () => ({
  cacheLife: () => {},
  unstable_cache: (fn: any) => fn,
}));

// Helper to create mock products
const createProduct = (overrides: any) => ({
  id: 100, // Base ID
  slug: "test-slug",
  title: "Test Title",
  brand: "Generic",
  category: "generic",
  prices: { de: 100 },
  variationAttributes: null,
  ...overrides,
});

describe("Global Cross-Category Identity Validation", () => {
  // ===========================================================================
  // 1. High Risk Categories (Complex Identity & Variants)
  // ===========================================================================

  describe("Category: Consoles (PlayStation/Xbox)", () => {
    it("should handle PS5 Pro correctly (Brand Strip + Capacity Extract)", () => {
      const p = createProduct({
        id: 1,
        brand: "Playstation", // Input brand often "Playstation" not "Sony"
        title: "Playstation 5 Pro 2 TB",
        category: "consoles",
      });

      const { slug, title, brand } = getFamilyIdentity(p, []);

      expect(brand).toBe("Sony"); // Normalized
      expect(title).toBe("Sony Playstation 5 Pro"); // Clean Breadcrumb
      expect(slug).toBe("200000001_-playstation-5-pro-2tb-sony"); // Variant extracted & appended
    });

    it("should handle Xbox Series X correctly (Microsoft Brand)", () => {
      const p = createProduct({
        id: 2,
        brand: "Xbox",
        title: "Xbox Series X 1TB",
        category: "consoles",
      });

      const { slug, title, brand } = getFamilyIdentity(p, []);

      expect(brand).toBe("Microsoft");
      expect(title).toBe("Microsoft Xbox Series X");
      expect(slug).toBe("200000002_-xbox-series-x-1tb-microsoft");
    });
  });

  describe("Category: Smartphones", () => {
    it("should handle Galaxy S24 Ultra with AI noise", () => {
      const p = createProduct({
        id: 10,
        brand: "Samsung",
        title: "Samsung Galaxy S24 Ultra 512GB Titanium Gray AI Smartphone",
        category: "smartphones",
        variationAttributes: "Storage: 512GB; Color: Titanium Gray",
      });

      const { slug, title } = getFamilyIdentity(p, []);

      // "AI Smartphone" should be stripped
      // 512GB and Titanium Gray should be moved to variant part of slug
      expect(slug).toBe(
        "200000010_-galaxy-s24-ultra-titanium-gray-512gb-samsung",
      );
      expect(title).toBe("Samsung Galaxy S24 Ultra");
    });

    it("should handle iPhone 15 with clean title", () => {
      const p = createProduct({
        id: 11,
        brand: "Apple",
        title: "Apple iPhone 15 (128 GB) - Schwarz",
        category: "smartphones",
        variationAttributes: "Farbe: Schwarz; Speicher: 128 GB",
      });

      const { slug } = getFamilyIdentity(p, []);
      expect(slug).toBe("200000011_-iphone-15-schwarz-128gb-apple");
    });
  });

  describe("Category: SSDs (Technical Specs)", () => {
    it("should handle Samsung 990 PRO with NVMe noise", () => {
      const p = createProduct({
        id: 20,
        brand: "Samsung",
        title: "Samsung 990 PRO 4TB NVMe SSD M.2",
        category: "ssds",
        variationAttributes: "Kapazität: 4 TB",
      });

      const { slug, title } = getFamilyIdentity(p, []);

      // "NVMe SSD M.2" should be stripped
      expect(title).toBe("Samsung 990 PRO");
      expect(slug).toBe("200000020_-990-pro-4tb-samsung");
    });
  });

  describe("Category: GPU (Long Models)", () => {
    it("should handle RTX 4070 Ti Super", () => {
      const p = createProduct({
        id: 30,
        brand: "ASUS",
        title: "ASUS ROG Strix GeForce RTX 4070 Ti Super 16GB OC",
        category: "gpu",
        variationAttributes: "Speicher: 16 GB",
      });

      const { slug, title } = getFamilyIdentity(p, []);
      expect(title).toBe("ASUS ROG Strix GeForce RTX 4070 TI SUPER OC");
      expect(slug).toContain("rog-strix-geforce-rtx-4070-ti-super");
    });
  });

  describe("Category: RAM (Kits vs Modules)", () => {
    it("should handle DDR5 Kits", () => {
      const p = createProduct({
        id: 40,
        brand: "Corsair",
        title: "Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz",
        category: "ram",
        variationAttributes: "Gesamtkapazität: 32 GB; Module: 2x 16 GB",
      });

      const { slug } = getFamilyIdentity(p, []);
      expect(slug).toContain("vengeance-rgb-ddr5-32gb-2x-16gb-corsair");
    });
  });

  describe("Category: TVs (Size Extraction) - TVs are FixedTrait", () => {
    it("should extract screen size from title", () => {
      const p = createProduct({
        id: 50,
        brand: "LG",
        title: 'LG OLED65C39LC 65" 4K Smart TV',
        category: "televisions",
        variationAttributes: 'Größe: 65"',
      });

      const { slug } = getFamilyIdentity(p, []);
      expect(slug).toBe("200000050_-oled65c39lc-lg");
    });
  });

  describe("Category: Headersphones (Model Numbers)", () => {
    it("should handle Sony WH-1000XM5", () => {
      const p = createProduct({
        id: 60,
        brand: "Sony",
        title: "Sony WH-1000XM5 Noise Cancelling Headphones Silver",
        category: "headphones",
        variationAttributes: "Farbe: Silber",
      });

      const { slug } = getFamilyIdentity(p, []);
      expect(slug).toBe("200000060_-wh-1000xm5-silber-sony");
    });
  });

  describe("Category: Kitchen (Color Variants)", () => {
    it("should handle KitchenAid colors", () => {
      const p = createProduct({
        id: 70,
        brand: "KitchenAid",
        title: "KitchenAid Artisan 5KSM175 Küchenmaschine Liebesapfel Rot",
        category: "kitchen",
        variationAttributes: "Color: Liebesapfel Rot",
      });

      const { slug, title } = getFamilyIdentity(p, []);

      expect(title).toBe("KitchenAid Artisan 5KSM175");
      // "liebesapfel-rot" should be in slug variant part (hyphenated)
      expect(slug).toContain("liebesapfel-rot");
      expect(slug).toContain("artisan-5ksm175");
    });
  });

  describe("Category: Cameras (Body vs Kit)", () => {
    it("should handle Camera Body Only", () => {
      const p = createProduct({
        id: 80,
        brand: "Sony",
        title: "Sony Alpha 7 IV Body",
        category: "cameras",
      });

      const { slug, title } = getFamilyIdentity(p, []);

      // "Body" is often part of the model distinction for cameras
      expect(title).toBe("Sony Alpha 7 IV");
      expect(slug).toBe("200000080_-alpha-7-iv-sony");
    });
  });
});
