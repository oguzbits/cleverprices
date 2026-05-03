import { describe, expect, it } from "bun:test";

import { normalizeBrandName } from "./brand-mapping";
import { enrichmentGuard, sanitizeSpecs } from "./specs-sanitizer";

describe("Brand Normalization", () => {
  it("should normalize 'Nichts' to 'Nothing'", () => {
    expect(normalizeBrandName("Nichts")).toBe("Nothing");
  });

  it("should normalize 'Apfel' to 'Apple'", () => {
    expect(normalizeBrandName("Apfel")).toBe("Apple");
  });

  it("should preserve correctly spelled brands", () => {
    expect(normalizeBrandName("Samsung")).toBe("Samsung");
  });
});

describe("sanitizeSpecs with Brand Normalization", () => {
  it("should normalize brand in specs values", () => {
    const specs = {
      Marke: "Nichts",
      Modell: "Phone (2a)",
    };
    const identity = {
      title: "Nothing Phone (2a)",
      brand: "Nothing",
      model: "Phone (2a)",
    };
    const sanitized = sanitizeSpecs(specs, identity);
    expect(sanitized.Marke).toBe("Nothing");
  });
});

describe("enrichmentGuard", () => {
  const productIdentity = {
    title: "Nothing Phone (2a) Titanium Black 256GB",
    brand: "Nothing",
    model: "Phone (2a)",
  };

  it("should block 'Plus' when it's not in the title", () => {
    const isSafe = enrichmentGuard(
      "Modell",
      "Nothing Phone (2a) Plus",
      productIdentity,
    );
    expect(isSafe).toBe(false);
  });

  it("should allow 'Plus' when it IS in the title", () => {
    const plusIdentity = {
      title: "Nothing Phone (2a) Plus Titanium Gray",
      brand: "Nothing",
      model: "Phone (2a) Plus",
    };
    const isSafe = enrichmentGuard(
      "Modell",
      "Nothing Phone (2a) Plus",
      plusIdentity,
    );
    expect(isSafe).toBe(true);
  });

  it("should block Pro when not in title", () => {
    const isSafe = enrichmentGuard("Modell", "iPhone 15 Pro", {
      title: "Apple iPhone 15 128GB",
      brand: "Apple",
      model: "iPhone 15",
    });
    expect(isSafe).toBe(false);
  });

  it("should allow valid model descriptive name", () => {
    const isSafe = enrichmentGuard(
      "Model",
      "Nothing Phone (2a)",
      productIdentity,
    );
    expect(isSafe).toBe(true);
  });

  describe("Sibling Consensus (Stage 2)", () => {
    const consensus = {
      total: 10,
      tokenCounts: {
        titanium: 10,
        black: 8,
        leakingtoken: 1, // Only 10% frequency
      },
      specCounts: {},
    };

    it("should allow tokens with high frequency in consensus", () => {
      const isSafe = enrichmentGuard(
        "Color",
        "Titanium Black",
        productIdentity,
        consensus,
      );
      expect(isSafe).toBe(true);
    });

    it("should block rare tokens that aren't in the title", () => {
      // "leakingtoken" appears in only 10% of siblings and NOT in our title.
      const isSafe = enrichmentGuard(
        "Model_variant",
        "Special leakingtoken Edition",
        productIdentity,
        consensus,
      );
      expect(isSafe).toBe(false);
    });

    it("should allow rare tokens if they ARE in our title (identity override)", () => {
      const rareButInTitleIdentity = {
        title: "Nothing Phone (2a) raretoken Edition",
        brand: "Nothing",
        model: "Phone (2a)",
      };
      const isSafe = enrichmentGuard(
        "Model",
        "raretoken Edition",
        rareButInTitleIdentity,
        consensus,
      );
      expect(isSafe).toBe(true);
    });
  });
});
