import { describe, expect, it } from "bun:test";
import { getProductIdentity } from "./product-identity";

describe("getProductIdentity", () => {
  it("should preserve model numbers like '15' in iPhones", () => {
    const product = {
      title: "Apple iPhone 15 (128 GB) - Schwarz",
      brand: "Apple",
      category: "smartphones",
      variationAttributes: "Farbe: Black; Storage: 128 GB",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("iPhone 15");
  });

  it("should strip redundant German color words even if not in attributes", () => {
    const product = {
      title: "Apple iPhone 15 128 GB Schwarz- (Generalüberholt)",
      brand: "Apple",
      category: "smartphones",
      variationAttributes: "Farbe: Titanium Black; Storage: 128 GB",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("iPhone 15");
  });

  it("should handle S-series Samsung phones correctly", () => {
    const product = {
      title: "Samsung Galaxy S25 Ultra 512GB Titanium Black",
      brand: "Samsung",
      category: "smartphones",
      variationAttributes: "Farbe: Titanium Black; Storage: 512 GB",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("Galaxy S25 Ultra");
  });

  it("should handle CPU model numbers and technical specs noise", () => {
    const product = {
      title:
        "AMD Ryzen 7 5800X Processor (8 Cores/16 threads, 105W DTP, AM4 socket)",
      brand: "AMD",
      category: "cpu",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("Ryzen 7 5800X");
  });

  it("should handle monitors with size and resolution noise", () => {
    const product = {
      title: 'Minifire 34" UWQHD Curved Gaming Monitor 165Hz(DP),3440 x 1440',
      brand: "Minifire",
      category: "monitors",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("UWQHD Curved");
    expect(identity.variantMap.Size).toBe('34"');
  });

  it("should handle SSD model numbers and capacities", () => {
    const product = {
      title: "Samsung 990 PRO 4TB NVMe SSD",
      brand: "Samsung",
      category: "ssds",
      variationAttributes: "Storage: 4 TB",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("990 PRO");
  });

  it("should handle PSUs with wattage and efficiency noise", () => {
    const product = {
      title: "Corsair RM750e 750W 80+ Gold Fully Modular PSU",
      brand: "Corsair",
      category: "power-supplies",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("RM750e");
  });

  it("should handle PlayStation as a product, not a brand", () => {
    const product = {
      title: "PlayStation 4 Pro - Konsole (1TB)",
      brand: "PlayStation",
      category: "consoles",
    };
    const identity = getProductIdentity(product);
    // Should map brand to Sony and preserve PlayStation in model
    expect(identity.brand).toBe("Sony");
    expect(identity.model).toBe("PlayStation 4 Pro");
  });

  it("should not strip '15' when it's part of the product name", () => {
    const product = {
      title: "iPhone 15",
      brand: "Apple",
      category: "smartphones",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("iPhone 15");
  });
});
