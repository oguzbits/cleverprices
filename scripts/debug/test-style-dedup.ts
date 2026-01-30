import { normalizeVariantAttributes } from "../../src/lib/utils/variants";

const cases = [
  {
    name: "MacBook Air (Unified Memory)",
    title:
      'Apple MacBook Air (13", Apple M4 Chip, 16GB Gemeinsamer Arbeitsspeicher, 256 GB) - Mitternacht',
    attributes:
      "Farbe: Mitternacht; RAM: 16 GB; Storage: 256 GB SSD; Style: 16 GB Gemeinsamer Arbeitsspeicher",
    category: "notebooks",
  },
  {
    name: "Redundant Style (Color)",
    title: "iPhone 15 Black",
    attributes: "Farbe: Schwarz; Style: Black",
    category: "smartphones",
  },
];

console.log("🚀 Testing Style Deduplication Logic...\n");

cases.forEach((c) => {
  const result = normalizeVariantAttributes({
    title: c.title,
    variationAttributes: c.attributes,
    category: c.category,
  });

  console.log(`--- ${c.name} ---`);
  console.log(`Input:  ${c.attributes}`);
  console.log(`Output: ${result}`);

  const hasStyle = result.toLowerCase().includes("style:");
  if (!hasStyle) {
    console.log("✅ Deduplicated successfully (Style dropped)");
  } else {
    console.log("❌ Style still present");
  }
  console.log("");
});
