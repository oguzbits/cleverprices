import { beforeEach, describe, expect, test } from "bun:test";
import { SmartParser } from "../../../scripts/enrichment/smart-parser";
import massiveTestData from "./massive-test-data.json";

describe("SmartParser Massive Regression Suite", () => {
  let parser: SmartParser;

  beforeEach(() => {
    parser = new SmartParser();
  });

  // 1. Run 180+ test cases from the generated JSON
  for (const tc of massiveTestData) {
    test(`[${tc.category}] ${tc.description}`, () => {
      const result = parser.deterministicExtract(
        tc.title,
        tc.text || "",
        tc.fields,
      );

      for (const [field, expectedVal] of Object.entries(tc.expected)) {
        const received = result[field];
        expect(received).toBe(expectedVal);
      }
    });
  }

  // 2. Boolean Normalization Exhaustive
  const booleanMatrix = [
    { input: "ja", expected: "Ja" },
    { input: "yes", expected: "Ja" },
    { input: "true", expected: "Ja" },
    { input: "1", expected: "Ja" },
    { input: "Vorhanden", expected: "Ja" },
    { input: "nein", expected: "Nein" },
    { input: "no", expected: "Nein" },
    { input: "false", expected: "Nein" },
    { input: "0", expected: "Nein" },
    { input: "nicht vorhanden", expected: "Nein" },
    { input: "kein", expected: "Nein" },
  ];

  for (const item of booleanMatrix) {
    test(`Boolean Normalization: ${item.input} -> ${item.expected}`, () => {
      const raw = { WLAN: item.input };
      const res = (parser as any).sanitizeSpecs(raw, ["WLAN"]);
      expect(res ? res["WLAN"] : undefined).toBe(item.expected);
    });
  }

  // 3. Hallucination Cleaning
  test("should scrub hallucinations", () => {
    const raw = { "USB-Version": "USB" };
    const res = (parser as any).sanitizeSpecs(raw, ["USB-Version"]);
    expect(res).toBeNull();
  });
});
