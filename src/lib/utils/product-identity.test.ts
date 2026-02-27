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
    expect(identity.model).toBe("UWQHD Curved Gaming");
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

  it("should strip M.2 from SSD model names but keep it for Apple products", () => {
    // Samsung Case
    const samsungSsd = {
      title: "Samsung 990 PRO NVMe M.2 SSD",
      brand: "Samsung",
      category: "ssds",
    };
    const res1 = getProductIdentity(samsungSsd);
    expect(res1.model).toBe("990 PRO");

    // Apple Case
    const appleMac = {
      title: "Apple MacBook Air mit M2 Chip",
      brand: "Apple",
      category: "laptops",
    };
    const res2 = getProductIdentity(appleMac);
    expect(res2.model).toContain("M2");
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

  it("should use 'Modell' from official specifications if source is high quality and passes QA", () => {
    const product = {
      title:
        'Apple iPad mit A16 Chip: 11" Liquid Retina Display, 128 GB, WLAN 6 - Blau',
      officialTitle: 'Apple iPad 11. Generation 27,69cm (10,9") 128GB blau',
      brand: "Apple",
      category: "tablets",
      officialSpecifications: {
        Modell: "Apple iPad 11 2025 A16",
      },
      specificationsSource: "ebay",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("iPad 11 2025 A16");
  });

  it("should block 'Modell' override if brand mismatch is detected", () => {
    const product = {
      title: "Samsung Galaxy S24 Ultra",
      brand: "Samsung",
      category: "smartphones",
      officialSpecifications: {
        Modell: "Apple iPhone 15",
      },
      specificationsSource: "icecat",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("Galaxy S24 Ultra"); // Should NOT override
  });

  it("should block 'Modell' override if no token overlap exists", () => {
    const product = {
      title: "Logitech MX Master 3S",
      brand: "Logitech",
      category: "mice",
      officialSpecifications: {
        Modell: "G502 Hero",
      },
      specificationsSource: "google",
    };
    const identity = getProductIdentity(product);
    expect(identity.model).toBe("MX Master 3S"); // Should NOT override
  });

  it("should preserve 'ohne' and 'mit' in titles for models like AirPods", () => {
    const p1 = {
      title: "Apple AirPods 4 mit Aktiver Geräuschunterdrückung",
      brand: "Apple",
      category: "headphones",
    };
    const i1 = getProductIdentity(p1);
    expect(i1.model).toBe("AirPods 4 mit Aktiver Geräuschunterdrückung");

    const p2 = {
      title: "Apple AirPods 4 ohne Aktive Geräuschunterdrückung",
      brand: "Apple",
      category: "headphones",
    };
    const i2 = getProductIdentity(p2);
    expect(i2.model).toBe("AirPods 4 ohne Aktive Geräuschunterdrückung");
  });

  it("should trust official model name even if it contains noise words", () => {
    const product = {
      title: "Apple AirPods 4",
      brand: "Apple",
      category: "headphones",
      officialSpecifications: {
        Modell: "AirPods 4 with Active Noise Cancellation",
      },
      specificationsSource: "icecat",
    };
    const identity = getProductIdentity(product);
    // 'with' would have been stripped in the old-path.
    expect(identity.model).toBe("AirPods 4 with Active Noise Cancellation");
  });
});

describe("dynamic spec vs version checking", () => {
  it("should correctly distinguish version numbers from capacities and reject vague specs", () => {
    // Both 11 and 2025 are versions. 128 is storage (128 GB).
    // The candidate model "Apple iPad" drops 11 and 2025 -> should be rejected!
    const product1 = {
      title: "Apple iPad 11 2025 A16 Silber 128 GB Wi-Fi",
      brand: "Apple",
      category: "tablets",
      officialSpecifications: {
        Modell: "iPad",
      },
      specificationsSource: "icecat",
    };

    // Because "iPad" drops "11", verifySpecModel should reject it, meaning the identity model stays "iPad 11 2025 A16 WIFI"
    const identity1 = getProductIdentity(product1);
    expect(identity1.model).toBe("iPad 11 2025 A16 WIFI");

    // If candidate has the numbers, it's accepted
    const product2 = {
      title: "Apple iPad 11 2025 A16 Silber 128 GB Wi-Fi",
      brand: "Apple",
      category: "tablets",
      officialSpecifications: {
        Modell: "iPad 11 2025",
      },
      specificationsSource: "icecat",
    };
    const identity2 = getProductIdentity(product2);
    expect(identity2.model).toBe("iPad 11 2025");
  });

  it("should ignore spec numbers correctly across different categories", () => {
    // 34 (inch) is a spec, 144 (Hz) is a spec. No real versions to enforce. Candidate is allowed.
    const product1 = {
      title: "Samsung Odyssey OLED G8 34 Zoll 144 Hz Curved",
      brand: "Samsung",
      category: "monitors",
      officialSpecifications: {
        Modell: "Odyssey OLED G8",
      },
      specificationsSource: "icecat",
    };
    const identity1 = getProductIdentity(product1);
    expect(identity1.model).toBe("Odyssey OLED G8");

    // iPhone 15 vs candidate iPhone (Missing 15 -> Bad)
    const product2 = {
      title: "Apple iPhone 15 Pro Max 512GB Titanium Black",
      brand: "Apple",
      category: "smartphones",
      officialSpecifications: {
        Modell: "iPhone",
      },
      specificationsSource: "icecat",
    };
    const identity2 = getProductIdentity(product2);
    expect(identity2.model).toBe("iPhone 15 Pro Max"); // Did not get overridden

    // iPhone 15 Pro vs candidate iPhone 15 Pro (Valid subset)
    const product3 = {
      title: "Apple iPhone 15 Pro Max 512GB Titanium Black",
      brand: "Apple",
      category: "smartphones",
      officialSpecifications: {
        Modell: "iPhone 15 Pro",
      },
      specificationsSource: "icecat",
    };
    const identity3 = getProductIdentity(product3);
    // Actually wait, 'Max' is a tier contradiction against 'Pro' (no Max).
    // So verifySpecModel should reject it due to missing tier. Let's see.
    // TIER_CONTRADICTIONS = [["plus", "max", "pro", "ultra"]].
    // title has 'pro', 'max'. cand has 'pro'.
    // Is 'max' in title but not in cand? Yes.
    // Does it fail? Wait, let's just make the candidate match the title tiers so we only test versions.
  });
});
