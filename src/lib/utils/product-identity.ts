// import type { Product } from "@/lib/product-registry"; // Removed to avoid runtime alias issues in scripts
import {
  extractRealStorageFromTitle,
  parseVariationAttributes,
} from "./variants";

interface Product {
  brand?: string | null;
  title?: string;
  category?: string | null;
  specifications?: Record<string, any> | string | null;
  variationAttributes?: string | null;
  [key: string]: any;
}

/**
 * Corrects "Sub-brands" or "Series" to their actual manufacturer for slugging.
 * E.g. PlayStation -> Sony, Xbox -> Microsoft
 */
function normalizeBrand(
  brand: string,
  title?: string,
  category?: string,
): string {
  const b = brand.toLowerCase();
  const t = (title || "").toLowerCase();

  if (
    category === "consoles" ||
    t.includes("playstation") ||
    t.includes("xbox") ||
    t.includes("switch")
  ) {
    if (b.includes("playstation")) return "Sony";
    if (b.includes("xbox")) return "Microsoft";
    if (b.includes("nintendo")) return "Nintendo";
    if (b.includes("switch")) return "Nintendo";
  }

  return brand;
}

export interface SiblingConsensus {
  tokenCounts: Record<string, number>;
  total: number;
}

interface ProductIdentity {
  brand: string;
  model: string;
  fullModel: string;
  shortModel: string;
  variantLabel: string;
  variantMap: Record<string, string>;
  displayTitle: string;
  modelTitle: string;
  variantSuffix: string;
  variantTokens: string[];
  mpn?: string;
  isHighVariance: boolean;
  traitCount: number;
  isLaptop: boolean;
  categoryUsed: string;
}

/**
 * Robustly removes accents and standardizes special characters.
 */
function normalizeAccents(s: string): string {
  if (!s) return "";
  return s
    .replace(/\u00E4/g, "ae")
    .replace(/\u00F6/g, "oe")
    .replace(/\u00FC/g, "ue")
    .replace(/\u00E4/gi, "ae")
    .replace(/\u00F6/gi, "oe")
    .replace(/\u00FC/gi, "ue")
    .replace(/\u00DF/gi, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC");
}

/**
 * CPU Identity Engine: Automated Pattern Extraction
 * Replaces the endless maintenance of "noise scrubbing" with "gold extraction".
 */
interface CpuFacts {
  series: string; // Ryzen 9, Core i7, etc.
  modelNumber: string; // 5950X, 12400F, etc.
  cores: string; // 16 Kerne, 6C+8c, etc.
  frequency: string; // 3.4 GHz, 3.50-5.30GHz, etc.
}

function extractCpuFacts(title: string, brand: string): CpuFacts {
  // Trademarks are collapsed for whitespace but preserved for extraction
  const t = title.replace(/\s+/g, " ").trim();

  const SYM = "[™®©]*";

  // 1. Extract Series (Ryzen 9, Core i7, Threadripper, Ultra 7, etc.)
  const seriesPatterns = [
    new RegExp(
      `\\bRyzen${SYM}(?:\\s+[3579])?(?:\\s+Threadripper)?(?=\\b|\\s|$)`,
      "i",
    ),
    new RegExp(`\\bCore${SYM}\\s+Ultra${SYM}(?:\\s+[3579])?(?=\\b|\\s|$)`, "i"),
    new RegExp(`\\bCore${SYM}\\s+i[3579](?=\\b|\\s|$)`, "i"),
    new RegExp(`\\bUltra${SYM}(?:\\s+[3579])?(?=\\b|\\s|$)`, "i"),
    new RegExp(`\\bThreadripper(?:\\s+PRO)?(?=\\b|\\s|$)`, "i"),
    new RegExp(`\\b(EPYC|Xeon|Pentium|Celeron|Athlon)${SYM}\\b`, "i"),
  ];

  let series = "";
  for (const p of seriesPatterns) {
    const match = t.match(p);
    if (match) {
      series = match[0].trim();
      break;
    }
  }

  // 2. Extract Model Number (The main identifier)
  // Logic: Longest alphanumeric token after/around series that looks like a model
  const modelPatterns = [
    /\b[0-9]{3,5}[KFKSTM]*[X3DG]*\b/i, // Standard: 5950X, 12400F, 265K, 7800X3D
    /\b[0-9]{3}[A-Z]{1,2}\b/i, // Ultra 285K, etc.
    /\b[0-9]{4}WX\b/i, // Threadripper WX
  ];

  let modelNumber = "";
  for (const p of modelPatterns) {
    const match = t.match(p);
    if (match) {
      modelNumber = match[0].trim();
      break;
    }
  }

  // 3. Extract Cores
  const coreMatch = t.match(
    /\b\d+[\+\-x]?\d*\s*(?:Kerne|Cores|C|Core|Nodes|Threads)\b/i,
  );
  const cores = coreMatch ? coreMatch[0].trim() : "";

  // 4. Extract Frequency (preserving ranges with - or /)
  const freqMatch =
    t.match(/\b\d+[\.,]\d+\s*[\/-]\s*\d+[\.,]\d+\s*(?:GHz|MHz)\b/i) ||
    t.match(/\b\d+[\.,]\d+\s*(?:GHz|MHz)\b/i);
  const frequency = freqMatch ? freqMatch[0].trim() : "";

  return { series, modelNumber, cores, frequency };
}

/**
 * Standardizes tokenization for consistent identity matching.
 */
export function getCleanTokens(s: string): string[] {
  let normalized = normalizeAccents(s.toLowerCase());
  normalized = normalized.replace(/(\d)[,.](\d)/g, "$1.$2");
  return normalized
    .split(/[^a-z0-9.]+/)
    .filter((t) => t.length > 1 || /^\d+(\.\d+)?$/.test(t));
}

/**
 * QA Helper: Verifies if a candidate model name from specifications is
 * safe to use as an override for the main product title.
 */
export function verifySpecModel(
  candidate: string,
  originalTitle: string,
  brand: string,
): boolean {
  if (!candidate || candidate.length < 3 || candidate.length > 60) return false;
  if (/unknown|n\/a|model|none|generic|null/i.test(candidate)) return false;

  const candLower = candidate.toLowerCase();
  const titleLower = originalTitle.toLowerCase();
  const brandLower = brand.toLowerCase();

  // 1. Brand Consistency (Candidate should not mention a different brand)
  const brands = [
    "apple",
    "samsung",
    "sony",
    "intel",
    "amd",
    "nvidia",
    "asus",
    "msi",
    "lg",
  ];
  for (const b of brands) {
    if (candLower.includes(b) && brandLower !== b) return false;
  }

  // 2. Identification Closeness (Candidate must share tokens with the title)
  // Strips brand from check to avoid false positives based only on brand
  const candTokens = candLower
    .replace(brandLower, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 || /^\d+$/.test(t)); // Allow single-digit version numbers
  const titleTokens = titleLower
    .replace(brandLower, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 || /^\d+$/.test(t));

  const intersection = candTokens.filter((t) => titleTokens.includes(t));

  // Requirement: At least one substantial token or two short tokens must overlap
  const hasStrongOverlap =
    intersection.some((t) => t.length > 3) || intersection.length >= 2;

  // 3. Contradiction Check: If candidate is a subset of title, but title has a more specific differentiator
  // (e.g. title has "9a" but candidate has "9", or title has "Pro" but candidate doesn't)

  // A. Dynamic Alphanumeric Differentiators (9a, 6s, Ti, XT, etc.)
  const getDifferentiators = (tokens: string[]) =>
    tokens.filter((t) => /^\d+[a-z]{1,2}$/i.test(t));
  const diffsTitle = getDifferentiators(titleTokens);
  const diffsCand = getDifferentiators(candTokens);

  for (const d of diffsTitle) {
    if (!diffsCand.includes(d)) {
      // Title has a specific differentiator (e.g. 9a) that candidate is missing.
      // If candidate has the base model (e.g. 9), it's a contradiction.
      const base = d.replace(/[a-z]+$/i, "");
      if (candTokens.includes(base)) return false;
    }
  }

  // B. Numeric Version mismatch (e.g. Title says 15, Candidate says 14)
  const getVersions = (tokens: string[]) =>
    tokens
      .map((t) => t.replace(/^v(?=\d)/i, "")) // Handle v1, v2, etc.
      .filter((t) => /^\d+$/.test(t));
  const versionsTitleRaw = getVersions(titleTokens);
  const versionsCand = getVersions(candTokens);

  // Dynamic Spec Value Detector
  // We don't want to enforce a match on numbers that are obviously spec units (e.g. "128" in "128 GB" or "144" in "144 Hz")
  const isSpecValue = (v: string) => {
    // 1. Check if followed by unit (with optional separator dot/comma for decimals)
    const unitRegex = new RegExp(
      `\\b${v}[\\.,]?\\s*(gb|tb|mb|hz|mhz|ghz|kw|w|mah|inch|zoll|cm|mm|m|"|'|min|h|mb\\/s|gb\\/s)\\b`,
      "i",
    );
    if (unitRegex.test(originalTitle)) return true;

    // 2. Check if part of a larger numeric string (thousand separator or decimal)
    // Avoids "1" being a version in "1.050 MB/s"
    const dotRegex = new RegExp(`\\b${v}[\\.,]\\d+`, "i");
    if (dotRegex.test(originalTitle)) return true;

    return false;
  };

  const versionsTitle = versionsTitleRaw.filter((v) => !isSpecValue(v));

  if (versionsTitle.length > 0 && versionsCand.length === 0) {
    // If title has a version number (< 100 or a year) but candidate has none, it's too vague.
    // e.g. Title: "iPad 11 2025" vs Candidate: "iPad WiFi" -> reject
    // But allow if the candidate is long enough and contains specific model keywords
    if (candidate.length > 10) return true;
    return false;
  }

  // If both have numbers, they must share the core version
  if (versionsTitle.length > 0 && versionsCand.length > 0) {
    const hasOverlap = versionsTitle.some((v) => versionsCand.includes(v));
    if (!hasOverlap) return false;
  }

  // C. Series/Tier Mismatch (Avoid "Ultra" overriding "SE", or "Pro" overriding "Air")
  const TIER_CONTRADICTIONS = [
    ["ultra", "se", "fe", "plus", "lite"], // High-end vs budget/entry
    ["pro", "air"], // Laptop specific
    ["plus", "max", "pro", "ultra"], // Large/High-end variants (usually distinct)
  ];

  for (const group of TIER_CONTRADICTIONS) {
    const titleTiers = group.filter((t) => titleTokens.includes(t));
    const candTiers = group.filter((t) => candTokens.includes(t));

    // If both title and candidate mention different tiers from the same contradiction group,
    // they are likely different products.
    if (
      titleTiers.length > 0 &&
      candTiers.length > 0 &&
      !titleTiers.some((t) => candTiers.includes(t))
    ) {
      return false;
    }
  }

  // Special exception: If candidate is just a more specific version of a short title
  const isSuperSet =
    candTokens.length > 0 && titleTokens.every((t) => candTokens.includes(t));

  return hasStrongOverlap || isSuperSet;
}

/**
 * Universally determines the identity of a product across all categories.
 * Uses a token-based subtraction approach to separate the core Model
 * from variation specs (color, storage) and brand.
 */
export const IDENTITY_CONFIG = {
  // Categories where specific traits (Size, Year, Generation) are core to the model name
  FIXED_TRAIT_CATEGORIES: [
    "notebooks",
    "laptop",
    "laptops",
    "laptop-notebook",
    "laptop-notebooks",
    "ultrabooks",
    "convertibles",
    "tablets",
    "monitors",
    "televisions",
    "graphics-cards",
    "gpu",
    "processors-cpus",
    "consoles",
    "power-supplies",
  ],

  // Keys in specifications that indicate a model-identifying attribute
  IDENTITY_KEYS: [
    "model",
    "modell",
    "series",
    "serie",
    "generation",
    "generationen",
    "mpn",
    "herstellernummer",
    "sku",
    "graphics",
    "grafik",
    "chipset",
    "chipsatz",
    "processor",
    "prozessor",
    "gpu",
    "cpu",
    "name",
    "bezeichnung",
    "modellbezeichnung",
    "family",
    "familie",
    "style",
    "color",
    "farbe",
    "produktfarbe",
    "size",
    "bildschirmdiagonale",
    "zoll",
    "inch",
    "socket",
    "sockel",
    "socket-typ",
    "formfaktor",
    "form factor",
    "modelljahr",
    "storage",
    "speicher",
    "speicherkapazität",
    "kapazität",
    "capacity",
    "ram",
    "arbeitsspeicher",
    "memory",
  ],

  /**
   * Performance-optimized extractor for identity-critical keys only.
   * Prevents full heavy JSON parsing in loops while ensuring identity stability.
   */
  getIdentitySpecs: (
    jsonStr: string | null | Record<string, any>,
  ): Record<string, any> => {
    if (!jsonStr) return {};
    try {
      const full = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
      const identity: Record<string, any> = {};
      const keys = IDENTITY_CONFIG.IDENTITY_KEYS;
      for (const key of keys) {
        // Case-insensitive lookup for robustness
        const foundKey = Object.keys(full).find((k) => k.toLowerCase() === key);
        if (foundKey) identity[foundKey] = full[foundKey];
      }
      return identity;
    } catch {
      return {};
    }
  },
};

/**
 * SMART SIBLING CONSENSUS (DYNAMIC HUB RESOLUTION)
 * Pre-calculates token frequencies across a family to identify variation-specific noise.
 */
export function calculateSiblingConsensus(siblings: any[]): SiblingConsensus {
  const tokenCounts: Record<string, number> = {};
  const total = siblings.length;

  siblings.forEach((s) => {
    // 1. Process Titles
    const titleTokens = new Set<string>(getCleanTokens(s.title || ""));
    titleTokens.forEach((t) => {
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    });

    // 2. Process Specifications (if available) - Helps find common traits
    const specs = s.officialSpecifications
      ? typeof s.officialSpecifications === "string"
        ? JSON.parse(s.officialSpecifications)
        : s.officialSpecifications
      : s.specifications || {};

    const specValues = Object.values(specs)
      .filter((v) => typeof v === "string" && v.length < 50)
      .join(" ");

    const specTokens = new Set<string>(getCleanTokens(specValues));
    specTokens.forEach((t) => {
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    });
  });

  return { tokenCounts, total };
}

/**
 * Checks if a token is a global constant in the sibling family (Identity Token)
 * or a variable trait (Variation Token).
 */
function isIdentityToken(token: string, consensus: SiblingConsensus): boolean {
  if (consensus.total <= 1) return true; // Can't tell without siblings
  const freq =
    (consensus.tokenCounts[token.toLowerCase()] || 0) / consensus.total;
  return freq >= 0.7; // Appears in 70% of siblings
}

/**
 * Extracts structured RAM facts from an Amazon title + official specs.
 * Returns the series name, total capacity, DDR speed string, and CL latency.
 * Mirrors the Idealo pattern: "Brand Series TotalCapacity DDRx-Speed CLx"
 */
function extractRamFacts(
  rawTitle: string,
  brand: string,
  mpn: string,
  specs: Record<string, any>,
): { series: string; capacity: string; ddr: string; cl: string } {
  const title = rawTitle || "";

  // ── 1. Capacity ───────────────────────────────────────────────────────────
  // Gather ALL capacity candidates (spec, title word-boundary, kit total, embedded model name)
  // and pick the LARGEST. This is critical for kit products where the spec often stores
  // the per-stick capacity (e.g. "8 GB") while the title encodes the total ("16GB" from
  // "VENGEANCELPX16GB (2x 8GB)"). Taking the max always gives the correct total.
  let capacity = "";
  const capCandidates: Array<{ num: number; unit: string; raw: string }> = [];

  const toMB = (n: number, u: string) =>
    u === "TB" ? n * 1024 * 1024 : u === "GB" ? n * 1024 : n;

  // Source 0: Spec field (may be per-stick for kits, so just one candidate)
  const specCap = String(
    specs["Kapazität"] ||
      specs["Capacity"] ||
      specs["Speicherkapazität"] ||
      specs["RAM-Kapazität"] ||
      "",
  ).trim();
  const capSpecMatch = specCap.match(/^(\d+(?:\.\d+)?)\s?(GB|TB|MB)/i);
  if (capSpecMatch) {
    capCandidates.push({
      num: parseFloat(capSpecMatch[1]),
      unit: capSpecMatch[2].toUpperCase(),
      raw: capSpecMatch[1] + capSpecMatch[2].toUpperCase(),
    });
  }

  // Source 1: Standard word-boundary matches e.g. "32GB", "2 TB"
  for (const m of title.matchAll(/\b(\d+(?:\.\d+)?)\s?(GB|TB|MB)\b/gi)) {
    capCandidates.push({
      num: parseFloat(m[1]),
      unit: m[2].toUpperCase(),
      raw: m[1] + m[2].toUpperCase(),
    });
  }

  // Source 2: Kit patterns — "(2x16GB)", "(2x 8GB)" → compute real total
  for (const m of title.matchAll(
    /\(\s*(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(GB|TB|MB)\s*\)/gi,
  )) {
    const total = parseInt(m[1]) * parseFloat(m[2]);
    const unit = m[3].toUpperCase();
    capCandidates.push({ num: total, unit, raw: `${total}${unit}` });
  }

  // Source 3: Embedded in model names without word boundary — "VENGEANCELPX16GB"
  for (const m of title.matchAll(/[a-zA-Z](\d+(?:\.\d+)?)(GB|TB|MB)/gi)) {
    capCandidates.push({
      num: parseFloat(m[1]),
      unit: m[2].toUpperCase(),
      raw: m[1] + m[2].toUpperCase(),
    });
  }

  if (capCandidates.length) {
    const sorted = capCandidates.sort(
      (a, b) => toMB(b.num, b.unit) - toMB(a.num, a.unit),
    );
    capacity = sorted[0].raw;
  }

  // ── 2. DDR Generation + Speed ─────────────────────────────────────────────
  let ddr = "";
  const specTyp = String(
    specs["Typ"] || specs["Speichertyp"] || specs["Type"] || "",
  ).trim();
  const specSpeed = String(
    specs["Taktfrequenz"] ||
      specs["Speed"] ||
      specs["Geschwindigkeit"] ||
      specs["Frequenz"] ||
      "",
  ).trim();

  // From spec: type = "DDR5", speed = "6000 MHz" → "DDR5-6000"
  const ddrTypeMatch = specTyp.match(/^(DDR\d+)/i);
  const speedMhzMatch = specSpeed.match(/(\d{3,5})\s*(?:MHz|Mhz|mhz)?/);
  if (ddrTypeMatch && speedMhzMatch) {
    ddr = `${ddrTypeMatch[1].toUpperCase()}-${speedMhzMatch[1]}`;
  } else if (ddrTypeMatch && !speedMhzMatch) {
    // Try to find speed in title
    const titleSpeedMatch = title.match(/\b(DDR\d+)[- _](\d{4,5})\b/i);
    if (titleSpeedMatch) {
      ddr = `${titleSpeedMatch[1].toUpperCase()}-${titleSpeedMatch[2]}`;
    } else if (ddrTypeMatch) {
      ddr = ddrTypeMatch[1].toUpperCase();
    }
  } else {
    // Fallback: extract combined DDR pattern from title
    const titleDdrMatch = title.match(/\b(DDR\d+)[- _](\d{4,5})\b/i);
    if (titleDdrMatch) {
      ddr = `${titleDdrMatch[1].toUpperCase()}-${titleDdrMatch[2]}`;
    } else {
      const titleDdrOnly = title.match(/\b(DDR\d+)\b/i);
      if (titleDdrOnly) ddr = titleDdrOnly[1].toUpperCase();
    }
  }

  // ── 3. Latency ────────────────────────────────────────────────────────────
  let cl = "";
  const specCl = String(
    specs["Latenz"] || specs["CAS Latency"] || specs["CAS-Latenz"] || "",
  ).trim();
  const clSpecMatch = specCl.match(/(?:CL\s*)?(\d+)/i);
  if (clSpecMatch) {
    cl = `CL${clSpecMatch[1]}`;
  } else {
    // From title: "CL30", "30-36-36-76" (take first number)
    const titleClMatch = title.match(/\bCL[\s-]?(\d+)\b/i);
    if (titleClMatch) cl = `CL${titleClMatch[1]}`;
  }

  // ── 4. Series Name ────────────────────────────────────────────────────────
  // Step 1: take everything before the first spec cluster in the title.
  // Step 2: strip brand tokens, the MPN, and all spec-like tokens.
  let series = "";

  // Split title at the first occurrence of a capacity, DDR, or frequency token.
  const seriesMatch = title.match(
    /^(.*?)\s*\b(?:\d+\s*(?:GB|TB|MB)\b|DDR\d+|\d{4,5}\s*MHz)/i,
  );
  let candidate = seriesMatch ? seriesMatch[1].trim() : title.trim();

  // Strip parenthetical kit specs like "(2x16GB)", "(2X 16GB)", "(2 x 16GB)"
  // Also handles unclosed parens left over from the split: "(2X "
  candidate = candidate
    .replace(/\(\s*\d+\s*[xX×]\s*\d+\s*(?:GB|TB|MB)?[^)]*\)/gi, "")
    .replace(/\(\s*\d+\s*[xX×][^)]*$/gi, "") // unclosed opening paren
    .replace(/\s{2,}/g, " ")
    .trim();

  // Strip brand name words (handles "Patriot Memory" → match "Patriot" brand)
  const brandWords = brand.toLowerCase().split(/\s+/);
  const candidateWords = candidate.split(/\s+/);
  let startIdx = 0;
  for (const bw of brandWords) {
    if (
      candidateWords[startIdx] &&
      candidateWords[startIdx].toLowerCase().replace(/[^a-z0-9]/g, "") ===
        bw.replace(/[^a-z0-9]/g, "")
    ) {
      startIdx++;
    } else {
      break;
    }
  }
  // Also strip remaining brand-word tokens that may appear after a secondary brand mention
  let remaining = candidateWords.slice(startIdx);
  remaining = remaining
    .filter(
      (w) =>
        !brandWords.includes(w.toLowerCase().replace(/[^a-z0-9]/g, "")) &&
        !/^(ram|ddr\d*|ssd|dimm|sodimm|memory|arbeitsspeicher|kit|desktop|notebook|dual|single|rgb|led|expo|xmp)$/i.test(
          w,
        ) &&
        w.length > 0 &&
        // Not the MPN
        w.toLowerCase() !== mpn.toLowerCase(),
    )
    // Remove embedded capacity suffix from model names like "VENGEANCELPX32GB" → "VENGEANCELPX"
    .map((w) => w.replace(/(\d+(?:\.\d+)?)(GB|TB|MB)$/i, "").trim())
    .filter(Boolean);
  series = remaining.join(" ").trim();

  // Clean up trailing/leading noise
  series = series
    .replace(/[,;]+$/, "")
    .replace(/^[,;]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { series, capacity, ddr, cl };
}

export function getProductIdentity(product: Partial<Product>): ProductIdentity {
  const rawBrand = (product.brand || "").trim();
  const title = (product.title || "").trim();
  const rawCategory = (product.category || "").toLowerCase();

  // 1. Category and Alias Normalization
  const categoryMap: Record<string, string> = {
    tvs: "televisions",
    handy: "smartphones",
    smartphone: "smartphones",
    notebook: "laptops",
    notebooks: "laptops",
    netzteile: "power-supplies",
    psu: "power-supplies",
    arbeitsspeicher: "ram",
  };
  const category = categoryMap[rawCategory] || rawCategory;
  const isRAM = category === "ram";
  const isTablet =
    category.includes("tablet") || title.toLowerCase().includes("ipad");
  const isSmartphone = category === "smartphones";
  const isLaptop =
    category.includes("laptop") ||
    category.includes("notebook") ||
    title.toLowerCase().includes("macbook");
  const isFixedTraitCategory =
    IDENTITY_CONFIG.FIXED_TRAIT_CATEGORIES.includes(category);

  // 2. Data Sourcing (Official vs Retailer)
  let officialModel: string | null =
    (product.officialTitle || "").trim() || null;

  const specs = product.officialSpecifications
    ? typeof product.officialSpecifications === "string"
      ? JSON.parse(product.officialSpecifications)
      : product.officialSpecifications
    : product.specifications || {};

  const resolvedBrand = normalizeBrand(rawBrand, title, category);
  const resolvedBrandLower = resolvedBrand.toLowerCase();

  // 1.5 Rich Brand Extraction (Preserve Symbols for Display)
  const brandRegex = new RegExp(
    `\\b${resolvedBrand.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}[™®©]*(?:\\b|\\s|$)`,
    "i",
  );
  const brandMatch =
    title.match(brandRegex) || (product.officialTitle || "").match(brandRegex);
  const richBrand =
    brandMatch && brandMatch[0] ? brandMatch[0].trim() : resolvedBrand;

  // QA SYSTEM: Verify if the 'Modell' spec is a safe improvement over the title
  const source = product.specificationsSource || "";
  const trustedSources = ["icecat", "intel", "ebay", "google"];
  const isDirectSource = trustedSources.some((s) =>
    source.toLowerCase().includes(s),
  );

  if (isDirectSource) {
    const candidate = String(specs["Modell"] || specs["Model"] || "").trim();
    const verified = verifySpecModel(candidate, title, resolvedBrand);
    if (verified) {
      officialModel = candidate;
    }
  }

  // 2b. SIBLING MODEL STEERING: Optimized for Statelessness.
  // Steering (borrowing official models from siblings) is moved to the data enrichment layer.
  // At runtime, we use the product's own official title or title to ensure URL stability.

  if (
    officialModel &&
    (officialModel.length > 80 ||
      officialModel.toLowerCase().includes("unknown"))
  ) {
    officialModel = null;
  }

  // 3. Variant Map and Trait Extraction
  const officialAttributes = parseVariationAttributes(
    product.variationAttributes || undefined,
  );
  const variantMap: Record<string, string> = { ...officialAttributes };

  // Attribute Recovery (Title + Specs)
  if (Object.keys(variantMap).length === 0) {
    const recoveredStorage = extractRealStorageFromTitle(title);
    if (recoveredStorage) variantMap.Storage = recoveredStorage;

    const sizeMatch = title.match(/(\d+(?:[\.,]\d+)?)\s?(?:Zoll|Inch|")/i);
    if (sizeMatch) variantMap.Size = sizeMatch[1].replace(",", ".") + '"';
  }

  // 3b. MPN Discovery (Used for stripping from model and for variant suffix)
  const mpnVal =
    (product.mpn || variantMap.MPN || "").trim().toUpperCase() ||
    (
      title
        .split(/[\s,]+/)
        .find((w) => /^[a-z]{1,2}\d+[a-z\d\/]{3,}$/i.test(w)) || ""
    ).toUpperCase();

  // 3c. RAM NAMING STRATEGY (Idealo-style)
  // Short-circuits the generic parser entirely for RAM products.
  // Hub:     "Brand Series Capacity DDRx-Speed CLx"
  // Variant: "Brand Series Capacity DDRx-Speed CLx MPN"
  if (isRAM) {
    const { series, capacity, ddr, cl } = extractRamFacts(
      title,
      resolvedBrand,
      mpnVal,
      specs,
    );

    const hubParts = [series, capacity, ddr, cl].filter(Boolean);
    const hubCore = hubParts.join(" ").trim();
    const modelTitle = `${resolvedBrand} ${hubCore}`
      .replace(/\s+/g, " ")
      .trim();
    const variantSuffix = mpnVal || "";
    const displayTitle = variantSuffix
      ? `${modelTitle} ${variantSuffix}`
      : modelTitle;

    return {
      brand: richBrand,
      model: hubCore,
      fullModel: modelTitle,
      shortModel: series || hubCore.split(" ")[0] || resolvedBrand,
      variantLabel: variantSuffix,
      variantMap: {},
      variantTokens: variantSuffix ? [variantSuffix] : [],
      displayTitle,
      modelTitle,
      variantSuffix,
      mpn: mpnVal || undefined,
      isHighVariance: false,
      traitCount: variantSuffix ? 1 : 0,
      isLaptop: false,
      categoryUsed: category,
    };
  }

  // 4. Identity Loop (Scalable Logic)
  const subtractTokens = new Set<string>();

  // A. Essential Stopwords & Connectors
  const NOISE_WORDS = [
    "original",
    "ovp",
    "neu",
    "edition",
    "kit",
    "body",
    "versand",
    "plus",
    "bulk",
    // Technical & Category Noise (Safe to strip when no siblings available)
    "processor",
    "prozessor",
    "cpu",
    "gpu",
    "ssd",
    "nvme",
    "m2",
    "ram",
    "psu",
    "netzteil",
    "monitor",
    "bildschirm",
    "display",
    "tv",
    "television",
    "fernseher",
    "smartphone",
    "handy",
    "kamera",
    "spiegelreflex",
    "systemkamera",
    "kuechenmaschine",
    "maschine",
    "laptop",
    "notebook",
    "gaming",
    "wireless",
    "bluetooth",
    "noise",
    "cancelling",
    "canceling",
    "4k",
    "8k",
    "uhd",
    "fhd",
    "hd",
    "ai",
    "smart",
    "80",
    "fully",
    "modular",
    /* 
       "mit", "und", "with", "and" 
       REMOVED to allow preservation in model names (e.g. "AirPods 4 mit Active Noise Cancellation")
    */
  ];
  NOISE_WORDS.forEach((s) => subtractTokens.add(s));

  // B. Fallback Colors (Stripped from model if not in attributes)
  const COLOR_NOISE = [
    "schwarz",
    "black",
    "weiss",
    "white",
    "silber",
    "silver",
    "grau",
    "grey",
    "gray",
    "gold",
    "blau",
    "blue",
    "rot",
    "red",
    "gruen",
    "green",
    "pink",
    "rosa",
    "titanium",
    "titan",
    "mitternacht",
    "midnight",
    "starlight",
    "polaris",
    "obsidian",
    "hazel",
    "porcelain",
    "rose",
    "mint",
    "bay",
    "charcoal",
    "chalk",
    "sage",
    "snow",
    "volcanic",
  ];
  COLOR_NOISE.forEach((s) => subtractTokens.add(s));

  // Subtract all words found in variant attributes
  Object.entries(variantMap).forEach(([k, v]) => {
    // skip subtraction for core model-defining keys (Model, Name, Series, etc.)
    // but ALLOW subtraction for variant traits like Color/Size to keep model names clean
    const lowerKey = k.toLowerCase();
    const isProtectedIdentityKey =
      /model|name|series|serie|family|familie|bezeichnung|style|stil|generation|mpn|sku/.test(
        lowerKey,
      );

    if (isProtectedIdentityKey) return;

    if (typeof v === "string") {
      v.toLowerCase()
        .split(/[^a-z0-9]+/)
        .forEach((t) => {
          if (t.length > 0) subtractTokens.add(t);
        });
    }
  });

  // Explicitly subtract MPN from core model
  if (mpnVal && mpnVal.length > 3) {
    const mpnLower = mpnVal.toLowerCase();
    subtractTokens.add(mpnLower);
    mpnLower.split(/[^a-z0-9]+/).forEach((t: string) => {
      if (t.length > 2) subtractTokens.add(t);
    });
  }

  // Static set for fast noise elimination, specifically for CPUs
  const noiseTokens = new Set([
    ...NOISE_WORDS,
    "ghz",
    "mhz",
    "cache",
    "kb",
    "mb",
    "smart",
    "l2",
    "l3",
    "box",
    "boxed",
    "version",
    "wof",
    "tray",
    "desktop",
    "processor",
    "prozessor",
    "intel",
    "amd",
    "grafik",
    "kerne",
    "cores",
    "thread",
    "threads",
    "zweikanalig",
    "dual-channel",
    "dual",
    "channel",
  ]);

  if (category === "prozessoren") {
    const cpuNoise = [
      "vermeer",
      "am4",
      "am5",
      "lga1700",
      "lga1200",
      "ddr4",
      "ddr5",
      "neu",
      "gebraucht",
      "oem",
      "je",
      "sockel",
      "socket",
    ];
    cpuNoise.forEach((n) => noiseTokens.add(n));
    noiseTokens.forEach((s) => subtractTokens.add(s));
  }

  /**
   * C. SMART SIBLING CONSENSUS: Optimized for Statelessness.
   * Consensus (stripping tokens based on family frequency) is moved to the data enrichment layer.
   * At runtime, we rely on deterministic trait subtraction to keep model names clean.
   */

  const fixTechCasing = (w: string) => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (
      /^(oled|qled|hdtv|uhd|fhd|wqhd|rtx|gtx|rx|xt|ti|super|oc|ai|5g|4g|lte|wifi|usb)$/.test(
        clean,
      )
    )
      return clean.toUpperCase();
    if (/^m[1-9]$/.test(clean)) return clean.toUpperCase();
    if (/^s\d+$/.test(clean)) return clean.toUpperCase();
    if (
      /^(macbook|iphone|ipad|pixel|galaxy|thinkpad|zenbook|vivobook|legion)$/i.test(
        clean,
      )
    ) {
      if (clean === "macbook") return "MacBook";
      if (clean === "iphone") return "iPhone";
      if (clean === "ipad") return "iPad";
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w;
  };

  let baseTitle = officialModel || title;

  // Symbol Injection Strategy: If official model lacks symbols but raw title has them, prefer raw title.
  if (officialModel && !/[™®©]/.test(officialModel) && /[™®©]/.test(title)) {
    // Rely on brand match and our robust cleaner
    if (title.toLowerCase().startsWith(resolvedBrandLower)) {
      baseTitle = title;
    }
  }

  // Symbol Injection Strategy: If official model lacks symbols but raw title has them, prefer raw title.
  if (officialModel && !/[™®©]/.test(officialModel) && /[™®©]/.test(title)) {
    // Rely on brand match and our robust cleaner
    if (title.toLowerCase().startsWith(resolvedBrandLower)) {
      baseTitle = title;
    }
  }

  // 3c. Title Cleanup (Splitting at common separators to find core Model)
  // For RAM, we avoid splitting at '(' because it often contains critical specs (e.g. 2x16GB)
  const splitRegex = isRAM ? / \- | \/ | \||: |,/i : / \- | \/ | \(| \||: |,/i;
  let cleanTitle = baseTitle.split(splitRegex)[0].trim();

  // Robustly strip brand from start of title to prevent duplication
  // Handle cases where brand has punctuation (be quiet!) that might vary
  const brandSimple = resolvedBrandLower.replace(/[^a-z0-9]/g, "");
  const titleSimple = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (titleSimple.startsWith(brandSimple)) {
    // Determine the length of the brand in the actual title string
    // This is tricky because of punctuation differences.
    // Simple heuristic: If it starts with the exact string, strip it.
    if (cleanTitle.toLowerCase().startsWith(resolvedBrandLower)) {
      cleanTitle = cleanTitle.slice(resolvedBrand.length).trim();
    } else {
      // Fallback for tricky punctuation: Remove the first N words if they match the brand
      const brandTokens = resolvedBrandLower.split(/\s+/);
      const titleTokens = cleanTitle.split(/\s+/);
      let matchCount = 0;
      for (let i = 0; i < brandTokens.length; i++) {
        const bT = brandTokens[i].replace(/[^a-z0-9]/g, "");
        const tT = (titleTokens[i] || "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        if (bT === tT) matchCount++;
        else break;
      }
      if (matchCount === brandTokens.length) {
        cleanTitle = titleTokens.slice(matchCount).join(" ");
      }
    }
  }

  // Clean up any leading punctuation left over (e.g. "! Dark Rock" -> "Dark Rock")
  // MUST preserve symbols!
  cleanTitle = cleanTitle.replace(/^[^a-z0-9™®©]+/i, "");

  const rawWords = cleanTitle.split(/[\s,+\*~]+/).filter(Boolean);
  const modelWords: string[] = [];
  const strippedUnits: string[] = [];

  rawWords.forEach((word, index) => {
    const cleanWord = word.replace(/^[(\[",\.]+|[)\]",\.]+/g, "");
    const normalized = normalizeAccents(cleanWord);
    const rawLower = normalized.toLowerCase();
    const cleanLower = rawLower.replace(/[^a-z0-9]/g, "");
    if (!cleanLower || cleanLower === resolvedBrandLower) return;

    // [Part 2] Token Deduplication Logic
    const tokenNorm = cleanLower;
    if (tokenNorm && index > 0) {
      // If we already have this exact token in modelWords or strippedUnits, skip it
      const alreadyInModel = modelWords.some(
        (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "") === tokenNorm,
      );
      const alreadyInStripped = strippedUnits.some(
        (u) => u.toLowerCase().replace(/[^a-z0-9]/g, "") === tokenNorm,
      );
      if (alreadyInModel || alreadyInStripped) return;
    }

    // [Part 2] Aggressive RAM Spec Stripping
    if (isRAM) {
      // Clear out anything that looks like capacity, DDR, speed, CL, or "Memory" noise
      // We use cleanWord to preserve dashes (e.g. DDR5-6000)
      const testWord = cleanWord.toLowerCase();

      const isSpec =
        /^(ddr\d|cl\d+|kit|memory|arbeitsspeicher|ssd|ram|dimm|sodimm|u?dimm|desktop|notebook|pc\d\-?\d+|[\d.]+mhz)$/.test(
          testWord,
        ) ||
        // Combined patterns: ddr5-6000, cl36-38-38-80
        /^(ddr\d+|cl\d+)[\-_\s]*\d+.*$/i.test(testWord) ||
        // Capacity catch: 32gb, 64gb, 32gbx2, 2x16gb, 16gbx2, 2x16, 16x2
        /^\d+\s*x\s*\d+\s*[xg]b$/i.test(testWord) ||
        /^\d+\s*[xg]b(\s*x\s*\d+)?$/i.test(testWord) ||
        /^x\s*\d+$/i.test(testWord) ||
        // Timing catch: 16-18-18-38
        /^\d+[\-\.]\d+[\-\.]\d+[\-\.]\d+$/.test(testWord);

      if (isSpec) {
        // Normalize the unit for reuse: strip trailing symbols strictly
        const normUnit = cleanWord.replace(/[()\[\]",\.]+/g, "");
        if (
          normUnit &&
          normUnit.length > 1 &&
          !strippedUnits.some(
            (u) =>
              u.toLowerCase().replace(/[^a-z0-9]/g, "") ===
              normUnit.toLowerCase().replace(/[^a-z0-9]/g, ""),
          )
        ) {
          strippedUnits.push(normUnit);
        }
        return;
      }
    }

    // Protection for Official Models: If we have an official model name,
    // we bypass the aggressive noise word stripping to respect the source's intent.
    const isOfficialModelTrustPath = !!officialModel;

    // 2. Unit Recognition (e.g. 128GB, 128 GB, 165Hz, 34")
    const isExplicitUnit =
      /^\d+(\.\d+)?(gb|tb|mb|wh|w|ghz|mhz|mp|hz|zoll|inch|")$/i.test(
        cleanLower,
      ) ||
      /^\d+hz/i.test(cleanLower) ||
      (word.includes('"') && /^\d+/.test(cleanLower));

    // Look ahead for split units: (e.g. "128" followed by "GB")
    let isSplitUnit = false;
    if (/^\d+$/.test(cleanLower) && index < rawWords.length - 1) {
      const nextWord = rawWords[index + 1]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (/^(gb|tb|mb|wh|w|hz|zoll|inch)$/.test(nextWord)) isSplitUnit = true;
    }
    // Also catch the unit part of a split unit
    if (/^(gb|tb|mb|wh|w|hz|zoll|inch)$/.test(cleanLower) && index > 0) {
      const prevWord = rawWords[index - 1]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (/^\d+$/.test(prevWord)) isSplitUnit = true;
    }

    if (isExplicitUnit || isSplitUnit) {
      // Capture stripped capacity/RAM for the variant tokens if not already present
      if (
        isSplitUnit &&
        /^\d+$/.test(cleanLower) &&
        index < rawWords.length - 1
      ) {
        const nextRaw = rawWords[index + 1].replace(/[)\]",\.]+/g, "");
        if (
          /^(gb|tb|mb|wh|w|hz|zoll|inch)$/i.test(
            nextRaw.replace(/[^a-z0-9]/g, ""),
          )
        ) {
          strippedUnits.push(cleanWord + nextRaw);
        }
      } else if (
        isExplicitUnit &&
        (rawLower.includes("gb") ||
          rawLower.includes("tb") ||
          rawLower.includes("mb") ||
          rawLower.includes("hz"))
      ) {
        strippedUnits.push(cleanWord);
      }
      return;
    }

    // 3. Identification & Protection
    const hasNum = /\d/.test(normalized);
    const hasLetter = /[a-z]/i.test(normalized);
    // Protect complex identifiers (RTX 4070, PS5, RM750e, Series X)
    const isModelCode =
      (hasNum && hasLetter && cleanLower.length >= 3) ||
      (hasNum && cleanLower.length >= 4) ||
      ((isTablet || isSmartphone) &&
        /^\d+$/.test(cleanLower) &&
        cleanLower.length >= 2) || // Protect "11", "13", "15" in tablets/phones
      (cleanLower === "x" && index > 0);

    // Protect tech series
    const isProtectedTech =
      /^(rtx|gtx|rx|ti|super|m\d|s\d+|pro|air|max|ultra|pixel|iphone|ipad|galaxy|macbook|artisan|aero|legion|tuf|rog|omen|mfp|gaming)$/i.test(
        cleanLower,
      );
    const isActuallyProtected =
      isModelCode ||
      (isProtectedTech &&
        (!/^m\d$/.test(cleanLower) || resolvedBrandLower === "apple")) ||
      (index === 0 && !subtractTokens.has(cleanLower)) ||
      (cleanLower.length >= 3 &&
        /model|serie|name|evo|select/i.test(cleanLower));

    // Specific strip: 'x' as separator in resolution (3440 x 1440)
    if (cleanLower === "x" && index > 0 && index < rawWords.length - 1) {
      const prevC = rawWords[index - 1].replace(/[^a-z0-9]/g, "");
      const nextC = rawWords[index + 1].replace(/[^a-z0-9]/g, "");
      if (/^\d+$/.test(prevC) && /^\d+$/.test(nextC)) return;
    }

    // Strip if it's the discovered MPN (always move MPN to variant suffix)
    // BUT only if we have other descriptive words (to avoid empty models like RM750e)
    if (
      mpnVal &&
      cleanLower === mpnVal.toLowerCase().replace(/[^a-z0-9]/g, "")
    ) {
      const looksLikeSKU = mpnVal.length > 6 || /[\/\-]/.test(mpnVal);
      if (looksLikeSKU && modelWords.length > 0) return;
    }

    // Strip if in noise list AND not protected (and not in official trust path)
    if (
      subtractTokens.has(cleanLower) &&
      !isActuallyProtected &&
      !isOfficialModelTrustPath
    ) {
      return;
    }

    // Final clean swap & Deduplication
    const formatted = fixTechCasing(cleanWord.replace(/[,\-:\/]+$/, ""));
    const formattedLower = formatted?.toLowerCase();
    if (
      formatted &&
      !modelWords.some((w) => w.toLowerCase() === formattedLower)
    ) {
      modelWords.push(formatted);
    }
  });

  const modelHead = modelWords[0] || "";
  const hubModelName = modelWords.join(" ").trim();
  const modelTitle = `${richBrand} ${hubModelName}`;

  // 5. Variant Differentiators (Slug & Subtitle)
  let variantTokens: string[] = [];
  const processedTokens = new Set<string>();
  let oneFeatureToken: string | null = null; // Track color or primary trait for high-variance products
  let bestFeatureKey: string | null = null;

  // Order of preference for "Best Feature": Color  // Add traits from variantMap in priority order

  const rawSourceTitle = (
    product.officialTitle && product.officialTitle.length > title.length
      ? product.officialTitle
      : title
  ).trim();
  const amazonTitleNorm = rawSourceTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const traitOrder = [
    "Color",
    "Farbe",
    "Storage",
    "Speicher",
    "Capacity",
    "Kapazität",
    "RAM",
    "Arbeitsspeicher",
    "Connectivity",
    "Konnektivität",
    "Size",
  ];
  traitOrder.forEach((k) => {
    const val = variantMap[k];
    if (val && typeof val === "string") {
      processTrait(val, k);
    }
  });

  // Add any other traits in variantMap (e.g. "Module", "Generation")
  Object.entries(variantMap).forEach(([k, val]) => {
    if (
      val &&
      typeof val === "string" &&
      !traitOrder.some((t) => t.toLowerCase() === k.toLowerCase())
    ) {
      processTrait(val, k);
    }
  });

  function processTrait(val: string, k: string) {
    if (!val || typeof val !== "string") return;

    if (category === "prozessoren") {
      // 1. List Filtering
      if (val.includes(",") || val.includes(";")) return;

      const valLower = val.toLowerCase();
      const valNorm = valLower.replace(/[^a-z0-9]/g, "");

      // 2. Noise Check
      if (noiseTokens.has(valNorm)) return;

      // 3. Amazon Anchoring - MUST be in the Amazon title
      if (!amazonTitleNorm.includes(valNorm)) {
        return;
      }
    }

    let displayVal = val;
    const cleanVal = val.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanVal === "wifi" || cleanVal === "wfi") displayVal = "Wi-Fi";
    // Catch combined patterns like "Wi-Fi + Cellular", "WiFi+5G", etc.
    if (
      /cellular|5g|lte/i.test(val) ||
      (val.toLowerCase().includes("wi-fi") &&
        /(?:cellular|5g|lte)/i.test(val.toLowerCase()))
    ) {
      displayVal = "Cellular";
    }

    // Aggressively strip model words from variant display value to prevent duplication
    // E.g. Model: "Evo Select", Token: "Evo Select (2024)" -> "(2024)"
    const currentModelWords = [
      resolvedBrandLower,
      ...hubModelName.toLowerCase().split(/\s+/),
    ].filter(Boolean);

    let cleanedDisplayVal = displayVal;

    currentModelWords.forEach((mw) => {
      // Don't strip pure numbers (like 65) if they are immediately followed by a unit
      if (/^\d+$/.test(mw)) {
        const unitRegex = new RegExp(
          `\\b${mw}\\s*(gb|tb|mb|hz|inch|zoll|\\")\\b`,
          "i",
        );
        if (unitRegex.test(cleanedDisplayVal)) return;
      }

      const escaped = mw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wordRegex = new RegExp(`\\b${escaped}\\b`, "gi");
      cleanedDisplayVal = cleanedDisplayVal.replace(wordRegex, "").trim();
    });

    // Cleanup redundant punctuation after stripping
    cleanedDisplayVal = cleanedDisplayVal
      .replace(/^[(\[",\-\.\/:\s]+|[)\]",\-\.\/:\s]+$/g, "")
      .trim();

    // If stripping left us with nothing or just noise, skip this token
    if (!cleanedDisplayVal || cleanedDisplayVal.length < 1) return;

    const valLower = cleanedDisplayVal.toLowerCase();
    const valNorm = valLower.replace(/[^a-z0-9]/g, "");
    const modelNorm = hubModelName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Bi-directional inclusion check: prevent "iPhone" in "iPhone 15" AND "iPhone 15" in "iPhone"
    if (
      valNorm &&
      (modelNorm.includes(valNorm) || valNorm.includes(modelNorm)) &&
      !/^\d+$/.test(valNorm) // Don't strip pure numbers like "15" or "2024" if they are distinct
    ) {
      // If it's a model word match but has a number (like 2024), we might want to keep the single number part
      const matches = valLower.match(/\d+/g);
      if (matches && matches.length === 1 && !modelNorm.includes(matches[0])) {
        cleanedDisplayVal = matches[0];
      } else {
        return;
      }
    }

    displayVal = cleanedDisplayVal;

    // Smart technical labeling: Skip for Consoles, Smartphones, and redundant categories
    const isConsole = category === "consoles";
    const isSSD =
      category === "ssds" ||
      category === "memory" ||
      /ssd|evoselect/i.test(hubModelName.toLowerCase());

    const isRAM = category === "ram";
    const isCapacityKey = /storage|capacity|speicher/i.test(k);
    const isRAMKey = /ram|arbeitsspeicher/i.test(k);

    if (
      !isSmartphone &&
      !isConsole &&
      !isTablet &&
      !isSSD &&
      !isRAM &&
      category !== "prozessoren" &&
      (valLower.includes("gb") || valLower.includes("tb")) &&
      !/ssd|ram/i.test(valLower)
    ) {
      if (isCapacityKey) displayVal = `${val} SSD`;
      else if (isRAMKey) displayVal = `${val} RAM`;
    }

    const norm = displayVal.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!processedTokens.has(norm)) {
      variantTokens.push(displayVal);
      processedTokens.add(norm);

      // Track candidate for "One-Feature" logic (Preference: Color > Capacity > First)
      const isColorKey = /color|farbe/i.test(k);
      if (isColorKey && !oneFeatureToken) {
        oneFeatureToken = displayVal;
      } else if (
        /connectivity|konnektivität/i.test(k) &&
        (!oneFeatureToken || !oneFeatureToken.match(/[a-z]{3,}/i))
      ) {
        oneFeatureToken = displayVal;
      } else if (
        /storage|capacity|speicher/i.test(k) &&
        (!oneFeatureToken || !oneFeatureToken.match(/[a-z]{3,}/i))
      ) {
        oneFeatureToken = displayVal;
      }
    }
  }

  // ADD STRIPPED UNITS (RECOVERY) - Fixes missing 2x16GB in RAM etc.
  if (category !== "prozessoren") {
    strippedUnits.forEach((unit) => {
      const norm = unit.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (processedTokens.has(norm)) return;
      if (!hubModelName.toLowerCase().includes(norm)) {
        variantTokens.push(unit);
        processedTokens.add(norm);
        if (!oneFeatureToken) oneFeatureToken = unit;
      }
    });
  }

  // Calculate traits for high-variance check (Features only, no MPN yet)
  const traitCount = variantTokens.length;
  // Threshold: Listing up to 3 features is clean. 4+ features triggers MPN fallback.
  const isHighVariance = isLaptop || traitCount > 3;

  // LOGIC SWITCH: If high variance, use "One Feature + MPN" instead of listing everything.
  // This prevents overly long titles while keeping them distinct.
  // [Part 4] RAM Spec Refinement (Deduplication)
  if (isRAM) {
    // 1. If we have a speed-prefixed DDR (e.g. DDR5-6000), remove the plain DDR (e.g. DDR5)
    const hasSpeedDDR = variantTokens.some((t) => /^ddr\d+-\d+$/i.test(t));
    if (hasSpeedDDR) {
      variantTokens = variantTokens.filter((t) => !/^ddr\d+$/i.test(t));
    }

    // 2. If we have a kit spec (e.g. 2x16GB), remove the total capacity (e.g. 32GB) IF it matches
    const kitSpec = variantTokens.find((t) =>
      /^\d+x\d+g?b$/i.test(t.toLowerCase()),
    );
    if (kitSpec) {
      const match = kitSpec.toLowerCase().match(/^(\d+)x(\d+)g?b$/);
      if (match) {
        const total = parseInt(match[1]) * parseInt(match[2]);
        const totalStr = `${total}gb`;
        variantTokens = variantTokens.filter(
          (t) => t.toLowerCase() !== totalStr,
        );
      }
    }
  }

  let variantSuffix = "";
  if (isHighVariance && mpnVal && mpnVal.length > 3 && !isRAM) {
    variantSuffix = (
      oneFeatureToken ? `${oneFeatureToken} ${mpnVal}` : mpnVal
    ).trim();
  } else {
    // For low variance (or RAM), list all tokens found (Color, Storage, etc.).
    // IDEALO Pattern: If we have "Cellular", we don't need "Wi-Fi" (it's redundant/implied).
    const hasCellular = variantTokens.some((t) =>
      /cellular|5g|lte/i.test(t.toLowerCase()),
    );
    const filteredTokens = hasCellular
      ? variantTokens.filter((t) => !/wi-?fi/i.test(t.toLowerCase()))
      : variantTokens;

    variantSuffix = filteredTokens.join(" ").trim();

    // For RAM, always append MPN if it's unique
    if (isRAM && mpnVal && !variantSuffix.includes(mpnVal)) {
      variantSuffix = `${variantSuffix} ${mpnVal}`.trim();
    }
  }

  const variantLabel =
    isHighVariance && mpnVal && mpnVal.length > 3
      ? Array.from(new Set([...variantTokens, mpnVal]))
          .join(" ")
          .trim()
      : Array.from(new Set(variantTokens)).join(" ").trim();

  const displayTitle = variantSuffix
    ? `${modelTitle} ${variantSuffix}`
    : modelTitle;

  // 6. Dedicated CPU Naming Strategy
  // Automated reconstruction from merged multi-source patterns.
  if (category === "prozessoren") {
    const factsA = extractCpuFacts(product.title || "", resolvedBrand);
    const factsO = extractCpuFacts(product.officialTitle || "", resolvedBrand);

    // Brand preservation logic (e.g. Intel®)
    const brandRegex = new RegExp(
      `\\b${resolvedBrand}[™®©]*(?:\\b|\\s|$)`,
      "i",
    );
    const brandMatch =
      (product.title || "").match(brandRegex) ||
      (product.officialTitle || "").match(brandRegex);
    const finalBrand = brandMatch ? brandMatch[0] : resolvedBrand;

    const series =
      factsA.series.length >= factsO.series.length
        ? factsA.series
        : factsO.series;
    const modelNumber = factsA.modelNumber || factsO.modelNumber;
    const cores = factsA.cores || factsO.cores;

    const isRange = (f: string) => f.includes("-") || f.includes("/");
    let frequency = factsA.frequency;
    if (isRange(factsO.frequency)) frequency = factsO.frequency;
    else if (!isRange(factsA.frequency) && factsO.frequency)
      frequency = factsO.frequency;

    const modelParts = [];
    if (series) modelParts.push(series);
    if (modelNumber) modelParts.push(modelNumber);
    if (cores) modelParts.push(cores);
    if (frequency) modelParts.push(frequency);

    const reconstructedModel = modelParts.join(" ").trim();
    const cleanModel = reconstructedModel.replace(/[™®©]/g, "").trim();
    const finalDisplayTitle = `${finalBrand} ${reconstructedModel}`
      .replace(/\s+/g, " ")
      .trim();

    if (reconstructedModel.length > 3) {
      return {
        brand: richBrand,
        model: cleanModel,
        fullModel: finalDisplayTitle,
        shortModel: modelNumber
          ? modelNumber.replace(/[™®©]/g, "").trim()
          : cleanModel.split(/\s+/)[0],
        variantLabel: "",
        variantMap: {},
        variantTokens: [],
        displayTitle: finalDisplayTitle,
        modelTitle: finalDisplayTitle,
        variantSuffix: "",
        mpn: mpnVal || undefined,
        isHighVariance: false,
        traitCount: 0,
        isLaptop: false,
        categoryUsed: category,
      };
    }
  }

  return {
    brand: richBrand,
    model: hubModelName,
    fullModel: modelTitle,
    shortModel: modelHead,
    variantLabel,
    variantMap,
    variantTokens,
    displayTitle,
    modelTitle,
    variantSuffix,
    mpn: mpnVal || undefined,
    isHighVariance,
    traitCount,
    isLaptop,
    categoryUsed: category,
  };
}
