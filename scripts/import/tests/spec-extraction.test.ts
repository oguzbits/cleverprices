import { describe, expect, test } from "bun:test";

import { guardIntegrity } from "../data-validator";
// We will import the new extractor once refactored.
// For now, we test the validator logic which is half the battle.

describe("Specification Engine - Data Integrity", () => {
  test("GPU: Should strip 'Style' and normalize 'Item: Weight'", () => {
    const input = {
      Model: "V809-4299R",
      Style: "GeForce RTX 3050 VENTUS 2X XS WHITE 8G OC", // Pollution
      "Item: Weight (g)": "661", // Raw
      Weight: "661g", // Redundant
      Chipset: "RTX 3050 ", // Dirty
      Screen_Size: "120Hz", // Hallucination
    };

    const result = guardIntegrity(input, "gpu");

    // 1. Blacklist Check
    expect(result["Style"]).toBeUndefined();

    // 2. Normalization Check
    expect(result["Weight_Grams"]).toBe("661g");
    expect(result["Item: Weight (g)"]).toBeUndefined();

    // 3. Cleaning Check
    expect(result["Chipset"]).toBe("RTX 3050");
  });

  test("Household: Should normalize dimensions with different casing", () => {
    const input = {
      "Item: dimension (cm³)": "100", // Lowercase d
      Abmessungen: "100",
    };
    const result = guardIntegrity(input, "waschmaschinen");
    expect(result["Dimensions_CM3"]).toBe("100");
    expect(result["Abmessungen"]).toBeUndefined();
  });

  test("Global: Should reject non-whitelisted keys if strict schema active", () => {
    const input = {
      RandomGarbage: "True",
      Model: "Test",
      Clock_Speed: "2000 MHz", // Allowed for GPU
      UnknownAttribute: "123",
    };
    const result = guardIntegrity(input, "gpu"); // GPU has strict schema

    expect(result["RandomGarbage"]).toBeUndefined();
    expect(result["UnknownAttribute"]).toBeUndefined();
    expect(result["Model"]).toBe("Test"); // Global Safe
    expect(result["Clock_Speed"]).toBe("2000 MHz"); // Note: Schema has lowercase 'clock_speed' in updated list or we need to align casing
  });

  test("Household: Strict Schema Enforcement", () => {
    const input = {
      "Item: Weight (g)": "80000",
      Energieeffizienzklasse: "A",
      Wasserverbrauch: "47 L pro Zyklus",
      Programme: "12 Programme",
      Magic_Washer_Feature: "True", // Garbage
    };
    const result = guardIntegrity(input, "waschmaschinen");

    expect(result["Weight_Grams"]).toBe("80000g");
    expect(result["Energy_Class"]).toBe("A");
    // Regex extraction would have mapped these if coming from raw text,
    // but guardIntegrity expects mapped keys or normalization.
    // Since we don't have a "Water_Consumption" normalizer yet in data-validator,
    // we should add it or test the extraction logic separately.
    // For now, let's verify the keys allowed by schema PASS if present.

    // Simulating extracted data:
    const extracted = {
      Energy_Class: "A",
      Water_Consumption: "47 L",
      Programs: "12",
      Magic: "True",
    };
    const strict = guardIntegrity(extracted, "waschmaschinen");
    expect(strict["Water_Consumption"]).toBe("47 L");
    expect(strict["Programs"]).toBe("12");
    expect(strict["Magic"]).toBeUndefined();
  });

  test("Complex: Notebook Schema Enforcement", () => {
    const input = {
      Processor: "Apple M3",
      Magic_Feature: "Yes", // Junk
      Screen_Size: "14 Zoll",
    };
    const result = guardIntegrity(input, "notebooks");
    expect(result["Processor"]).toBe("Apple M3");
    expect(result["Screen_Size"]).toBe("14 Zoll");
    expect(result["Magic_Feature"]).toBeUndefined();
  });
});
