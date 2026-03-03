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

interface DisplayFacts {
  size: string;
  resolution: string;
  refreshRate: string;
  panel: string;
  curved?: boolean;
  ultraWide?: boolean;
  usbC?: boolean;
  gaming?: boolean;
  hdr?: boolean;
}

/**
 * Display Identity Engine: Extracts size, resolution, and hz from monitors/TVs.
 */
function extractDisplayFacts(title: string): DisplayFacts {
  const t = title.replace(/\s+/g, " ").trim();

  // 1. Extract Size (e.g., 27", 34, 27 Zoll, 65 Inch, 68.4cm)
  let sizeMatch = t.match(/(\d+(?:[\.,]\d+)?)\s*(?:Zoll|Inch|cm|(?:\"))/i);
  if (!sizeMatch) {
    // Fallback to standalone numbers if they look like plausible monitor sizes (13-100)
    const standaloneMatch = t.match(/(?:\s|^|-)([1-9]\d|10\d)(?:\s|$)/);
    if (standaloneMatch) {
      const val = parseInt(standaloneMatch[1]);
      if (val >= 13 && val <= 100) {
        sizeMatch = standaloneMatch;
      }
    }
  }

  let size = sizeMatch ? sizeMatch[1].replace(",", ".") + '"' : "";
  if (size.endsWith('cm"')) size = size.replace('cm"', "");

  // Validation: Size must be realistic for display (e.g. 10-110)
  const sizeVal = parseFloat(size);
  if (isNaN(sizeVal) || sizeVal < 10 || sizeVal > 110) size = "";

  // 2. Extract Resolution (4K, UHD, QHD, WQHD, FHD, etc.)
  const resPatterns = [
    /\b4K\b/i,
    /\bUHD\b/i,
    /\bQHD\b/i,
    /\bWQHD\b/i,
    /\b(FHD|Full HD|1920x1080|3840\s*x\s*2160)\b/i,
    /\b(3440x1440|2560x1440)\b/i,
  ];
  let resolution = "";
  for (const p of resPatterns) {
    const match = t.match(p);
    if (match) {
      resolution = match[0].toUpperCase().replace(/\s+/g, "");
      if (resolution === "FULLHD" || resolution === "1920X1080")
        resolution = "FHD";
      if (resolution === "3840X2160") resolution = "4K";
      break;
    }
  }

  // 3. Extract Refresh Rate (e.g., 144Hz, 240 Hz)
  const refreshMatch = t.match(/(\d+)\s*Hz\b/i);
  const refreshRate = refreshMatch ? refreshMatch[1] + "Hz" : "";

  // 4. Extract Panel (OLED, QLED, IPS, VA, TN)
  const panelMatch = t.match(/\b(OLED|QLED|IPS|VA|TN)\b/i);
  const panel = panelMatch ? panelMatch[1].toUpperCase() : "";

  // 5. Special Features
  const curved = /\b(Curved|Gewölbt)\b/i.test(t);
  const ultraWide = /\bultra-?wide\b/i.test(t);
  const usbC = /\busb-?c\b/i.test(t);
  const gaming = /\bgaming\b/i.test(t);
  const hdr = /\b(hdr\d*|hdr10|hdr400|hdr600|hdr1000)\b/i.test(t);

  return {
    size: size ? (size.includes('"') ? size : size + '"') : "",
    resolution,
    refreshRate,
    panel,
    curved,
    ultraWide,
    usbC,
    gaming,
    hdr,
  };
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
): { series: string; capacity: string; ddr: string; cl: string; kit: string } {
  const title = rawTitle || "";

  // ── 1. Capacity ───────────────────────────────────────────────────────────
  let capacity = "";
  let kit = "";
  const capCandidates: Array<{
    num: number;
    unit: string;
    raw: string;
    kit?: string;
  }> = [];

  const toMB = (n: number, u: string) =>
    u === "TB" ? n * 1024 * 1024 : u === "GB" ? n * 1024 : n;

  // Source 0: Spec field
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

  // Source 2: Kit patterns with parens — "(2x16GB)", "(2x 8GB)"
  for (const m of title.matchAll(
    /\(\s*(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(GB|TB|MB)\s*\)/gi,
  )) {
    const pods = parseInt(m[1]);
    const perPod = parseFloat(m[2]);
    const total = pods * perPod;
    const unit = m[3].toUpperCase();
    capCandidates.push({
      num: total,
      unit,
      raw: `${total}${unit}`,
      kit: `${pods}x${perPod}${unit}`,
    });
  }

  // Source 3: Embedded in model names — "VENGEANCELPX16GB"
  for (const m of title.matchAll(/[a-zA-Z](\d+(?:\.\d+)?)(GB|TB|MB)/gi)) {
    capCandidates.push({
      num: parseFloat(m[1]),
      unit: m[2].toUpperCase(),
      raw: m[1] + m[2].toUpperCase(),
    });
  }

  // Source 4: Kit patterns without parens — "2x8GB", "2 x 8 GB"
  for (const m of title.matchAll(
    /\b(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(GB|TB|MB)\b/gi,
  )) {
    const pods = parseInt(m[1]);
    const perPod = parseFloat(m[2]);
    const total = pods * perPod;
    const unit = m[3].toUpperCase();
    capCandidates.push({
      num: total,
      unit,
      raw: `${total}${unit}`,
      kit: `${pods}x${perPod}${unit}`,
    });
  }

  if (capCandidates.length) {
    const sorted = capCandidates.sort(
      (a, b) => toMB(b.num, b.unit) - toMB(a.num, a.unit),
    );
    capacity = sorted[0].raw;
    // Prefer kit info from the same candidate if possible
    kit = sorted[0].kit || capCandidates.find((c) => c.kit)?.kit || "";
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

  const ddrTypeMatch = specTyp.match(/^(DDR\d+)/i);
  const speedMatchRegex = /(\d{4,5})\s*(?:MHz|Mhz|mhz|MT\/s|mt\/s)?/;
  const speedSpecMatch = specSpeed.match(speedMatchRegex);

  if (ddrTypeMatch && speedSpecMatch) {
    ddr = `${ddrTypeMatch[1].toUpperCase()}-${speedSpecMatch[1]}`;
  } else {
    // Try to find combined "DDR5-6000" in title
    const titleCombinedMatch = title.match(/\b(DDR\d+)[- _](\d{4,5})\b/i);
    if (titleCombinedMatch) {
      ddr = `${titleCombinedMatch[1].toUpperCase()}-${titleCombinedMatch[2]}`;
    } else {
      const ddrOnlyMatch = ddrTypeMatch || title.match(/\b(DDR\d+)\b/i);
      // Look for speed with unit OR lone 4-digit number in typical RAM range (2133-8400)
      const speedOnlyMatch =
        speedSpecMatch ||
        title.match(/\b(\d{4,5})\s*(?:MHz|MT\/s)\b/i) ||
        title.match(
          /\b(2133|2400|2666|2933|3000|3200|3600|4000|4400|4800|5200|5600|6000|6400|7200|8000|8400)\b/,
        );

      if (ddrOnlyMatch && speedOnlyMatch) {
        ddr = `${ddrOnlyMatch[1].toUpperCase()}-${speedOnlyMatch[1]}`;
      } else if (ddrOnlyMatch) {
        ddr = ddrOnlyMatch[1].toUpperCase();
      }
    }
  }

  // ── 3. Latency ────────────────────────────────────────────────────────────
  let cl = "";
  const specCl = String(
    specs["Latenz"] || specs["CAS Latency"] || specs["CAS-Latenz"] || "",
  ).trim();
  const clSpecMatch = specCl.match(/(?:CL|C)\s*(\d+)/i);
  if (clSpecMatch) {
    cl = `CL${clSpecMatch[1]}`;
  } else {
    // From title: "CL30", "C30", "30-36-36-76"
    const titleClMatch = title.match(/\b(?:CL|C)[\s-]?(\d+)\b/i);
    if (titleClMatch) {
      cl = `CL${titleClMatch[1]}`;
    } else {
      // Look for lone numbers that look like latencies in range 10-60 near other specs
      const loneClMatch = title.match(/\s(\d{2})-\d{2}-\d{2}/);
      if (loneClMatch) cl = `CL${loneClMatch[1]}`;
    }
  }

  // ── 4. Series Name ────────────────────────────────────────────────────────
  let series = "";

  // Split title at the first spec-like cluster
  const seriesSplitRegex =
    /\b(?:\d+\s*(?:GB|TB|MB)\b|DDR\d+|\d{4,5}\s*(?:MHz|MT\/s))/i;
  const splitIdx = title.search(seriesSplitRegex);
  let candidate =
    splitIdx !== -1 ? title.substring(0, splitIdx).trim() : title.trim();

  // Strip noise including kit patterns and mixed specs
  candidate = candidate
    .replace(/\(\s*\d+\s*[xX×]\s*\d+\s*(?:GB|TB|MB)?[^)]*\)/gi, "")
    .replace(/\b\d+\s*[xX×]\s*\d+\s*(?:GB|TB|MB)?\b/gi, "")
    .replace(/\(\s*\d+\s*[xX×][^)]*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const brandWords = brand.toLowerCase().split(/\s+/);
  const mpnNorm = mpn.toLowerCase().replace(/[^a-z0-9]/g, "");

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

  let remaining = candidateWords.slice(startIdx);
  remaining = remaining
    .filter((w) => {
      const wLower = w.toLowerCase();
      const wNorm = wLower.replace(/[^a-z0-9]/g, "");

      if (brandWords.includes(wNorm)) return false;
      if (mpnNorm && (wNorm.includes(mpnNorm) || mpnNorm.includes(wNorm)))
        return false;

      const isNoise =
        /^(ram|ddr\d*|ssd|dimm|sodimm|memory|arbeitsspeicher|kit|desktop|notebook|dual|single|expo|xmp|module?|pc\d*|cl\d*)$/i.test(
          wNorm,
        );
      return !isNoise && w.length > 0;
    })
    .map((w) => w.replace(/(\d+(?:\.\d+)?)(GB|TB|MB)$/i, "").trim())
    .filter(Boolean);

  series = remaining.join(" ").trim();
  series = series
    .replace(/[,;]+$/, "")
    .replace(/^[,;]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { series, capacity, ddr, cl, kit };
}

export function getProductIdentity(product: Partial<Product>): ProductIdentity {
  const rawBrand = (product.brand || "").trim();
  const title = (product.title || "").trim();
  const rawCategory = (
    product.category ||
    product.category_id ||
    ""
  ).toLowerCase();

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
    monitore: "monitors",
    fernseher: "televisions",
    prozessoren: "processors-cpus",
    grafikkarten: "graphics-cards",
    mainboards: "motherboards",
    kopfhoerer: "headphones",
    lautsprecher: "speakers",
    soundbars: "soundbars",
    tastaturen: "keyboards",
    maeuse: "mice",
    "wlan-router": "routers",
    haushaltselektronik: "household-electronics",
    kuehlschraenke: "refrigerators",
    waschmaschinen: "washing-machines",
    geschirrspueler: "dishwashers",
    backoefen: "ovens",
    kochfelder: "cooktops",
    waeschetrockner: "dryers",
    kuechenmaschinen: "kitchen-machines",
    mikrowellen: "microwaves",
    dunstabzugshauben: "cooker-hoods",
    gefrierschraenke: "freezers",
    herde: "stoves",
    festplatten: "hard-drives",
    "nas-systeme": "nas",
    "pc-gehaeuse": "pc-cases",
    "cpu-kuehler": "cpu-coolers",
    laufwerke: "drives",
    spielekonsolen: "consoles",
    videospiele: "games",
    digitalkameras: "cameras",
    systemkameras: "system-cameras",
    speicherkarten: "memory-cards",
    objektive: "lenses",
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
  const isDisplay =
    category === "monitors" ||
    category === "819" ||
    category.includes("monitor") ||
    category.includes("display") ||
    category.includes("televis") ||
    category.includes("tv") ||
    category.includes("fernseher");

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
      title.split(/[\s,]+/).find((w) => {
        const wNorm = w.toLowerCase().replace(/[^a-z0-9]/g, "");
        // Exclude pure numbers that look like resolution components for displays (1080, 1440, 3440, 3840)
        if (isDisplay && /^\d{4}$/.test(wNorm)) {
          if (/^(1080|1440|2160|3440|3840)$/.test(wNorm)) return false;
        }
        return (
          /^[a-z]{0,2}\d+[a-z\d\/-]*$/i.test(w) &&
          w.length >= 4 &&
          !/^\d{3,4}x\d{3,4}$/i.test(wNorm) &&
          !/^\d+hz/i.test(w) &&
          !/^\d+ms/i.test(w)
        );
      }) || ""
    )
      .replace(/[,;]+$/, "")
      .toUpperCase();

  // 3c. RAM NAMING STRATEGY (Idealo-style)
  // Short-circuits the generic parser entirely for RAM products.
  // Hub:     "Brand Series Capacity DDRx-Speed CLx"
  // Variant: "Brand Series Capacity DDRx-Speed CLx MPN"
  if (isRAM) {
    const { series, capacity, ddr, cl, kit } = extractRamFacts(
      title,
      resolvedBrand,
      mpnVal,
      specs,
    );

    const kitText = kit ? `Kit (${kit})` : "";
    const hubParts = [series, capacity, kitText, ddr, cl].filter(Boolean);
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
    "usb",
    "monitor",
    "p3",
    "dci-p3",
    "ms",
    "plus",
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

  if (category === "processors-cpus") {
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
      /^(oled|qled|hdtv|uhd|fhd|wqhd|rtx|gtx|rx|xt|ti|super|oc|ai|5g|4g|lte|wifi|usb|ips)$/.test(
        clean,
      )
    )
      return clean.toUpperCase();
    if (/^m[1-9]$/.test(clean)) return clean.toUpperCase();
    if (/^s\d+$/.test(clean)) return clean.toUpperCase();
    if (
      /^(macbook|iphone|ipad|pixel|galaxy|thinkpad|zenbook|vivobook|legion|ultrasharp)$/i.test(
        clean,
      )
    ) {
      if (clean === "macbook") return "MacBook";
      if (clean === "iphone") return "iPhone";
      if (clean === "ipad") return "iPad";
      if (clean === "ultrasharp") return "UltraSharp";
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w;
  };

  // Determine the primary source for identity extraction.
  // We prefer officialModel if available, otherwise we use the richest available title.
  const longestTitle =
    product.officialTitle &&
    product.officialTitle.length > (product.title || "").length
      ? product.officialTitle
      : product.title || "";

  let baseTitle = officialModel || longestTitle;

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

  const splitRegex =
    isRAM || isDisplay ? / \/ | \||: /i : / \- | \/ | \(| \||: |,/i;
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

  rawWords.forEach((word: string, index: number) => {
    const cleanWord = word.replace(/^[(\[",\.]+|[)\]",\.]+/g, "");
    const normalized = normalizeAccents(cleanWord);
    const rawLower = normalized.toLowerCase();
    const cleanLower = rawLower.replace(/[^a-z0-9]/g, "");
    if (!cleanLower || cleanLower === resolvedBrandLower) return;

    // [Part 2] Token Deduplication Logic
    const tokenNorm = cleanLower;
    // Protect "plus" from being stripped as common noise
    if (tokenNorm === "plus") {
      modelWords.push(word);
      return;
    }

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

    if (isDisplay) {
      const displayStrippable = [
        "ips",
        "oled",
        "va",
        "tn",
        "qled",
        "quantum",
        "dot",
        "curved",
        "backlight",
        "black",
        "silver",
        "vesa",
        "freesync",
        "gsync",
        "g-sync",
        "adaptive-sync",
        "adaptive",
        "hdr",
        "hdr10",
        "hdr400",
        "hdr600",
        "hdr1000",
        "speaker",
        "speakers",
        "audio",
        "height",
        "adjustable",
        "tilt",
        "swivel",
        "pivot",
        "stand",
        "vga",
        "dvi",
        "hdmi",
        "displayport",
        "dp",
        "usb-c",
        "type-c",
        "thunderbolt",
        "kvm",
        "power",
        "delivery",
        "pd",
        "qhd",
        "wqhd",
        "uwqhd",
        "fhd",
        "uhd",
        "dcip3",
        "monitor",
        "display",
        "gaming",
        "4kmonitor",
        "uhdmonitor",
        "qhdmonitor",
        "wqhdmonitor",
        "fhdmonitor",
        "uwqhdmonitor",
        "gamingmonitor",
        "curvedmonitor",
        "4k-monitor",
        "uhd-monitor",
        "qhd-monitor",
        "wqhd-monitor",
        "fhd-monitor",
        "uwqhd-monitor",
        "gaming-monitor",
        "curved-monitor",
      ];
      if (displayStrippable.includes(cleanLower)) {
        return;
      }

      // Strip resolution specs (e.g. 2560x1440, 3840x2160, 4K, 5K)
      if (/^\d+x\d+$/i.test(cleanLower)) return;
      if (/^[458]k$/i.test(cleanLower)) return;

      // Strip refresh rate (e.g. 144hz, 165hz, 240hz, 165HzDP)
      if (/^\d+hz.*$/i.test(cleanLower)) return;

      // Strip response time (e.g. 1ms, 0.5ms, 5ms)
      if (/^\d+(\.\d+)?ms.*$/i.test(cleanLower)) return;

      // Strip curved radius (e.g. 1500R, 1700R)
      if (/^\d+r$/i.test(cleanLower)) return;

      // Strip brightness (e.g. 300cd/m², 400cd)
      if (cleanLower.includes("cd/m") || cleanLower.includes("nits")) return;

      // Strip percentages (e.g. 98%, 99%)
      if (/^\d+%?$/.test(cleanWord)) return;
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
      /^(rtx|gtx|rx|ti|super|m\d|s\d+|pro|air|max|ultra|pixel|iphone|ipad|galaxy|macbook|artisan|aero|legion|tuf|rog|omen|mfp|gaming|ultrasharp|plus)$/i.test(
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
      const prevWord = rawWords[index - 1];
      const nextWord = rawWords[index + 1];
      const prevC = prevWord.replace(/[^a-z0-9]/g, "");
      const nextC = nextWord.replace(/[^a-z0-9]/g, "");

      // Only strip if strictly numeric on both sides (resolution)
      // If the word containing 'x' was split from a model (e.g. 32GS95UX),
      // it should have been handled by the model logic/tokenization already.
      if (/^\d+$/.test(prevC) && /^\d+$/.test(nextC)) return;
    }

    // Strip if it's the discovered MPN (always move MPN to suffix)
    // BUT only if we have other descriptive words (to avoid empty models like RM750e)
    // AND NEVER for displays/TVs as their models often are their MPNs
    if (
      mpnVal &&
      cleanLower === mpnVal.toLowerCase().replace(/[^a-z0-9]/g, "")
    ) {
      const looksLikeSKU = mpnVal.length > 6 || /[\/\-]/.test(mpnVal);
      if (looksLikeSKU && modelWords.length > 0 && !isDisplay) return;
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
    let formatted = fixTechCasing(cleanWord.replace(/[,\-:\/]+$/, ""));
    const formattedLower = formatted?.toLowerCase();

    // Suffix Preservation: If this word matches our discovered MPN after cleaning,
    // and we're in a display category, use the full MPN to preserve suffixes like -B or -DE.
    // We do this AFTER fixTechCasing to ensure the MPN overrides any standard formatting.
    if (isDisplay && mpnVal) {
      const mpnClean = mpnVal.toLowerCase().replace(/[^a-z0-9]/g, "");
      const tokenClean = cleanLower; // Use the loop's cleanLower for accuracy
      if (tokenClean === mpnClean) {
        formatted = mpnVal;
      }
    }

    if (formatted) {
      const formattedLowerMatch = formatted.toLowerCase();
      const existingIndex = modelWords.findIndex(
        (w) => w.toLowerCase() === formattedLowerMatch,
      );
      if (existingIndex !== -1) {
        if (formatted.length > modelWords[existingIndex].length) {
          modelWords[existingIndex] = formatted;
        }
      } else {
        modelWords.push(formatted);
      }
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

    if (category === "processors-cpus") {
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
      // Don't strip pure numbers (like 65) if they are immediately followed by a unit or "Plus"
      if (/^\d+$/.test(mw)) {
        const unitRegex = new RegExp(
          `\\b${mw}\\s*(gb|tb|mb|hz|inch|zoll|\\"|plus)\\b`,
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
      category !== "processors-cpus" &&
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
  if (category !== "processors-cpus") {
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

  let displayTitle = variantSuffix
    ? `${modelTitle} ${variantSuffix}`
    : modelTitle;

  // 6. Dedicated CPU Naming Strategy
  // Automated reconstruction from merged multi-source patterns.
  if (category === "processors-cpus") {
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

  // 7. Dedicated Display Naming Strategy (Monitors & TVs)
  if (isDisplay) {
    const facts = extractDisplayFacts(title);

    const subtractTokens = new Set<string>();
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (facts.size) {
      const sizeNorm = norm(facts.size);
      // Only subtract if it's a full trait mention with units,
      // not just a bare count that might be the model name (e.g. Dell 34)
      if (title.toLowerCase().includes(facts.size.toLowerCase())) {
        subtractTokens.add(sizeNorm);
      }
    }
    if (facts.resolution) {
      subtractTokens.add(norm(facts.resolution));
      // Also catch the raw resolution if it was mapped (e.g. 1920x1080 -> FHD)
      const resMatch = title.match(/\b(1920x1080|2560x1440|3440x1440)\b/i);
      if (resMatch) subtractTokens.add(norm(resMatch[0]));
    }
    if (facts.panel) subtractTokens.add(norm(facts.panel));
    if (facts.refreshRate) subtractTokens.add(norm(facts.refreshRate));
    if (facts.usbC) subtractTokens.add("usbc");
    if (facts.curved) {
      subtractTokens.add("curved");
      subtractTokens.add("gewolbt");
    }
    if (facts.gaming) subtractTokens.add("gaming");
    if (facts.hdr) subtractTokens.add("hdr");
    if (facts.ultraWide) subtractTokens.add("ultrawide");

    // MINIMALIST: Strip bare size numbers (e.g. "34" from "Dell 34 Plus")
    if (facts.size) {
      const numericSize = facts.size.replace(/[^0-9.]/g, "");
      if (numericSize) {
        subtractTokens.add(numericSize);
        // Also strip common decimal variations (68.4 -> 68, 684)
        if (numericSize.includes(".")) {
          subtractTokens.add(numericSize.replace(".", ""));
          subtractTokens.add(numericSize.split(".")[0]);
        }
      }
    }

    // Clear aspect ratios and tech jargon that commonly appears in Amazon monitor titles
    const aspectMatch = title.match(/\b(16:9|21:9|32:9)\b/);
    if (aspectMatch) subtractTokens.add(aspectMatch[0].replace(/:/g, ""));

    // Extract common resolution components to strip them individually
    const resRawMatch = title.match(/\b(\d{4})\s*x\s*(\d{4})\b/);
    if (resRawMatch) {
      subtractTokens.add(resRawMatch[1]);
      subtractTokens.add(resRawMatch[2]);
      subtractTokens.add("x");
    }

    const dciP3Match = title.match(/\bdci-p3\s*(\d+%?)\b/i);
    if (dciP3Match) {
      subtractTokens.add("dcip3");
      subtractTokens.add(dciP3Match[1].replace(/%/g, ""));
    }

    const percentageMatch = title.match(/(\d+)%\b/);
    if (percentageMatch) subtractTokens.add(percentageMatch[1]);

    // Filter model words: remove things we've already extracted as traits
    // and technical noise that shouldn't be in the model name or slug
    const stripList = [
      "Zoll",
      "Inch",
      "Monitor",
      "Display",
      "TV",
      "Smart",
      "1ms",
      "5ms",
      "sRGB",
      "cd/m2",
      "Fast",
      "Office",
      "Business",
      "Home",
      "Schwarz",
      "Weiss",
      "Weiß",
      "Silber",
      "Grau",
      "Black",
      "White",
      "Silver",
      "Gray",
      "Grey",
      "32",
      "75",
      "27",
      "34",
      "Lautsrecher",
      "Lautsprecher",
      "Speaker",
      "Speakers",
      "Reaktionszeit",
      "Response",
      "Time",
      "HDMI",
      "DisplayPort",
      "VESA",
      "ELMB",
      "HDR",
      "Sync",
      "FreeSync",
      "GSync",
      "G-Sync",
      "Hz",
      "ms",
      "IPS",
      "VA",
      "TN",
      "Resolution",
      "Super",
      "Ultra",
      "Pro",
      "Gaming",
      "Premium",
      "Contrast",
      "Nits",
      "sRGB",
      "Color",
      "Gamut",
      "UHD",
      "4K",
      "FHD",
      "QHD",
      "WQHD",
      "HD",
      "QLED",
      "cm",
      "Ultra",
      "UHD",
      "Resolution",
      "Super",
      "AE",
      "AMD",
      "NVIDIA",
      "DisplayHD",
      "FreeSync",
      "GSync",
      "Sync",
      "Adaptive",
      "Premium",
      "Professional",
      "Business",
      "Home",
      "Gebraucht",
      "B-Ware",
      "Refurbished",
      "Renewed",
      "Office",
      "Work",
      "Elite",
      "UltraSharp",
      "Series",
      "Inch",
      "Zoll",
      "Monitor",
      "Display",
      "TV",
      "HDR10",
      "HDR400",
      "HDR600",
      "HDR1000",
      "400",
      "600",
      "1000",
      "99",
      "100",
      // Common cm sizes for monitors to strip (noise)
      "60",
      "61",
      "62",
      "68",
      "684", // Normalized 68.4
      "69",
      "70",
      "80",
      "81",
      "86",
      "108",
      "120",
      "138",
      "163",
      "164",
      "165",
      "189",
    ].map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ""));

    // HARDCORE MINIMALIST: Specs Cutoff
    // If we see any of these words, we stop extraction entirely to prevent technical leakage
    const CORE_DISPLAY_SERIES = new Set([
      "rog",
      "strix",
      "tuf",
      "ultragear",
      "odyssey",
      "proart",
      "ultrasharp",
      "predator",
      "alienware",
      "nitro",
      "viera",
      "bravia",
      "aquos",
      "thinq",
      "nanocell",
      "qned",
      "crystal",
      "pripone",
      "modern",
      "mag",
      "swift",
      "zenith",
      "viewfinity",
      "zenscreen",
      "ultrasharp",
      "prolite",
      "studio",
    ]);

    const PANEL_TYPES = new Set(["led", "oled", "qled"]);

    const IDENTITY_DISPLAY_DESCRIPTORS = new Set([
      "plus",
      "pro",
      "mini",
      "master",
      "studio",
    ]);

    const GENERIC_DISPLAY_SERIES = new Set([
      "gaming",
      "display",
      ...IDENTITY_DISPLAY_DESCRIPTORS,
      ...PANEL_TYPES,
      "curved",
      "ultraslim",
      "g",
      "s",
      "e",
      "p",
    ]);

    const COMBINED_DISPLAY_SERIES = new Set([
      ...CORE_DISPLAY_SERIES,
      ...GENERIC_DISPLAY_SERIES,
    ]);

    const specsCutoffRegex =
      /^(hz|ms|zoll|inch|hdr|uhd|fhd|qhd|wqhd|uwqhd|ips|va|usbc|hdmi|displayport|adaptivesync|gsync|freesync|gtg|dcip3|p3|bit|qdoled|qd-oled|displayhdr|speaker|reaktionszeit|arbeiten|sie|wie|es|moechten|brauchen|technik|tuer|einen|tag|projekten|konferenzen|mehr|hoehenverstellbare|diagonale|dp|vesa|elmb|lautsrecher|lautsprecher|office|business|home|schwarz|weiss|weiß|silber|grau|black|white|silver|resolution|super|ultra|gaming|premium|contrast|nits|srgb|color|gamut|4k|5k|8k|full|cm|wuxga|wqxga|wfhd|professional|gebraucht|refurbished|bware|fast|tft|lcd|tv|fernseher|produktbeschreibung|sehen|unterhaltung|produktivitaet|ob|oder|retina|garantie|years|jahre|eingebaute|lautsprecher|speaker|pip|pbp|pcp|pippbp|pippcp|mprt|panel|sync|adaptive|aspect|ratio|ports|1080p|1440p|2160p|dual|quad|achsen|achse|219|329|[\d.]+i|[\d.]+[ab]|(dqhd|uhd|fhd|qhd|wqhd|uwqhd|wfhd)?\d+x\d+.*|[a-z0-9.]*\d+x\d+[a-z0-9.]*|[a-z0-9.]*(hdmi|dp|tmds|vga|farbraum|ports|stromversorgung|nits|percentage|farb|raum|dqhd|uhd|fhd|qhd|wqhd|uwqhd|wfhd|res)[a-z0-9.]*|v\d+[\d.]*|\d+x|\d+v\d+|\d+x\d+.*|\d+cdm.*|\d+cd.*|\d+hz.*|\d+ms.*|\d+w.*|\d+bit.*|\d+r.*|\d+h.*|\d+achsen|2x|3x|4x|5x|6x|[\d.]+nits?|[\d.]+percentage|percentage)(monitor|display|bildschirm|fernseher|tv)?$/i;
    const inchPattern = /^\d+["”']|^\d+zoll$/i;
    const regionalSuffixRegex =
      /[-.](?:[A-Z]{3,4}|AE|EU|UK|DE|CH|US|WAEU|AEU)$/i;

    const isBatchNumber = (w: string) => {
      const clean = w.replace(/[^a-z0-9]/gi, "");
      return /^[a-z]\d{6,}$/i.test(clean) || /^\d{9,}$/.test(clean);
    };

    // Identify a potential MPN from the words if one isn't explicitly provided
    // For monitors, this is usually a mix of letters and numbers like S3425DW or 27UP650K
    // We search FROM THE END as Amazon titles often put the model code last
    let modelMPN = mpnVal;

    // For monitors/TVs, we ALWAYS try to find a more "human-readable" model code in the title
    // because the provided 'mpnVal' is often a raw part number (e.g. 90LM0B40-B01B71)
    // while the title contains the consumer-facing model (e.g. VG257Q5A).
    const isHumanReadable = (m: string) => {
      if (!m) return false;
      const clean = m.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (isBatchNumber(clean)) return false;
      // Displays often have very long MPNs (e.g. LS27DG600SUXEN is 14 chars)
      const maxLen = isDisplay ? 20 : 12;
      if (clean.length > maxLen) return false;
      return true;
    };

    // For displays, identify ALL valid MPN/model code candidates
    const mpnCandidates = new Set<string>();
    if (isDisplay) {
      for (const w of rawWords) {
        // Attached Noise check (e.g. Gebraucht"123")
        const subParts = w.split(/[^a-z0-9]/i).filter(Boolean);
        let foundNoisePart = false;
        for (const sp of subParts) {
          const spNorm = sp.toLowerCase();
          if (
            spNorm === "gebraucht" ||
            spNorm === "refurbished" ||
            spNorm === "bware" ||
            /^\d{6,}$/.test(spNorm)
          ) {
            foundNoisePart = true;
            break;
          }
        }
        if (foundNoisePart) continue;

        const wNorm = w.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (
          wNorm.length >= 2 &&
          /[a-z]/i.test(wNorm) &&
          /[0-9]/.test(wNorm) &&
          !specsCutoffRegex.test(wNorm) &&
          !isBatchNumber(wNorm)
        ) {
          mpnCandidates.add(wNorm);
          if (!modelMPN || wNorm.length > modelMPN.length) {
            modelMPN = w.replace(/[()]/g, "");
          }
        }
      }
    }
    const modelMpnNorm = modelMPN
      ? modelMPN.toLowerCase().replace(/[^a-z0-9]/g, "")
      : "";
    const hasTechnicalDots = (w: string) => /\d+\.\d+/.test(w); // e.g., 86.4, 1.4

    let firstMpnIndex = -1;
    for (let j = 0; j < rawWords.length; j++) {
      const wjNorm = rawWords[j].toLowerCase().replace(/[^a-z0-9]/g, "");
      if (
        mpnCandidates.has(wjNorm) ||
        (modelMpnNorm && wjNorm === modelMpnNorm)
      ) {
        firstMpnIndex = j;
        break;
      }
    }

    let stopped = false;
    let mpnFound = false;
    let hasIdentityPushed = false;
    const displayModelWords: string[] = [];

    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];
      const wNorm = w.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Avoid repeating the brand name in the model part
      if (wNorm === resolvedBrandLower) continue;

      const isMpn =
        mpnCandidates.has(wNorm) || (modelMpnNorm && wNorm === modelMpnNorm);
      const isCoreSeries = CORE_DISPLAY_SERIES.has(wNorm);
      const isIdentity = IDENTITY_DISPLAY_DESCRIPTORS.has(wNorm);
      const isPanel = PANEL_TYPES.has(wNorm);
      const isGeneric = GENERIC_DISPLAY_SERIES.has(wNorm);
      const isBatch = isBatchNumber(w);
      const isTechDot = hasTechnicalDots(w);

      // EXEMPT: Protect the Model Code and ALWAYS push it
      if (isMpn) {
        displayModelWords.push(w.replace(/[()]/g, ""));
        mpnFound = true;
        stopped = true;
        hasIdentityPushed = true;
        continue;
      }

      // Core series names are usually preserved, but we strip trailing ones after MPN
      if (isCoreSeries && !stopped) {
        displayModelWords.push(w);
        hasIdentityPushed = true;
        continue;
      }

      // Attached Noise check (e.g. Gebraucht"123")
      const subParts = w.split(/[^a-z0-9]/i).filter(Boolean);
      let foundNoisePart = false;
      for (const sp of subParts) {
        const spNorm = sp.toLowerCase();
        if (
          spNorm === "gebraucht" ||
          spNorm === "refurbished" ||
          spNorm === "bware" ||
          /^\d{6,}$/.test(spNorm)
        ) {
          foundNoisePart = true;
          break;
        }
      }

      // Determine if this word represents technical noise
      const matchesNoisePattern =
        specsCutoffRegex.test(wNorm) ||
        inchPattern.test(w) ||
        isBatch ||
        isTechDot ||
        foundNoisePart;

      // Generic words (Gaming, Display, etc.) are only noise if we haven't found an identity yet
      // OR if they are part of a lookahead skip (MPN is far ahead)
      const isActuallyNoise =
        (matchesNoisePattern && !(isGeneric && hasIdentityPushed)) ||
        (isGeneric &&
          !isPanel &&
          !isIdentity &&
          !hasIdentityPushed &&
          (firstMpnIndex === -1 || firstMpnIndex > i + 1));

      const isTechNoise =
        isActuallyNoise &&
        !isCoreSeries &&
        !isIdentity &&
        !isPanel &&
        !(wNorm === "series" && i < 3);

      if (isTechNoise) {
        if (mpnFound) {
          stopped = true;
        } else {
          continue;
        }
      }

      if (stopped) continue;

      // Skip batch numbers if they aren't the primary model
      if (isBatch && i > 0) continue;
      // Skip tech dots
      if (isTechDot) continue;

      // Final guard against numeric noise (lone numbers < 200 or resolution parts like 3440, 1440)
      if ((/^\d{1,3}$/.test(wNorm) || /^\d{4}$/.test(wNorm)) && !isMpn)
        continue;

      // Final guard against pure tech noise leaks in modelWords
      // Identity and Panel words are always exempt from this guard
      if (
        !isIdentity &&
        !isPanel &&
        /^(hdr\d*|uhd|resolution|super|percent|hd|qhd|wqhd|uwqhd|fhd|uhd|4k|5k|8k|curved|gaming|ultrawide|usb-c|usbc|monitor|display|bildschirm|series|bit|qdoled|qd-oled|pip|pbp|pippbp|mprt|panel|sync|adaptive)(monitor|display)?$/i.test(
          wNorm,
        )
      ) {
        // Only skip if no identity started yet (e.g. skip "Gaming Monitor" in "Brand Gaming Monitor")
        if (!hasIdentityPushed) continue;
        // BUT if it's following an identity, we keep it UNLESS it's very generic technical junk like "MPRT" or "SYNC"
        if (
          /^(mprt|sync|pbp|pip|adaptive|resolution|percent|hdr\d*)$/i.test(
            wNorm,
          )
        )
          continue;
      }

      // If we push a word that is a strong identifier, update the flag
      if (isIdentity || isPanel) {
        hasIdentityPushed = true;
      }

      displayModelWords.push(w);
    }

    const uniqueWords: string[] = [];
    const seenWords = new Set<string>();
    for (const w of displayModelWords) {
      const wNorm = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!seenWords.has(wNorm)) {
        uniqueWords.push(w);
        seenWords.add(wNorm);
      }
    }

    const numericSize = facts.size ? facts.size.replace(/[^0-9]/g, "") : "";

    const cleanDisplayModel = uniqueWords
      .map((w: string) => {
        // Strip regional suffixes from model names for monitors (e.g. -WAEU, .AEU)
        // Guard: Don't strip "-bit" or "-QD"
        if (/-bit$/i.test(w) || /-qd$/i.test(w)) return w;

        // 1. Strip common regional alpha suffixes
        let cleaned = w.replace(regionalSuffixRegex, "");

        // 2. Strip redundant numeric size suffixes (e.g. -27, -34) ONLY if they match detected size
        if (numericSize && numericSize.length >= 2) {
          const sizeSuffixRegex = new RegExp(`[-.]${numericSize}$`, "i");
          cleaned = cleaned.replace(sizeSuffixRegex, "");
        }
        return cleaned;
      })
      .filter((w: string) => {
        const wNorm = w.toLowerCase().replace(/[^a-z0-9]/g, "");
        // Protect whitelist words first
        if (COMBINED_DISPLAY_SERIES.has(wNorm)) return true;

        // Final guard against pure tech noise leaks
        if (/^\d+(cm|inch|zoll|%|cd|w)$/.test(wNorm)) return false;
        if (/^\d+(hz|ms).*$/i.test(wNorm)) return false;
        if (/^\d{3,4}x\d{3,4}$/.test(wNorm)) return false;
        if (
          /^(hdr\d*|uhd|resolution|super|percent|hd|qhd|wqhd|uwqhd|fhd|uhd|4k|5k|8k|curved|gaming|ultrawide|usb-c|usbc|monitor|display|bildschirm|series|bit|qdoled|qd-oled|stromversorgung|farbraum|v\d+|hdmi|usb[\d.]*|der|die|das|the|arbeiten|sie|wie|es|moechten|brauchen|technik|tag|projekten|konferenzen|mehr|hoehenverstellbare|diagonale|ports|1080p|1440p|2160p|dual|quad|achsen|achse|v\d+[\d.]*|\d+x|\d+v\d+|\d+x\d+.*|\d+achsen|eyes)(monitor|display)?$/i.test(
            wNorm,
          )
        )
          return false;
        if (/^(400|600|1000|waeu|aeu|ae|office|business|home)$/.test(wNorm))
          return false;
        if (wNorm.length < 2 && !/^\d$/.test(wNorm)) return false;
        return true;
      })
      .join(" ")
      .trim();

    // SANITY CHECK: If it still looks like a full sentence/description, truncate it.
    let finalModel = cleanDisplayModel;

    // FALLBACK: If the model is empty (e.g. only noise tokens were in title)
    // and we have an MPN, use the MPN.
    if (!finalModel && modelMPN && modelMPN.length > 3) {
      finalModel = modelMPN
        .replace(/[()]/g, "")
        .replace(regionalSuffixRegex, "");
    }

    if (finalModel.length > 50 || finalModel.split(" ").length > 6) {
      if (modelMPN && modelMPN.length > 3) {
        finalModel = modelMPN;
      } else {
        finalModel = finalModel.split(" ").slice(0, 3).join(" ");
      }
    }

    const coreModelTitle = `${richBrand} ${finalModel}`.trim();
    displayTitle = coreModelTitle;

    // We still assemble the "full" title for internal reference or fallback
    const featureParts = [
      facts.size,
      facts.panel,
      facts.resolution,
      facts.curved ? "Curved" : null,
      facts.ultraWide ? "UltraWide" : null,
      facts.usbC ? "USB-C" : null,
      facts.gaming ? "Gaming" : null,
      facts.hdr ? "HDR" : null,
      facts.refreshRate,
    ].filter(Boolean);

    const fullModelTitle =
      featureParts.length > 0
        ? `${coreModelTitle} ${featureParts.join(" ")}`
        : coreModelTitle;

    // Recalculate variantSuffix for monitors to avoid jargon leaks (like 100hz) in slugs
    // Monitors are usually single-variant per MPN, so suffix is rarely needed
    const monitorVariantSuffix = "";

    return {
      brand: richBrand,
      model: cleanDisplayModel || finalModel || richBrand,
      fullModel: fullModelTitle,
      shortModel:
        modelMPN ||
        displayModelWords[0] ||
        cleanDisplayModel ||
        finalModel ||
        richBrand,
      variantLabel: monitorVariantSuffix,
      variantMap,
      variantTokens: [], // Monitors don't need high-variance trait tokens
      displayTitle: displayTitle,
      modelTitle: coreModelTitle,
      variantSuffix: monitorVariantSuffix,
      mpn: modelMPN || mpnVal || undefined,
      isHighVariance: false,
      traitCount: variantTokens.length,
      isLaptop: false,
      categoryUsed: category,
    };
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
