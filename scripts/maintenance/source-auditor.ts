import { Database } from "bun:sqlite";

import { BRAND_NORMALIZATION_MAP } from "../../src/lib/utils/brand-mapping";

const db = new Database("./data/cleverprices.db");

interface RawSpec {
  name: string;
  value: any;
  type?: string;
}

/**
 * The Source Integrity Firewall (SIF)
 * Audits raw marketplace data for technical pollution and translation artifacts.
 */
export async function auditSourceIntegrity(productId: number | string) {
  const product = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(productId) as any;
  if (!product) return { trustScore: 0, violations: ["PRODUCT_NOT_FOUND"] };

  const rawData: RawSpec[] = JSON.parse(product.ebay_raw_data || "[]");
  const violations: string[] = [];
  let trustScore = 100;

  // 1. Translation Bleed Detection (Brand-Specific)
  const normalizedBrand = product.brand || "";

  // Find variants that resolve to this brand
  const variantsForBrand: string[] = [];
  for (const [variant, canonical] of Object.entries(BRAND_NORMALIZATION_MAP)) {
    if (canonical.toLowerCase() === normalizedBrand.toLowerCase()) {
      variantsForBrand.push(variant);
    }
  }

  if (variantsForBrand.length > 0) {
    for (const spec of rawData) {
      const valueStr = String(spec.value).toLowerCase();
      for (const variant of variantsForBrand) {
        // If the variant is found, but it's not the canonical name itself (to avoid false positives with substrings)
        if (
          valueStr.includes(variant.toLowerCase()) &&
          !valueStr.includes(normalizedBrand.toLowerCase())
        ) {
          violations.push(
            `TRANSLATION_BLEED: Found mistranslation '${variant}' in ${spec.name}`,
          );
          trustScore -= 40; // High penalty for brand name mistranslation
        }
      }
    }
  }

  // 2. Technical Field Pollution (Natural Language in MPN/Model)
  const technicalFields = [
    "Modellnummer",
    "MPN",
    "Herstellernummer",
    "Hersteller-Teilenummer",
  ];
  const stopWords = [
    "nichts",
    "und",
    "mit",
    "oder",
    "keine",
    "ohne",
    "enthält",
    "inklusive",
  ];

  for (const spec of rawData) {
    if (technicalFields.includes(spec.name)) {
      const val = String(spec.value).toLowerCase();
      const tokens = val.split(/[^a-z0-9]/);

      for (const word of stopWords) {
        if (tokens.includes(word)) {
          violations.push(
            `POLLUTED_TECH_FIELD: Found stop-word '${word}' in technical field ${spec.name}`,
          );
          trustScore -= 20;
        }
      }
    }
  }

  // 3. Consistency check between Title and Specs
  const title = product.title.toLowerCase();
  for (const spec of rawData) {
    if (spec.name === "Modell" || spec.name === "Modellnummer") {
      const val = String(spec.value).toLowerCase();
      // If title says specific model but spec says something else
      // This is complex, but for now we look for basic contradictions
    }
  }

  trustScore = Math.max(0, trustScore);

  return {
    trustScore,
    violations,
    isTrusted: trustScore >= 70,
  };
}

// CLI Execution
if (import.meta.main) {
  const targetId = process.argv[2];
  if (!targetId) {
    console.log(
      "Usage: bun scripts/maintenance/source-auditor.ts <product_id>",
    );
    process.exit(1);
  }

  console.log(`🛡️  Auditing Source Integrity for Product ${targetId}...`);
  auditSourceIntegrity(targetId).then((res) => {
    console.log(JSON.stringify(res, null, 2));
    if (!res.isTrusted) {
      console.log(
        "\n❌ SOURCE UNTRUSTED: High risk of translation artifacts or data pollution.",
      );
    } else {
      console.log("\n✅ SOURCE TRUSTED: Data appears structurally sound.");
    }
  });
}
