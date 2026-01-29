import { normalizeVariantAttributes } from "../src/lib/utils/variants";

console.log("--- Verifying Universal Variant Extraction ---");

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
    category: "kitchen", // Random category
    title: "KitchenAid Artisan 5KSM175PS 4.8L Empire Rot",
    // We don't have color extraction for non-smartphones yet except explicit,
    // but let's check if it crashes or if it handles things gracefully.
    // Actually our logic mainly recovers Storage.
    expectedStorage: null,
  },
];

let discrepancies = 0;

try {
  testCases.forEach((tc) => {
    const result = normalizeVariantAttributes({
      title: tc.title,
      category: tc.category,
      variationAttributes: "", // Simulate missing attributes
    });

    console.log(`\nCategory: ${tc.category}`);
    console.log(`Title: ${tc.title}`);
    console.log(`Result: "${result}"`);

    if (tc.expectedStorage) {
      if (!result.includes(tc.expectedStorage)) {
        console.error(
          `FAILURE: Expected ${tc.expectedStorage} in result. Got: ${result}`,
        );
        discrepancies++;
      } else {
        console.log("SUCCESS: Storage extracted.");
      }
    }
  });
} catch (error) {
  console.error("CRITICAL SCRIPT ERROR:", error);
  process.exit(1);
}

if (discrepancies === 0) {
  console.log("\nAll Universal Variant Tests Passed ✅");
} else {
  console.log(`\n${discrepancies} Tests Failed ❌`);
  process.exit(1);
}
