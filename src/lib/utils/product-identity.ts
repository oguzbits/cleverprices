import type { Product } from "@/lib/product-registry";
import { parseVariationAttributes } from "./variants";

export interface ProductIdentity {
  brand: string;
  model: string;
  fullModel: string;
  shortModel: string;
  variantLabel: string;
  displayTitle: string;
}

/**
 * Universally determines the identity of a product across all categories.
 * Prioritizes structured head detection over raw title parsing.
 */
export function getProductIdentity(product: Partial<Product>): ProductIdentity {
  const brand = (product.brand || "").trim();
  const title = (product.title || "").trim();

  // 1. Initial Head Extraction
  // We take the head of the title (before any dash, paren, pipe, or colon)
  let head = title.split(/ \- | \(| \||: |,/)[0].trim();

  // 2. Brand Normalization
  // Ensure the brand is at the start and not duplicated
  if (brand && head.toLowerCase().includes(brand.toLowerCase())) {
    const brandRegex = new RegExp(`^${brand}\\s+`, "i");
    if (!brandRegex.test(head)) {
      // If brand is present but not at start, move it
      const cleanLabel = head.replace(new RegExp(brand, "gi"), "").trim();
      head = `${brand} ${cleanLabel}`;
    }
  } else if (brand) {
    head = `${brand} ${head}`;
  }

  // 3. Variant Token Subtraction
  // Collect tokens from variation attributes to subtract from the model name
  const variantMap = parseVariationAttributes(product.variationAttributes);
  const variantTokens = new Set<string>();

  Object.values(variantMap).forEach((v) => {
    if (typeof v === "string") {
      v.split(/\s+/).forEach((t) =>
        variantTokens.add(t.toLowerCase().replace(/[^a-z0-9]/g, "")),
      );
    }
  });

  const words = head.split(/\s+/);
  const cleanModelWords: string[] = [];

  words.forEach((word, index) => {
    const lower = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (index === 0) {
      cleanModelWords.push(word);
      return;
    }

    // Keep generational keywords that are often part of a model (Pro, Max, etc.)
    const isModelKeyword = [
      "pro",
      "max",
      "ultra",
      "plus",
      "mini",
      "lite",
    ].includes(lower);
    if (isModelKeyword) {
      cleanModelWords.push(word);
      return;
    }

    // Subtract if it's a identified variant token
    if (variantTokens.has(lower)) return;

    // Subtract standalone capacity markers
    if (/^\d+(gb|tb|mb|wh|w)$/i.test(lower)) return false;

    cleanModelWords.push(word);
  });

  const fullModel = cleanModelWords.join(" ").replace(/\s+/g, " ").trim();

  // 4. Variant Labeling
  const variantItems: string[] = [];
  const priorityKeys = ["Storage", "Size", "Color", "Farbe", "Style"];
  priorityKeys.forEach((k) => {
    const val = variantMap[k];
    if (val && typeof val === "string") variantItems.push(val);
  });
  const variantLabel = variantItems.join(" ").trim();

  return {
    brand,
    model: fullModel.replace(new RegExp(`^${brand}`, "i"), "").trim(),
    fullModel,
    shortModel: fullModel,
    variantLabel,
    displayTitle: variantLabel ? `${fullModel} (${variantLabel})` : fullModel,
  };
}
