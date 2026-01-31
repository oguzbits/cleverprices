import { describe, expect, it } from "bun:test";
import { normalizeVariantAttributes } from "../src/lib/utils/variants";

describe("Universal Variant Extraction", () => {
  const testCases = [
    {
      category: "notebooks",
      title: 'Apple MacBook Air 15" M2 8GB 512GB SSD Mitternacht',
      expectedStorage: "512 GB",
    },
    {
      category: "consoles",
      title: "Sony PlayStation 5 Slim 1TB Edition",
      expectedStorage: "1 TB",
    },
    {
      category: "smartphones", // Control case
      title: "Samsung Galaxy S24 256GB Black",
      expectedStorage: "256 GB",
    },
  ];

  testCases.forEach((tc) => {
    it(`should extract ${tc.expectedStorage} from ${tc.category} title: ${tc.title}`, () => {
      const result = normalizeVariantAttributes({
        title: tc.title,
        category: tc.category,
        variationAttributes: "", // Simulate missing attributes
      });

      console.log(`[${tc.category}] Result: ${result}`);
      expect(result).toContain(tc.expectedStorage);
    });
  });

  it("should handles kitchen appliances gracefully (no crash)", () => {
    const result = normalizeVariantAttributes({
      title: "KitchenAid Artisan Red",
      category: "kitchen",
      variationAttributes: "",
    });
    expect(result).toBeDefined();
  });
});
