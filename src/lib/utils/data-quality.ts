import { getCategorySchema } from "../data-quality/schemas";
import { type SiblingConsensus } from "./product-identity";

export interface DataQualityMetrics {
  completeness: number; // 0-100
  validity: number; // 0-100
  consistency: number; // 0-100
  healthScore: number; // 0-100 (weighted average)
}

export function calculateProductHealth(
  product: {
    category: string | null;
    officialSpecifications: string | null;
    title: string | null;
    brand: string | null;
  },
  consensus?: SiblingConsensus,
): DataQualityMetrics {
  const category = product.category || "generic";
  const schema = getCategorySchema(category);
  const specs = product.officialSpecifications
    ? JSON.parse(product.officialSpecifications)
    : {};

  let totalWeight = 0;
  let achievedWeight = 0;
  let validWeight = 0;

  if (schema) {
    for (const [key, attr] of Object.entries(schema.attributes)) {
      totalWeight += attr.weight;

      const value = specs[key];
      if (value !== undefined && value !== null && value !== "") {
        achievedWeight += attr.weight;

        // Pattern validation
        if (attr.patterns && attr.patterns.length > 0) {
          const isValid = attr.patterns.some((p) => p.test(String(value)));
          if (isValid) {
            validWeight += attr.weight;
          }
        } else {
          validWeight += attr.weight;
        }
      }
    }
  } else {
    // Generic fallback for unknown categories
    totalWeight = 10;
    achievedWeight =
      product.brand && product.title && Object.keys(specs).length > 0 ? 10 : 5;
    validWeight = achievedWeight;
  }

  const completeness =
    totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;
  const validity =
    achievedWeight > 0 ? (validWeight / achievedWeight) * 100 : 100;

  // Consistency (Consensus-based)
  let consistency = 100;
  if (consensus && consensus.total > 1) {
    const specValues = Object.values(specs)
      .filter((v) => typeof v === "string" && v.length < 50)
      .join(" ");

    const tokens = specValues
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2);

    if (tokens.length > 0) {
      let consistentTokens = 0;
      for (const token of tokens) {
        const freq = (consensus.tokenCounts[token] || 0) / consensus.total;
        if (freq >= 0.7) {
          consistentTokens++;
        }
      }
      consistency = (consistentTokens / tokens.length) * 100;
    }
  }

  // Final Health Score (Weighted)
  const healthScore = Math.round(
    completeness * 0.4 + validity * 0.4 + consistency * 0.2,
  );

  return {
    completeness: Math.round(completeness),
    validity: Math.round(validity),
    consistency: Math.round(consistency),
    healthScore,
  };
}
