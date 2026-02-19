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
  title?: string;
  category?: string;
  officialSpecs?: unknown; // Allow fallback to official/scavenged specs
  specifications?: unknown; // Alias for local props
  officialSpecifications?: unknown; // For Product model compatibility
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
function sortCapacities(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const aVal = parseCapacityToGB(a);
    const bVal = parseCapacityToGB(b);
    if (aVal !== bVal) return aVal - bVal;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

export function extractAttributeGroups(
  variants: VariantLike[],
): Record<string, string[]> {
  const groups: Record<string, Set<string>> = {};

  for (const variant of variants) {
    // robust normalization using all available data
    const normalizedStr = normalizeVariantAttributes({
      variationAttributes: variant.variationAttributes,
      title: variant.title || "",
      category: variant.category || "",
      officialSpecs:
        variant.officialSpecifications ||
        variant.officialSpecs ||
        variant.specifications,
    });

    const attrs = parseVariationAttributes(normalizedStr);
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

  const lowerTitle = title.toLowerCase();

  // Define RAM Patterns (to exclude)
  // Matches: "16GB RAM", "16 GB Arbeitsspeicher", "RAM 16GB", "16GB Gemeinsamer Arbeitsspeicher"
  const ramPatterns = [
    /\b(\d+)\s*(?:gb|tb)\s+(?:ddr\d|lpddr\d|ram|memory|arbeitsspeicher|gemeinsamer\s+arbeitsspeicher)\b/gi,
    /\b(?:ram|arbeitsspeicher|memory)\s*:?\s*(\d+)\s*(?:gb|tb)\b/gi,
  ];

  // Identifies ranges in the string that are RAM
  const ramRanges: [number, number][] = [];
  for (const pattern of ramPatterns) {
    const matches = lowerTitle.matchAll(pattern);
    for (const m of matches) {
      if (m.index !== undefined) {
        ramRanges.push([m.index, m.index + m[0].length]);
      }
    }
  }

  // Find all capacity matches
  const capacityMatches = Array.from(title.matchAll(/(\d+)\s*(GB|TB)/gi));

  let bestStorageMatch: string | null = null;
  let maxGB = 0;

  for (const match of capacityMatches) {
    const val = match[0];
    const gb = parseCapacityToGB(val);
    const start = match.index || 0;
    const end = start + val.length;

    // Check if this match falls clearly inside a RAM range
    const isRam = ramRanges.some((r) => start >= r[0] && end <= r[1]); // Strict overlap

    // Also check immediate proximity (fallback for "16GB, RAM") if not caught by patterns
    const contextCheck = lowerTitle.slice(
      Math.max(0, start - 15),
      Math.min(title.length, end + 15),
    );
    // If "RAM" is very close but separated by comma, it might be ambiguous, but usually RAM is tightly bound.
    // We trust the regex patterns above mostly.

    if (isRam) continue;

    // Heuristic: Storage is typically >= 64GB
    if (gb >= 64) {
      if (gb > maxGB) {
        maxGB = gb;
        bestStorageMatch = val;
      }
    }
  }

  return bestStorageMatch;
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

  // Clean value first so it applies to all branches
  let cleanValue = value.trim();
  // 1. Remove redundant .0 (e.g. 16.0 -> 16)
  cleanValue = cleanValue.replace(/\.0\b/g, "");
  // 2. Ensure exactly one space before units (GB, TB, MB, RAM, SSD)
  cleanValue = cleanValue.replace(/(\d+)\s*(GB|TB|MB|RAM|SSD)/gi, "$1 $2");
  // 3. Normalized casing for units
  cleanValue = cleanValue
    .replace(/\bgb\b/gi, "GB")
    .replace(/\btb\b/gi, "TB")
    .replace(/\bmb\b/gi, "MB")
    .replace(/\bram\b/gi, "RAM")
    .replace(/\bssd\b/gi, "SSD");

  // Unify Keys
  if (
    [
      "storage",
      "interner speicher",
      "kapazität",
      "memory",
      "harddisksize",
    ].includes(k)
  ) {
    return { key: "Storage", value: cleanValue };
  }

  if (["ram", "memory", "arbeitsspeicher", "computermemorysize"].includes(k)) {
    return { key: "RAM", value: cleanValue };
  }

  // Handle Screen Size separately
  if (
    ["size", "größe", "grösse", "bildschirmdiagonale", "display"].includes(k)
  ) {
    // Normalize units to "
    let v = cleanValue
      .replace(/\s*(?:Zoll|Inch|")/i, "")
      .trim()
      .replace(",", ".");
    if (v && /^\d/.test(v)) {
      return { key: "Size", value: v + '"' };
    }
    return { key: "Size", value: cleanValue };
  }
  if (["farbe", "color", "colour"].includes(k)) {
    return { key: "Farbe", value: cleanValue };
  }

  if (k === "style" || k === "konnektivitaet" || k === "connectivity") {
    if (/^w-?fi$/i.test(cleanValue)) cleanValue = "Wi-Fi";
    if (/^cellular|lte|5g$/i.test(cleanValue)) cleanValue = "Cellular";
    return { key: "Connectivity", value: cleanValue };
  }

  return { key, value: cleanValue };
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
  officialSpecs?: Record<string, unknown> | unknown;
}): string {
  const variationAttributes = v.variationAttributes || "";
  const title = v.title || "";
  const category = v.category || "";
  const specs = (v.officialSpecs as Record<string, unknown>) || {};

  const isSmartphone =
    category === "smartphones" || title.toLowerCase().includes("smartphone");
  const isStorage =
    ["ssds", "hard-drives", "speicherkarten", "external-storage"].includes(
      category,
    ) ||
    title.toLowerCase().includes("ssd ") ||
    title.toLowerCase().includes("hdd ");

  // 0. TRUSTED DB OVERRIDE
  // If we have explicit Official Specs, use them!
  const overrides: Record<string, string> = {};
  if (specs["Farbe"] || specs["Produktfarbe"] || specs["Color"]) {
    overrides["Farbe"] = String(
      specs["Farbe"] || specs["Produktfarbe"] || specs["Color"],
    );
  }
  if (
    specs["Interner Speichertyp"] === "SSD" ||
    specs["Speicher"] ||
    specs["Speicherkapazität"] ||
    specs["HDD Kapazität"] ||
    specs["SSD Speicherkapazität"]
  ) {
    // Only grab capacity, not type
    const capacity =
      specs["Speicherkapazität"] ||
      specs["HDD Kapazität"] ||
      specs["SSD Speicherkapazität"] ||
      specs["Kapazität"];
    if (capacity) overrides["Storage"] = String(capacity);
  }

  // 1. Trust Official Specs for RAM
  if (
    specs["Arbeitsspeicher"] ||
    specs["Arbeitsspeicher (RAM)"] ||
    specs["RAM"] ||
    specs["Memory"] ||
    specs["Speicher"] // Ambiguous, check if valid RAM
  ) {
    const val =
      specs["Arbeitsspeicher"] ||
      specs["Arbeitsspeicher (RAM)"] ||
      specs["RAM"] ||
      specs["Memory"] ||
      specs["Speicher"];
    if (val && typeof val === "string") {
      // Basic validation to ensure it looks like "16GB" not "512GB"
      const gb = parseCapacityToGB(val);
      if (gb > 0 && gb < 128) {
        // Assume <128GB is RAM for most consumer devices
        overrides["RAM"] = val;
      }
    }
  }

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
      // DEDUPLICATION: If a value like "1 TB" is in "Farbe" or "Style", check if it's actually Storage
      if (
        (result.key === "Farbe" || result.key === "Style") &&
        /^\d+\s*(GB|TB|MB)$/i.test(result.value)
      ) {
        // If Storage is not yet set, move it to Storage
        if (!normalized["Storage"]) {
          normalized["Storage"] = result.value;
          return;
        }
        // If it matches existing Storage, just drop it
        if (
          parseCapacityToGB(normalized["Storage"]) ===
          parseCapacityToGB(result.value)
        ) {
          return;
        }
      }
      normalized[result.key] = result.value;
    }
  });

  // Apply Overrides (Trust DB) but ONLY if specific variant data is missing
  Object.entries(overrides).forEach(([k, v]) => {
    if (!normalized[k]) {
      normalized[k] = v;
    }
  });

  // --- PROACTIVE RECOVERY ---
  // If Farbe or Storage are missing, try to recover them from the title
  if (!normalized["Storage"]) {
    const recovered = extractRealStorageFromTitle(title);
    if (recovered) {
      const result = strategy("Storage", recovered, context);
      if (result) normalized[result.key] = result.value;
    }
  }

  // 2. RAM Recovery (Check Title if missing)
  if (!normalized["RAM"]) {
    const recoveredRam = extractRamFromTitle(title);
    if (recoveredRam) {
      normalized["RAM"] = recoveredRam;
    }
  }

  // Generic Color Recovery (Title Suffix)
  // Logic: "Product Name - ColorName"
  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    const candidate = parts[parts.length - 1].trim();

    // Check if current color is more generic than title candidate
    const currentColor = normalized["Farbe"] || "";
    const isGeneric =
      !currentColor ||
      ["blau", "schwarz", "weiss", "rot", "grau", "silber", "gold"].includes(
        currentColor.toLowerCase(),
      );

    if (candidate.length < 25 && !/\d{2,}/.test(candidate)) {
      const ignored = [
        "Standard",
        "Box",
        "Neu",
        "OVP",
        "Deal",
        "Angebot",
        "EU",
      ];
      if (!ignored.includes(candidate)) {
        const result = strategy("Farbe", candidate, context);
        if (
          result &&
          (isGeneric || result.value.length > currentColor.length)
        ) {
          normalized[result.key] = result.value;
        }
      }
    }
  }

  if (isSmartphone && !normalized["Farbe"]) {
    // For smartphones, we almost always want a color.
    // We pass a dummy "Titanium" to the strategy to trigger its title recovery logic.
    const result = strategy("Farbe", "Titanium", context);
    if (result) normalized[result.key] = result.value;
  }

  // --- CROSS-FIELD DEDUPLICATION ---
  // Drop "Style" if it's already covered by other fields (e.g. Style: 16GB RAM vs RAM: 16GB)
  if (normalized["Style"]) {
    const styleVal = normalized["Style"].toLowerCase();
    const isRedundant = Object.entries(normalized).some(([k, v]) => {
      if (k === "Style") return false;
      const otherVal = String(v).toLowerCase();
      // Case 1: Style is a superset of RAM/Color (e.g. "16 GB Gemeinsamer Arbeitsspeicher" vs "16 GB")
      // Case 2: Style is exactly the same as another field
      return styleVal.includes(otherVal) || otherVal.includes(styleVal);
    });

    if (isRedundant) {
      delete normalized["Style"];
    }
  }

  // Return sorted string to ensure identical specs produce identical keys
  return Object.entries(normalized)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

/**
 * Extract RAM from title (e.g. "16GB RAM", "32GB Arbeitsspeicher")
 */
function extractRamFromTitle(title: string | undefined): string | null {
  if (!title) return null;
  const lowerTitle = title.toLowerCase();

  const ramPatterns = [
    /\b(\d+)\s*(?:gb)\s+(?:ddr\d|lpddr\d|ram|memory|arbeitsspeicher|gemeinsamer\s+arbeitsspeicher)\b/gi,
    /\b(?:ram|arbeitsspeicher|memory)\s*:?\s*(\d+)\s*(?:gb)\b/gi,
  ];

  for (const pattern of ramPatterns) {
    const match = pattern.exec(lowerTitle);
    if (match) {
      // Return normalized "16 GB"
      return `${match[1]} GB`;
    }
  }
  return null;
}
