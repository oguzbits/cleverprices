import { describe, expect, it } from "bun:test";

import { getFamilyIdentity } from "./product-families";

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
        officialSpecifications: JSON.stringify({ Modell: "Galaxy S24 Ultra" }),
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
        officialSpecifications: JSON.stringify({ Modell: "990 PRO" }),
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
        officialSpecifications: JSON.stringify({
          Modell: "ROG Strix GeForce RTX 4070 Ti Super",
        }),
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
      expect(slug).toContain("vengeance-rgb-32gb-kit-2x16gb-ddr5-6000-corsair");
    });
  });

  describe("Category: Monitors & TVs (Display Identity)", () => {
    it("should extract Size, Resolution, and Refresh Rate for a gaming monitor", () => {
      const p = createProduct({
        id: 90,
        brand: "LG",
        title:
          "LG UltraGear 27GN800-B 27 Zoll QHD IPS Gaming Monitor 144Hz 1ms",
        category: "monitore", // Test mapping from German name
      });

      const { title, categoryUsed } = getFamilyIdentity(p, []);

      expect(categoryUsed).toBe("monitors"); // Verify mapping works
      expect(title).toBe("LG UltraGear 27GN800-B");
    });

    it("should handle 4K OLED TVs with Inch notation", () => {
      const p = createProduct({
        id: 91,
        brand: "Samsung",
        title: "Samsung S90C 65 Inch 4K OLED TV",
        category: "fernseher", // Test mapping from German name
      });

      const { title, categoryUsed } = getFamilyIdentity(p, []);

      expect(categoryUsed).toBe("televisions"); // Verify mapping works
      expect(title).toBe("Samsung S90C");
    });

    it("should handle mixed German/English units like 27 Zoll", () => {
      const p = createProduct({
        id: 92,
        brand: "Dell",
        title: "Dell S2721DS 27 Zoll QHD Monitor",
        category: "monitore",
      });

      const { title } = getFamilyIdentity(p, []);
      expect(title).toBe("Dell S2721DS");
    });

    it("should handle Dell S3425DW 34 Plus monitor with USB-C and Curved", () => {
      const p = createProduct({
        id: 93,
        brand: "Dell",
        title:
          "Dell 34 Plus USB-C Monitor - S3425DW, WQHD (3440x1440), 21:9 Curved, 120Hz, VA, 1ms, AMD FreeSync Premium",
        category: "monitore",
      });

      const { title, slug } = getFamilyIdentity(p, []);

      // IDEALO STYLE: Clean Title (Brand + Model/Series)
      expect(title).toBe("Dell Plus S3425DW");
      // Clean Slug (ID + Model + Brand)
      expect(slug).toBe("200000093_-plus-s3425dw-dell");
    });

    it("should strip technical noise from Dell P2725H to match Idealo", () => {
      const p = createProduct({
        id: 94,
        brand: "Dell",
        title:
          "Dell P2725H 27 Zoll Full HD (1920x1080) Monitor, 100Hz, IPS, 5ms, 99% sRGB, USB-C, 69cm",
        category: "monitore",
      });

      const { title, slug } = getFamilyIdentity(p, []);

      // IDEALO STYLE: Just the brand and model
      expect(title).toBe("Dell P2725H");
      // Slug stays clean
      expect(slug).toBe("200000094_-p2725h-dell");
    });

    it("should handle LG monitor with comma-separated specs and model code at end", () => {
      const p = createProduct({
        id: 3688,
        brand: "LG",
        isParentView: true,
        title:
          "LG, 27 Zoll, Ultra UHD 4K Monitor, 68.4cm, 16:9, Super Resolution, 3840 x 2160, 60Hz, 5ms, HDR10, AMD FreeSync, DCI-P3 95%, DisplayHD 400, 27UP650K-W.AEU - Weiß",
        category: "monitore",
      });

      // Simulating a Hub (ID matches the prefix used in user's reported link)
      const { title, slug } = getFamilyIdentity(p, []);

      // IDEALO STYLE: Clean Title should include the model code
      expect(title).toBe("LG 27UP650K-W");
      expect(slug).toBe("900003688_-27up650k-w-lg");
    });

    it("should handle Dell S3225QC with messy technical noise (Hardcore Minimalist)", () => {
      const p = createProduct({
        id: 200003015,
        brand: "Dell",
        title:
          "Dell S3225QC 4K HD Office 3840 x 2160 Pixels, 144Hz, 1ms, IPS, HDMI, DP, USB-C",
        category: "monitore",
      });

      const { title, slug } = getFamilyIdentity(p, []);

      // IDEALO STYLE: Brand + Model
      expect(title).toBe("Dell S3225QC");
      expect(slug).toBe("200003015_-s3225qc-dell");
    });

    it("should preserve version codes like -10 and not treat them as sizes", () => {
      const p = createProduct({
        id: 3000,
        brand: "Lenovo",
        title: "Lenovo Legion 27Q-10 Monitor",
        category: "monitore",
      });

      const { title } = getFamilyIdentity(p, []);
      expect(title).toBe("Lenovo Legion 27Q-10");
    });

    it("should handle ASUS TUF VG27AQML5A correctly (Hardcore Minimalist)", () => {
      const p = createProduct({
        id: 200003176,
        title:
          "ASUS TUF VG27AQML5A Fast ELMB VESA DisplayHDR 0 Reaktionszeit Lautsrecher 2x HDMI DisplayPort",
        brand: "ASUS",
        category: "monitore",
      });
      const { title, slug } = getFamilyIdentity(p, []);

      expect(title).toBe("ASUS TUF VG27AQML5A");
      expect(slug).toBe("200003176_-tuf-vg27aqml5a-asus");
    });

    it("should handle noisy Dell P2425 Professional with measurements in title", () => {
      const p = createProduct({
        id: 200003026,
        title:
          "Dell Monitor 60,96cm P2425 Professional WUXGA IPS gebraucht2206795",
        brand: "Dell",
        category: "monitore",
      });
      const { title, slug } = getFamilyIdentity(p, []);

      expect(title).toBe("Dell P2425 gebraucht2206795");
      expect(slug).toBe("200003026_-p2425-gebraucht2206795-dell");
    });

    it("should handle Dell SE2725HG with German jargon (Hardcore Minimalist)", () => {
      const p = createProduct({
        id: 200003092,
        title: "Dell SE2725HG Full HD 6 schwarz",
        brand: "Dell",
        category: "monitore",
      });
      const { title, slug } = getFamilyIdentity(p, []);

      // IDEALO STYLE: Brand + Model
      expect(title).toBe("Dell SE2725HG");
      expect(slug).toBe("200003092_-se2725hg-dell");
    });

    it("should handle ASUS TUF with extreme specs and cutoff (Hardcore Minimalist)", () => {
      const p = createProduct({
        id: 200003176,
        title:
          "ASUS TUF VG27AQML5A Fast ELMB VESA DisplayHDR 0 Reaktionszeit Lautsrecher 2x HDMI DisplayPort",
        brand: "ASUS",
        category: "monitore",
      });
      const { title, slug } = getFamilyIdentity(p, []);

      // IDEALO STYLE: Brand + Model
      expect(title).toBe("ASUS TUF VG27AQML5A");
      expect(slug).toBe("200003176_-tuf-vg27aqml5a-asus");
    });
  });

  describe("Category: Headphones (Model Numbers)", () => {
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

      expect(title).toBe("KitchenAid Artisan");
      // "liebesapfel-rot" should be in slug variant part (hyphenated)
      expect(slug).toContain("liebesapfel-rot");
      expect(slug).toContain("artisan-liebesapfel-rot");
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
