import { normalizeBrandName } from "./brand-mapping";
import { getCleanTokens, SiblingConsensus } from "./product-identity";

// Tokens that statistically indicate a variation/tier jump in consumer electronics
const VARIANT_MARKER_TOKENS = new Set([
  "pro",
  "plus",
  "ultra",
  "max",
  "mini",
  "lite",
  "se",
  "fe",
  "air",
  "edge",
  "neo",
  "premium",
  "pro+",
  "max+",
]);
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
 * Probabilistic Enrichment Guard (PEF Stage 1 & 2)
 *
 * Prevents "bad" data from leaking into the database by checking if
 * the incoming specification value contradicts the established product identity.
 */
export function enrichmentGuard(
  key: string,
  value: string,
  productIdentity: {
    title: string;
    brand: string;
    model: string;
  },
  consensus?: SiblingConsensus,
): boolean {
  if (!value || typeof value !== "string") return true;

  const identityTokens = new Set(getCleanTokens(productIdentity.title));
  const valueTokens = getCleanTokens(value);

  // 1. Identity Contradiction (Stage 1)
  // If the enrichment value contains tokens that are known "Variant Markers"
  // but those markers are ABSENT in the marketplace identity, it's highly likely a leak.
  for (const token of valueTokens) {
    if (VARIANT_MARKER_TOKENS.has(token) && !identityTokens.has(token)) {
      return false;
    }
  }

  // 2. Sibling Consensus (Stage 2)
  // If we have a sibling family, check if this specific value is a statistical outlier.
  if (consensus && consensus.total > 2) {
    const rareTokens = valueTokens.filter((token) => {
      const freq = (consensus.tokenCounts[token] || 0) / consensus.total;
      return freq < 0.15; // Token appears in less than 15% of the family
    });

    // If the value contains rare tokens that aren't in our title, it's suspicious.
    if (rareTokens.length > 0) {
      const hasSafeOverride = rareTokens.every((t) => identityTokens.has(t));
      if (!hasSafeOverride) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Sanitizes an entire record of specs.
 */
export function sanitizeSpecs(
  specs: Record<string, any>,
  productIdentity?: {
    title: string;
    brand: string;
    model: string;
  },
  consensus?: SiblingConsensus,
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  Object.entries(specs).forEach(([k, v]) => {
    let cleanKey = decodeEntities(k);

    if (typeof v === "string") {
      let decodedVal = decodeEntities(v);

      // Brand Normalization in Values
      if (
        cleanKey.toLowerCase() === "marke" ||
        cleanKey.toLowerCase() === "brand"
      ) {
        decodedVal = normalizeBrandName(decodedVal);
      }

      const clean = sanitizeSpecValue(
        cleanKey,
        decodedVal,
        productIdentity?.brand || undefined,
      );

      // Security Guard: Check for identity contradictions or statistical outliers
      if (productIdentity && clean) {
        const isSafe = enrichmentGuard(
          cleanKey,
          String(clean),
          productIdentity,
          consensus,
        );
        if (!isSafe) {
          console.warn(
            `[Enrichment Guard] Blocked attribute leak: ${cleanKey} = ${clean}`,
          );
          return;
        }
      }

      if (clean) sanitized[cleanKey] = clean;
    } else if (v !== null && v !== undefined) {
      sanitized[cleanKey] = v;
    }
  });

  // Cross-field redundancy check: Drop "Style" if it's already covered by other fields
  if (sanitized["Style"]) {
    const styleVal = String(sanitized["Style"]).toLowerCase();
    const isRedundant = Object.entries(sanitized).some(([k, v]) => {
      if (k === "Style") return false;
      const otherVal = String(v).toLowerCase();
      return styleVal.includes(otherVal) || otherVal.includes(styleVal);
    });

    if (isRedundant) {
      delete sanitized["Style"];
    }
  }

  return sanitized;
}
