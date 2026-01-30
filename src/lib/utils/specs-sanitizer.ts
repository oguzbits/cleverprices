const GENERIC_VALUE_BLACKLIST = [
  "handy",
  "smartphone",
  "tablet",
  "notebook",
  "laptop",
  "pc",
  "computer",
  "monitor",
  "tv",
  "fernseher",
  "andere",
  "other",
  "undefined",
  "n/a",
  "-",
  ".",
  "diverse",
  "standard",
];

/**
 * Decodes common HTML/XML entities found in marketplace data.
 */
function decodeEntities(str: string): string {
  if (!str) return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&micro;/g, "µ")
    .replace(/&deg;/g, "°")
    .replace(/&plusmn;/g, "±")
    .replace(/&reg;/g, "®")
    .replace(/&copy;/g, "©")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

const GENERIC_MODEL_VALUES = [
  ...GENERIC_VALUE_BLACKLIST,
  "neu",
  "universal",
  "original",
];

export function sanitizeSpecValue(
  key: string,
  value: string,
  brand?: string,
): string | null {
  if (!value) return null;
  const lowerVal = value.toLowerCase().trim();
  const lowerKey = key.toLowerCase().trim();

  // 1. Drop blacklisted generic values
  if (GENERIC_VALUE_BLACKLIST.includes(lowerVal)) return null;

  // 2. Specific "Modell" sanitization
  if (lowerKey === "modell" || lowerKey === "model") {
    if (GENERIC_MODEL_VALUES.some((v) => lowerVal.includes(v))) return null;

    // If Model just repeats the Brand, it's redundant/noise
    if (brand && lowerVal === brand.toLowerCase()) return null;

    // Avoid extremely short generic models unless they contain a digit
    if (lowerVal.length < 3 && !/\d/.test(lowerVal)) return null;
  }

  // 3. "Style" Sanitization (Often redundant noise)
  if (lowerKey === "style") {
    // If Style is just a single word that looks like a color or generic unit, it's usually noise
    if (lowerVal.length < 3) return null;

    // If it contains "gemeinsamer arbeitsspeicher" (Unified Memory), it's redundant if RAM is already present
    // We'll let the record-level sanitizer handle cross-field redundancy, but we can strip obvious noise here
    if (GENERIC_VALUE_BLACKLIST.includes(lowerVal)) return null;
  }

  // 4. Spacing normalization (e.g. "128GB" -> "128 GB")
  if (/^\d+(GB|TB|MB|KB|MHz|GHz|Hz|W|V|A|mAh|Wh|mm|cm|m|g|kg)$/i.test(value)) {
    return value.replace(/(\d+)([a-zA-Z%°/]+)/i, "$1 $2").trim();
  }

  return value.trim();
}

/**
 * Sanitizes an entire record of specs.
 */
export function sanitizeSpecs(
  specs: Record<string, any>,
  brand?: string,
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  Object.entries(specs).forEach(([k, v]) => {
    const cleanKey = decodeEntities(k);
    if (typeof v === "string") {
      const clean = sanitizeSpecValue(cleanKey, decodeEntities(v), brand);
      if (clean) sanitized[cleanKey] = clean;
    } else if (v !== null && v !== undefined) {
      sanitized[cleanKey] = v;
    }
  });

  // 2. Cross-field redundancy check: Drop "Style" if it's already covered by other fields
  if (sanitized["Style"]) {
    const styleVal = String(sanitized["Style"]).toLowerCase();
    const isRedundant = Object.entries(sanitized).some(([k, v]) => {
      if (k === "Style") return false;
      const otherVal = String(v).toLowerCase();
      // If Style says "16 GB Gemeinsamer Arbeitsspeicher" and RAM says "16 GB"
      return styleVal.includes(otherVal) || otherVal.includes(styleVal);
    });

    if (isRedundant) {
      delete sanitized["Style"];
    }
  }

  return sanitized;
}
