/**
 * Variant Utilities
 *
 * Client-safe utility functions for parsing and working with product variant data.
 * These are separated from product-registry.ts to avoid importing server-only code.
 */

/**
 * Minimal variant info needed for attribute extraction
 */
interface VariantLike {
  variationAttributes?: string;
}

/**
 * Parse variation attributes string into key-value pairs
 * Input: "Color: Cosmic Orange; Storage: 2000GB"
 * Output: { Color: "Cosmic Orange", Storage: "2000GB" }
 */
export function parseVariationAttributes(
  attrs: string | undefined,
): Record<string, string> {
  if (!attrs) return {};
  return Object.fromEntries(
    attrs
      .split(";")
      .map((pair) => {
        const [key, ...valueParts] = pair.split(":");
        const value = valueParts.join(":").trim(); // Handle values that might contain ":"
        return [key?.trim(), value];
      })
      .filter(([key, value]) => key && value),
  );
}

/**
 * Helper: Parse capacity string into numeric GB for comparison
 * "256 GB" -> 256
 * "1 TB" -> 1024
 * "12 GB" -> 12
 */
export function parseCapacityToGB(val: string): number {
  const v = val.toLowerCase().trim();
  const num = parseFloat(v.match(/[0-9.]+/)?.[0] || "0");
  if (v.includes("tb")) return num * 1024;
  if (v.includes("mb")) return num / 1024;
  return num; // Default GB
}

/**
 * Natural sort for capacity-like strings
 */
export function sortCapacities(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const aVal = parseCapacityToGB(a);
    const bVal = parseCapacityToGB(b);
    if (aVal !== bVal) return aVal - bVal;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

/**
 * Extract unique attribute values from a list of variants
 */
export function extractAttributeGroups(
  variants: VariantLike[],
): Record<string, string[]> {
  const groups: Record<string, Set<string>> = {};

  for (const variant of variants) {
    const attrs = parseVariationAttributes(variant.variationAttributes);
    for (const [key, value] of Object.entries(attrs)) {
      if (!groups[key]) groups[key] = new Set();
      groups[key].add(value);
    }
  }

  return Object.fromEntries(
    Object.entries(groups).map(([key, valueSet]) => {
      const values = Array.from(valueSet);
      const k = key.toLowerCase();

      // Capacity-aware sorting for storage/size related keys
      if (
        k.includes("storage") ||
        k.includes("speicher") ||
        k.includes("kapazität") ||
        k.includes("memory") ||
        k.includes("size")
      ) {
        return [key, sortCapacities(values)];
      }

      return [key, values.sort()];
    }),
  );
}
/**
 * Smartphone Storage Detection Helper
 * Titles often contain "12 GB RAM, 256 GB Speicher" or even "Interner Speicher 256".
 */
export function extractRealStorageFromTitle(
  title: string | undefined,
): string | null {
  if (!title) return null;

  // 1. Try standard GB/TB matches first
  const capacityMatches = Array.from(title.matchAll(/(\d+)\s*(GB|TB)/gi));
  let bestMatch: string | null = null;
  let maxGB = 0;

  for (const match of capacityMatches) {
    const val = match[0];
    const gb = parseCapacityToGB(val);

    // Heuristic: Storage is typically >= 64GB and a power of 2 or common tier
    const isStandardTier = [64, 128, 256, 512, 1024, 2048].includes(gb);
    if (gb >= 64) {
      if (isStandardTier || gb > maxGB) {
        maxGB = gb;
        bestMatch = val;
      }
    }
  }

  if (bestMatch) return bestMatch;

  // 2. Fallback: Look for numbers >= 64 after "Speicher", "Memory", "Internal"
  const rawMatches = Array.from(
    title.matchAll(/(?:speicher|memory|internal|interner)\D*(\d{3,4})/gi),
  );
  for (const match of rawMatches) {
    const num = parseInt(match[1]);
    if ([64, 128, 256, 512, 1024].includes(num)) {
      return num >= 1024 ? `${num / 1024} TB` : `${num} GB`;
    }
  }

  return null;
}
/**
 * Robust Attribute Normalization for Smartphones & Tech
 * Unifies keys (Farbe/Color -> Farbe, Storage/Speicher -> Storage)
 * and repairs mislabeled specs (RAM vs Storage) using title recovery.
 */
/**
 * Normalization Strategies
 */
type NormalizationStrategy = (
  key: string,
  value: string,
  context: { title: string; category: string },
) => { key: string; value: string } | null;

// 1. Universal Strategy (Base rules for all categories)
const UniversalStrategy: NormalizationStrategy = (key, value) => {
  const k = key.toLowerCase();

  // Unify Keys
  if (
    [
      "storage",
      "interner speicher",
      "size",
      "größe",
      "grösse",
      "kapazität",
      "memory",
    ].includes(k)
  ) {
    return { key: "Storage", value };
  }
  if (["farbe", "color", "colour"].includes(k)) {
    return { key: "Farbe", value };
  }

  // Clean values
  return { key, value: value.trim() };
};

// 2. Tech Storage Strategy (SSDs, HDDs, SD Cards)
// Standardizes capacity units
const TechStorageStrategy: NormalizationStrategy = (key, value) => {
  const universal = UniversalStrategy(key, value, { title: "", category: "" }); // Base transform
  if (!universal) return null;

  if (universal.key === "Storage") {
    const gb = parseCapacityToGB(universal.value);
    if (gb > 0) {
      // Standardize: "512gb" -> "512 GB", "1024" -> "1 TB"
      if (gb >= 1024) universal.value = `${gb / 1024} TB`;
      else universal.value = `${gb} GB`;
    }
  }

  return universal;
};

// 3. Smartphone Strategy (Complex rules for S25, etc.)
const SmartphoneStrategy: NormalizationStrategy = (key, value, ctx) => {
  const universal = UniversalStrategy(key, value, ctx);
  if (!universal) return null;

  if (universal.key === "Storage") {
    const gb = parseCapacityToGB(universal.value);

    // RAM Recovery logic (if < 64GB, check title)
    if (gb > 0 && gb < 64) {
      const real = extractRealStorageFromTitle(ctx.title);
      if (real) universal.value = real;
    }
    // Format standardization
    else if (gb >= 64) {
      if (gb >= 1024) universal.value = `${gb / 1024} TB`;
      else universal.value = `${gb} GB`;
    }
  } else if (universal.key === "Farbe") {
    // S25 Ultra Specific Color Recovery
    let effectiveColor = universal.value;

    // Aggressively check title if generic Titanium is mentioned
    if (
      effectiveColor.toLowerCase().includes("titan") ||
      effectiveColor.toLowerCase().includes("titanium")
    ) {
      const specifics = [
        "Silverblue",
        "Whitesilver",
        "Gray",
        "Black",
        "Schwarz",
        "Grau",
        "Silberblau",
        "Weiss",
        "Silber",
        "Silver",
        "Titanblau",
        "Titanblue",
      ];
      for (const spec of specifics) {
        if (ctx.title.toLowerCase().includes(spec.toLowerCase())) {
          effectiveColor = spec;
          break;
        }
      }
    }

    const low = effectiveColor.toLowerCase();

    // Exact Mapping
    if (
      low.includes("silverblue") ||
      low.includes("silberblau") ||
      low.includes("titanblau") ||
      low.includes("titanblue")
    ) {
      universal.value = "Titanium Silverblue";
    } else if (
      low.includes("whitesilver") ||
      low.includes("white") ||
      low.includes("weiss") ||
      low.includes("silver") ||
      low.includes("silber")
    ) {
      universal.value = "Titanium Whitesilver";
    } else if (low.includes("black") || low.includes("schwarz")) {
      universal.value = "Titanium Black";
    } else if (low.includes("gray") || low.includes("grau")) {
      universal.value = "Titanium Gray";
    } else {
      // Fallback for generics
      if (low === "titanium" || low === "titan") {
        universal.value = "Titanium Gray";
      } else {
        universal.value = effectiveColor;
      }
    }
  }

  return universal;
};

/**
 * Main Normalization Router
 */
export function normalizeVariantAttributes(v: {
  title: string;
  variationAttributes?: string;
  category?: string;
}): string {
  const variationAttributes = v.variationAttributes || "";
  const title = v.title || "";
  const category = v.category || "";

  const isSmartphone =
    category === "smartphones" || title.toLowerCase().includes("smartphone");
  const isStorage =
    ["ssds", "hard-drives", "speicherkarten", "external-storage"].includes(
      category,
    ) ||
    title.toLowerCase().includes("ssd ") ||
    title.toLowerCase().includes("hdd ");

  // If both are missing and it's not a tech category, we can't do much.
  if (!variationAttributes && !isSmartphone && !isStorage) return "";

  const attrs = parseVariationAttributes(variationAttributes);
  const context = { title, category };

  // Select Strategy
  let strategy = UniversalStrategy;
  if (isSmartphone) strategy = SmartphoneStrategy;
  else if (isStorage) strategy = TechStorageStrategy;

  const normalized: Record<string, string> = {};

  Object.entries(attrs).forEach(([k, v]) => {
    const result = strategy(k, v, context);
    if (result) {
      normalized[result.key] = result.value;
    }
  });

  // --- PROACTIVE RECOVERY ---
  // If Farbe or Storage are missing, try to recover them from the title
  // This ensures all variants in the family have the same keys for robust filtering.
  if (isSmartphone || isStorage) {
    if (!normalized["Storage"]) {
      const recovered = extractRealStorageFromTitle(title);
      if (recovered) {
        const result = strategy("Storage", recovered, context);
        if (result) normalized[result.key] = result.value;
      }
    }

    if (isSmartphone && !normalized["Farbe"]) {
      // For smartphones, we almost always want a color.
      // We pass a dummy "Titanium" to the strategy to trigger its title recovery logic.
      const result = strategy("Farbe", "Titanium", context);
      if (result) normalized[result.key] = result.value;
    }
  }

  // Return sorted string to ensure identical specs produce identical keys
  return Object.entries(normalized)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}
