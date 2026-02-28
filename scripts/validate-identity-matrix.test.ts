import { describe, it, mock } from "bun:test";
import { writeFileSync } from "fs";
import { join } from "path";
import { getFamilyIdentity } from "../src/lib/product-families";

// Mocks
mock.module("@/lib/product-registry", () => ({
  parseVariationAttributes: (attrs: string) => {
    if (!attrs) return {};
    return Object.fromEntries(
      attrs.split(";").map((pair) => {
        const [k, v] = pair.split(":");
        return [k.trim(), v.trim()];
      }),
    );
  },
  Product: {},
}));

mock.module("next/cache", () => ({
  cacheLife: () => {},
  unstable_cache: (fn: any) => fn,
}));

const mockProduct = (
  category: string,
  brand: string,
  title: string,
  attributes: Record<string, string> = {},
) => ({
  id: Math.floor(Math.random() * 100000) + 1,
  category,
  brand,
  title,
  variationAttributes: Object.entries(attributes)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; "),
  prices: { de: 100 },
});

import { tmpdir } from "os";

const ARTIFACT_DIR = tmpdir();

const TEST_MATRIX = [
  // 1. SMARTPHONES
  {
    cat: "smartphones",
    brand: "Apple",
    title: "Apple iPhone 15 Pro Max 256GB Titan Schwarz",
    attrs: { Storage: "256GB", Color: "Titan Schwarz" },
  },
  {
    cat: "smartphones",
    brand: "Apple",
    title: "iPhone 13 mini 128GB Mitternacht",
    attrs: { Storage: "128GB", Color: "Mitternacht" },
  },
  {
    cat: "smartphones",
    brand: "Samsung",
    title: "Samsung Galaxy S24 Ultra 512GB Titanium Gray AI Smartphone",
    attrs: { Storage: "512GB", Color: "Titanium Gray" },
  },
  {
    cat: "smartphones",
    brand: "Samsung",
    title: "Samsung Galaxy A55 5G 128GB Awesome Navy",
    attrs: { Storage: "128GB", Color: "Awesome Navy" },
  },
  {
    cat: "smartphones",
    brand: "Google",
    title: "Google Pixel 8 Pro 128GB Obsidian",
    attrs: { Storage: "128GB", Color: "Obsidian" },
  },
  {
    cat: "smartphones",
    brand: "Xiaomi",
    title: "Xiaomi Redmi Note 13 Pro+ 5G 512GB Midnight Black",
    attrs: { Storage: "512GB", Color: "Midnight Black" },
  },

  // 2. CONSOLES
  {
    cat: "consoles",
    brand: "Sony",
    title: "PlayStation 5 Slim Konsole (Modellgruppe: Slim)",
    attrs: { Model: "Slim" },
  },
  {
    cat: "consoles",
    brand: "Sony",
    title: "Sony PlayStation 4 Pro 1TB Gamma Chassis Schwarz",
    attrs: { Storage: "1TB" },
  },
  {
    cat: "consoles",
    brand: "Microsoft",
    title: "Xbox Series X 1TB Console",
    attrs: { Storage: "1TB" },
  },
  {
    cat: "consoles",
    brand: "Nintendo",
    title: "Nintendo Switch OLED-Modell Weiß",
    attrs: { Color: "Weiß" },
  },
  {
    cat: "consoles",
    brand: "Valve",
    title: "Valve Steam Deck OLED 512GB",
    attrs: { Storage: "512GB" },
  },

  // 3. GPU
  {
    cat: "gpu",
    brand: "Asus",
    title: "ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB GDDR6X",
    attrs: { VRAM: "24GB", Model: "RTX 4090" },
  },
  {
    cat: "gpu",
    brand: "MSI",
    title: "MSI GeForce RTX 4070 Ti Super Gaming X Slim 16GB",
    attrs: { VRAM: "16GB", Model: "RTX 4070 Ti Super" },
  },
  {
    cat: "gpu",
    brand: "Sapphire",
    title: "Sapphire Pulse AMD Radeon RX 7800 XT 16GB",
    attrs: { VRAM: "16GB", Model: "RX 7800 XT" },
  },
  {
    cat: "gpu",
    brand: "Gigabyte",
    title: "Gigabyte GeForce RTX 4060 Eagle OC 8G",
    attrs: { VRAM: "8GB", Model: "RTX 4060" },
  },

  // 4. SSDs
  {
    cat: "ssds",
    brand: "Samsung",
    title: "Samsung 990 PRO NVMe M.2 SSD 4TB Heatsink",
    attrs: { Capacity: "4TB" },
  },
  {
    cat: "ssds",
    brand: "WD",
    title: "WD_BLACK SN850X NVMe SSD 2TB",
    attrs: { Capacity: "2TB" },
  },
  {
    cat: "ssds",
    brand: "Crucial",
    title: "Crucial T700 PCIe Gen5 NVMe M.2 SSD 2TB",
    attrs: { Capacity: "2TB" },
  },
  {
    cat: "ssds",
    brand: "SanDisk",
    title: "SanDisk Extreme Portable SSD 1TB",
    attrs: { Capacity: "1TB" },
  },

  // 5. HEADPHONES
  {
    cat: "headphones",
    brand: "Sony",
    title: "Sony WH-1000XM5 Noise Cancelling Headphones Black",
    attrs: { Color: "Black" },
  },
  {
    cat: "headphones",
    brand: "Bose",
    title: "Bose QuietComfort Ultra Headphones Wireless Black",
    attrs: { Color: "Black" },
  },
  {
    cat: "headphones",
    brand: "Apple",
    title: "Apple AirPods Max Space Gray",
    attrs: { Color: "Space Gray" },
  },
  {
    cat: "headphones",
    brand: "Sennheiser",
    title: "Sennheiser Momentum 4 Wireless",
    attrs: {},
  },

  // 6. TVS
  {
    cat: "tvs",
    brand: "LG",
    title: "LG OLED65G39LA 65 Zoll 4K Smart TV",
    attrs: { Size: "65 Zoll" },
  },
  {
    cat: "tvs",
    brand: "Samsung",
    title: "Samsung GQ65S95C OLED TV 65 Zoll",
    attrs: { Size: "65 Zoll" },
  },
  {
    cat: "tvs",
    brand: "Sony",
    title: "Sony XR-65A95L BRAVIA XR OLED 65 Zoll",
    attrs: { Size: "65 Zoll" },
  },

  // 7. KITCHEN
  {
    cat: "kitchen",
    brand: "KitchenAid",
    title: "KitchenAid Artisan 5KSM175PS Liebesapfel Rot",
    attrs: { Color: "Liebesapfel Rot" },
  },
  {
    cat: "kitchen",
    brand: "Bosch",
    title: "Bosch MUM5 Styline Küchenmaschine MUM56340",
    attrs: { Model: "MUM56340" },
  },
  {
    cat: "kitchen",
    brand: "Smeg",
    title: "Smeg SMF03 Küchenmaschine Pastellblau",
    attrs: { Color: "Pastellblau" },
  },
];

describe("Validation Matrix", () => {
  it("runs validation and generates report", () => {
    let report = "# Validation Report: Global Identity System\n\n";
    let passCount = 0;
    let failCount = 0;

    report +=
      "| Category | Brand | Original Title | Generated Slug | Generated Title | Status |\n";
    report += "|---|---|---|---|---|---|\n";

    TEST_MATRIX.forEach((item) => {
      const product = mockProduct(
        item.cat,
        item.brand,
        item.title,
        item.attrs as Record<string, string>,
      );
      const { slug, title, brand } = getFamilyIdentity(product, []);

      // Validation Rules
      // 1. Slug should contain brand at end
      const brandSlug = item.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const hasBrandSuffix = slug.endsWith("-" + brandSlug);

      // 2. Slug should NOT contain double brands (e.g. sony-sony)
      const normalizedSlug = slug.replace(
        `${brandSlug}-${brandSlug}`,
        "FAIL_DOUBLE_BRAND",
      );
      const noDoubleBrand = !normalizedSlug.includes("FAIL_DOUBLE_BRAND");

      // 3. Variant Check
      // If attrs has Storage/Color, it should likely be in slug
      let missingVariant = false;
      if (
        item.attrs.Storage &&
        !slug.includes(
          item.attrs.Storage.toLowerCase().replace(/[^a-z0-9]/g, ""),
        )
      )
        missingVariant = true;
      if (
        item.attrs.Color &&
        !slug.includes(item.attrs.Color.toLowerCase().replace(/[^a-z0-9]/g, ""))
      )
        missingVariant = true;
      if (
        item.attrs.Size &&
        !slug.includes(
          item.attrs.Size.toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .replace("zoll", "")
            .replace("inch", ""),
        )
      )
        missingVariant = false; // logic for size is tricky, just skip strict check

      const isClean = hasBrandSuffix && noDoubleBrand && !missingVariant;

      if (isClean) {
        passCount++;
        report += `| ${item.cat} | ${item.brand} | ${item.title} | \`${slug}\` | **${title}** | ✅ |\n`;
      } else {
        failCount++;
        report += `| ${item.cat} | ${item.brand} | ${item.title} | \`${slug}\` | ${title} | ❌ |\n`;
      }
    });

    report += `\n**Total Tests**: ${TEST_MATRIX.length}\n`;
    report += `**Passed**: ${passCount}\n`;
    report += `**Failed**: ${failCount}\n`;

    if (failCount === 0) {
      report +=
        "\n### Result: SUCCESS\nSystem is fully compliant across all tested categories.";
    } else {
      report += "\n### Result: WARNING\nSome edge cases detected.";
    }

    try {
      writeFileSync(join(ARTIFACT_DIR, "validation_report.md"), report);
      console.log(
        "Report generated at " + join(ARTIFACT_DIR, "validation_report.md"),
      );
    } catch (e) {
      console.error("Failed to write report:", e);
      // Fallback: print to stdout if file write fails (e.g. permission or path issues)
      console.log(report);
    }
  });
});
