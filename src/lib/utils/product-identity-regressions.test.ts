import { describe, expect, it } from "bun:test";
import { getProductIdentity } from "./product-identity";

describe("getProductIdentity Fixes Verification", () => {
  it("should fix: Intel Core Ultra 7 265K (Id: 200001207)", () => {
    const result = getProductIdentity({
      id: "200001207",
      title:
        "Intel® Core™ Ultra 7 Desktop-Prozessor 265K 20 Kerne (8 P-cores +12 E-cores) bis zu 5,5 GHz",
      officialTitle: "265K",
      category: "prozessoren",
      brand: "Intel",
      variationAttributes: "{}",
      specifications: JSON.stringify({ Kerne: "20", Taktfrequenz: "5,5 GHz" }),
      officialSpecifications: JSON.stringify({ Modell: "265K" }),
    } as any);

    // Should preserve trademark symbols in displayTitle
    expect(result.displayTitle).toContain("Intel® Core™ Ultra 7");
    expect(result.displayTitle).toContain("265K");
    expect(result.displayTitle).toContain("™");
    expect(result.displayTitle).toContain("®");
  });

  it("should fix: Intel Core Ultra 5 245K (Id: 200001242)", () => {
    const result = getProductIdentity({
      id: "200001242",
      title:
        "Intel® Core™ Ultra 5 Desktop-Prozessor 245K 14 Kerne (6 P-cores + 8 E-cores) bis zu 5,2 GHz",
      officialTitle: "245K",
      category: "prozessoren",
      brand: "Intel",
      variationAttributes: "{}",
      specifications: "{}",
      officialSpecifications: "{}",
    } as any);

    expect(result.displayTitle).toContain("Intel® Core™ Ultra 5");
    expect(result.displayTitle).toContain("245K");
    expect(result.displayTitle).toContain("™");
    expect(result.displayTitle).toContain("®");
  });

  it("should fix: AMD Ryzen 7 5800X (Id: 200001201) - stop 8x4 noise", () => {
    const result = getProductIdentity({
      id: "200001201",
      title:
        "AMD Ryzen 7 5800X Processor (8 Cores/16 threads, 105W DTP, AM4 socket, 36 MB Cache, up to 4,7Ghz max boost frequency, no cooler)",
      officialTitle: "Ryzen 7 5800X",
      category: "prozessoren",
      brand: "AMD",
      variationAttributes: "{}",
      specifications: JSON.stringify({ Threads: "16", Typ: "8x4" }),
      officialSpecifications: "{}",
    } as any);

    expect(result.displayTitle).toBe("AMD Ryzen 7 5800X 8 Cores 4,7Ghz");
    expect(result.displayTitle).not.toContain("8x4");
  });

  it("should fix: AMD Ryzen 7 5800X3D (Id: 200001243) - stop codename noise", () => {
    const result = getProductIdentity({
      id: "200001243",
      title: "AMD Ryzen 7 5800X3D Processor Vermeer",
      officialTitle: "100-100000651WOF",
      category: "prozessoren",
      brand: "AMD",
      variationAttributes: "{}",
      specifications: JSON.stringify({ Codename: "Vermeer" }),
      officialSpecifications: "{}",
    } as any);

    expect(result.displayTitle).toBe("AMD Ryzen 7 5800X3D");
    expect(result.displayTitle).not.toContain("Vermeer");
  });

  it("should fix: AMD Ryzen 7 9800X3D (Id: 200001254) - stop 'je 3' noise", () => {
    const result = getProductIdentity({
      id: "200001254",
      title:
        "AMD Ryzen 7 9800X3D Prozessor (8 Kerne / 16 Threads, bis zu 5,2 GHz, 120W TDP, AM5, 96MB L3-Cache, ohne Kühler)",
      officialTitle: "100-100000651WOF",
      category: "prozessoren",
      brand: "AMD",
      variationAttributes: "{}",
      specifications: JSON.stringify({ Menge: "je 3" }),
      officialSpecifications: "{}",
    } as any);

    expect(result.displayTitle).toBe("AMD Ryzen 7 9800X3D 8 Kerne 5,2 GHz");
    expect(result.displayTitle).not.toContain("je 3");
  });

  it("should fix: AMD Ryzen 5 9600X (Id: 100011538) - stop SSD label in CPU category", () => {
    const result = getProductIdentity({
      id: "100011538",
      title: "AMD Ryzen 5 9600X Processor",
      officialTitle: "9600X",
      category: "prozessoren",
      brand: "AMD",
      variationAttributes: "Storage: 128GB",
      specifications: JSON.stringify({ Speicher: "128GB" }),
      officialSpecifications: "{}",
    } as any);

    // CPU logic currently prioritizes reconstructed facts and ignores variantTokens (which are often noise in CPUs)
    expect(result.displayTitle).toBe("AMD Ryzen 5 9600X");
    expect(result.displayTitle).not.toContain("128GB");
  });

  it("should preserve decimals in clock rates", () => {
    const result = getProductIdentity({
      id: "test",
      title: "Intel Core i9-14900K 3.2 GHz (6.0 GHz Turbo)",
      category: "prozessoren",
      brand: "Intel",
      variation_attributes: "{}",
      specifications: JSON.stringify({
        Basistakt: "3,2 GHz",
        "Maximaler Takt": "6,0 GHz",
      }),
      official_specifications: "{}",
    } as any);

    expect(result.displayTitle).toContain("3.2");
    expect(result.displayTitle).not.toContain("32GHz");
  });
});
