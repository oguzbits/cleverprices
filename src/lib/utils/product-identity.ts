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

export interface ProductIdentity {
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
    .normalize("NFKC");
}

/**
 * Standardizes tokenization for consistent identity matching.
 */
export function getCleanTokens(s: string): string[] {
  return normalizeAccents(s.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 || /^\d+$/.test(t));
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
    tokens.filter((t) => /^\d+$/.test(t));
  const versionsTitle = getVersions(titleTokens);
  const versionsCand = getVersions(candTokens);

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
export function isIdentityToken(
  token: string,
  consensus: SiblingConsensus,
): boolean {
  if (consensus.total <= 1) return true; // Can't tell without siblings
  const freq =
    (consensus.tokenCounts[token.toLowerCase()] || 0) / consensus.total;
  return freq >= 0.7; // Appears in 70% of siblings
}

export function getProductIdentity(
  product: Partial<Product>,
  siblings: Partial<Product>[] = [],
  consensus?: SiblingConsensus,
): ProductIdentity {
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
  };
  const category = categoryMap[rawCategory] || rawCategory;
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

  // QA SYSTEM: Verify if the 'Modell' spec is a safe improvement over the title
  const source = product.specificationsSource || "";
  const trustedSources = ["icecat", "intel", "ebay", "google"];
  const isDirectSource = trustedSources.some((s) => source.includes(s));

  if (isDirectSource) {
    const candidate = String(specs["Modell"] || specs["Model"] || "").trim();
    if (verifySpecModel(candidate, title, resolvedBrand)) {
      officialModel = candidate;
    }
  }

  // 2b. SIBLING MODEL STEERING: If this product isn't enriched, borrow the official model
  // from an enriched sibling to ensure family-wide canonical slug consistency.
  if (!officialModel && siblings.length > 0) {
    for (const s of siblings) {
      const sSource = (s.specificationsSource || "").toLowerCase();
      const isSourced = trustedSources.some((src) => sSource.includes(src));
      if (!isSourced) continue;

      try {
        const sSpecs = s.officialSpecifications
          ? typeof s.officialSpecifications === "string"
            ? JSON.parse(s.officialSpecifications)
            : s.officialSpecifications
          : s.specifications || {};

        const candidate = String(
          sSpecs["Modell"] || sSpecs["Model"] || "",
        ).trim();
        if (verifySpecModel(candidate, title, resolvedBrand)) {
          officialModel = candidate;
          break; // Found a valid steering model
        }
      } catch (e) {
        continue;
      }
    }
  }

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
    "dp",
    "panel",
    "ips",
    "oled",
    "qled",
    "led",
    "lcd",
    "va",
    "tn",
    "hdr",
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
    "smart",
    "soundbar",
    "lautsprecher",
    "speaker",
    "woofer",
    "subwoofer",
    "heimkino",
    "theater",
    "cinema",
    "receiver",
    "amplifier",
    "verstaerker",
    "gerät",
    "geraet",
    "geraete",
    "device",
    "anlage",
    "system",
    "komplettsystem",
    "80",
    "fuer", // Normalized form of 'für'
    "fur",
    "for",
    "in",
    "teilbar",
    "teilbare",
    "einstellbar",
    "einstellbare",
    "gesteuert",
    "gesteuerte",
    "app",
    "appgesteuerten",
    "gesteuerten",
    "voicemx", // Specific feature for this brand, treating as noise for now or move to generic approach later
    "bass",
    "eq",
    "modi",
    "eqmodi",
    "arc",
    "opt",
    "aux",
    "usb",
    "hdmi",
    "optisch",
    "optical",
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
    const isCoreIdentityKey =
      /model|name|series|serie|family|familie|bezeichnung|style/.test(lowerKey);

    if (isCoreIdentityKey && IDENTITY_CONFIG.IDENTITY_KEYS.includes(lowerKey))
      return;

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

  /**
   * C. SMART SIBLING CONSENSUS (DYNAMIC HUB RESOLUTION)
   * Instead of hard-coding "Fortnite" or "Spielekonsole", we look at all variations.
   * If a word appears in the current product but is MISSING in most siblings,
   * it's definitely a variation/noise and should be stripped from the model.
   */
  if (consensus || siblings.length > 1) {
    const { tokenCounts, total } =
      consensus || calculateSiblingConsensus(siblings);

    // Strategy: Any token in the CURRENT product that appears in less than 70%
    // of the family members is considered a variation-specific detail.
    const currentTokens = title.toLowerCase().split(/[^a-z0-9]+/);
    currentTokens.forEach((t) => {
      if (t.length > 1) {
        const freq = (tokenCounts[t] || 0) / total;
        if (freq < 0.7 && !isFixedTraitCategory) {
          subtractTokens.add(t);
        }
      }
    });
  }

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

  const baseTitle = officialModel || title;
  // NOTE: Removed comma split. Reverted slash split to require spaces.
  let cleanTitle = baseTitle.split(/ \- | \/ | \(| \||: /i)[0].trim();

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
  cleanTitle = cleanTitle.replace(/^[^a-z0-9]+/i, "");

  // Split on slash and parens/brackets/comma to handle jammed specs
  const rawWords = cleanTitle.split(/[\s,+\*~\/()\[\]]+/).filter(Boolean);
  const modelWords: string[] = [];
  const strippedUnits: string[] = [];

  rawWords.forEach((word, index) => {
    const cleanWord = word.replace(/^[(\[",\.]+|[)\]",\.]+$/g, "");
    const normalized = normalizeAccents(cleanWord);
    const rawLower = normalized.toLowerCase();
    const cleanLower = rawLower.replace(/[^a-z0-9]/g, "");
    if (!cleanLower || cleanLower === resolvedBrandLower) return;

    // Protection for Official Models: If we have an official model name,
    // we bypass the aggressive noise word stripping to respect the source's intent.
    const isOfficialModelTrustPath = !!officialModel;

    // 2. Unit Recognition (e.g. 128GB, 128 GB, 165Hz, 34", 1ms)
    const isExplicitUnit =
      /^\d+(\.\d+)?(gb|tb|mb|wh|w|ghz|mhz|mp|hz|ms|zoll|inch|")$/i.test(
        cleanLower,
      ) ||
      /^\d+hz/i.test(cleanLower) ||
      (word.includes('"') && /^\d+/.test(cleanLower));

    // 2b. Audio Channel Pattern (e.g. 2.1, 5.1, 7.1.4) - treat as spec
    const isAudioChannels = /^\d+\.\d+(\.\d+)?$/.test(cleanWord);

    if (isAudioChannels) {
      strippedUnits.push(cleanWord);
      return;
    }

    // 2c. "N-in-1" Pattern (e.g. 2-in-1, 5-in-1) - treat as spec
    if (
      /^\d+(-| )?in(-| )?\d+$/i.test(cleanWord) ||
      /^\d+(-| )?to(-| )?\d+$/i.test(cleanWord) // 1-to-3
    ) {
      strippedUnits.push(cleanWord);
      return;
    }

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
      /^(rtx|gtx|rx|ti|super|m\d|s\d+|pro|air|max|ultra|pixel|iphone|ipad|galaxy|macbook|artisan|aero|legion|tuf|rog|omen|mfp)$/i.test(
        cleanLower,
      );
    let isActuallyProtected =
      isModelCode ||
      (isProtectedTech &&
        (!/^m\d$/.test(cleanLower) || resolvedBrandLower === "apple"));

    // Always protect the first word if not in subtractTokens
    if (index === 0 && !subtractTokens.has(cleanLower))
      isActuallyProtected = true;

    // Specific strip: 'x' as separator in resolution (3440 x 1440)
    // If we detect resolution pattern, we must pop the PREVIOUS number (which was added as a model)
    // and skip the NEXT number.
    if (cleanLower === "x" && index > 0 && index < rawWords.length - 1) {
      const prevC = rawWords[index - 1].replace(/[^a-z0-9]/g, "");
      const nextC = rawWords[index + 1].replace(/[^a-z0-9]/g, "");
      if (/^\d+$/.test(prevC) && /^\d+$/.test(nextC)) {
        // Found N x N pattern.
        // 1. Remove previous number from modelWords if it matches prevC
        // Note: modelWords might have formatted version.
        if (modelWords.length > 0) {
          const lastModel = modelWords[modelWords.length - 1].replace(
            /[^a-z0-9]/g,
            "",
          );
          if (lastModel === prevC) {
            modelWords.pop(); // Remove "3440"
          }
        }
        // 2. Mark this 'x' as handled (return)
        // 3. We need to skip the NEXT word ("1440").
        // Since we can't skip loop index easily, we can add "1440" to subtractTokens?
        // Or just rely on a set of "skip indices"?
        // Hacky: mutate rawWords? No.
        // Better: use a `skipNext` flag?
        // But I can't look back to finding `skipNext`.
        // I'll add the next token to a temporary "ignore list"?
        // Or easier: checking `prevWord` logic at start of loop?
        // "If prev token was 'x' and prev-prev was number and I am number... skip".
        return;
      }
    }

    // Check if I am the "1440" part of "3440 x 1440"
    if (/^\d+$/.test(cleanLower) && index > 1) {
      const prev1 = rawWords[index - 1].replace(/[^a-z0-9]/g, ""); // x
      const prev2 = rawWords[index - 2].replace(/[^a-z0-9]/g, ""); // 3440
      if (prev1 === "x" && /^\d+$/.test(prev2)) return;
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

    if (
      /^\d+$/.test(cleanLower) &&
      !isActuallyProtected &&
      !isOfficialModelTrustPath
    ) {
      if (index < rawWords.length - 1) {
        const nextWordRaw = rawWords[index + 1];
        const nextClean = nextWordRaw.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (subtractTokens.has(nextClean) || NOISE_WORDS.includes(nextClean)) {
          return;
        }
      }
    }

    // Special handling for connectors like "mit", "with", "und", "and"
    // Only keep them if the NEXT word is a valid feature/model word.
    // If the next word is a number (e.g. "mit 3") or a noise word, we strip the connector.
    if (/^(mit|with|und|and|plus)$/.test(cleanLower)) {
      // Look ahead
      if (index < rawWords.length - 1) {
        const nextWordRaw = rawWords[index + 1];
        const nextClean = nextWordRaw.toLowerCase().replace(/[^a-z0-9]/g, "");

        // 1. If next is number -> strip connector
        if (/^\d+$/.test(nextClean)) {
          subtractTokens.add(cleanLower);
          return;
        }

        // 2. If next is noise word -> strip connector
        // We need to check against NOISE_WORDS/subtractTokens
        // But subtractTokens is built dynamically. We can check the static lists + subtractTokens.
        if (subtractTokens.has(nextClean) || NOISE_WORDS.includes(nextClean)) {
          subtractTokens.add(cleanLower);
          return;
        }
      } else {
        // Connector at end of title -> strip
        subtractTokens.add(cleanLower);
        return;
      }
    }

    // Strip if in noise list AND not protected (and not in official trust path)
    if (
      subtractTokens.has(cleanLower) &&
      !isActuallyProtected &&
      !isOfficialModelTrustPath
    )
      return;

    // Final clean swap
    const formatted = fixTechCasing(cleanWord.replace(/[,\-:\/]+$/, ""));
    if (formatted) modelWords.push(formatted);
  });

  const modelHead = modelWords[0] || "";
  const hubModelName = modelWords.join(" ").trim();
  const modelTitle = `${resolvedBrand} ${hubModelName}`;

  // 5. Variant Differentiators (Slug & Subtitle)
  const variantTokens: string[] = [];
  const processedTokens = new Set<string>();
  let oneFeatureToken: string | null = null; // Track color or primary trait for high-variance products
  let bestFeatureKey: string | null = null;

  // Order of preference for "Best Feature": Color  // Add traits from variantMap in priority order
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

    const valLower = displayVal.toLowerCase();
    const valNorm = valLower.replace(/[^a-z0-9]/g, "");
    const modelNorm = hubModelName.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (valNorm && modelNorm.includes(valNorm)) return;

    // Smart technical labeling: Skip for Consoles, Smartphones, and redundant categories
    const isConsole = category === "consoles";
    const isSSD = category === "ssds";
    const isRAM = category === "ram";
    const isCapacityKey = /storage|capacity|speicher/i.test(k);
    const isRAMKey = /ram|arbeitsspeicher/i.test(k);

    if (
      !isSmartphone &&
      !isConsole &&
      !isTablet &&
      !isSSD &&
      !isRAM &&
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
  strippedUnits.forEach((unit) => {
    const norm = unit.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (processedTokens.has(norm)) return;
    if (!hubModelName.toLowerCase().includes(norm)) {
      variantTokens.push(unit);
      processedTokens.add(norm);
      if (!oneFeatureToken) oneFeatureToken = unit;
    }
  });

  // Calculate traits for high-variance check (Features only, no MPN yet)
  const traitCount = variantTokens.length;
  // Threshold: Listing up to 3 features is clean. 4+ features triggers MPN fallback.
  const isHighVariance = isLaptop || traitCount > 3;

  // LOGIC SWITCH: If high variance, use "One Feature + MPN" instead of listing everything.
  // This prevents overly long titles while keeping them distinct.
  let variantSuffix = "";
  if (isHighVariance && mpnVal && mpnVal.length > 3) {
    // Sanitize oneFeatureToken: Don't use it if it's a technical spec we want to hide
    if (oneFeatureToken) {
      const lower = (oneFeatureToken as string).toLowerCase();
      if (
        /\d+\s?(hz|mhz|ghz)/i.test(lower) ||
        /\d+\s?w$/i.test(lower) ||
        /^\d+\.\d+(ch)?$/.test(lower) ||
        /\d+(-| )?in(-| )?\d+/i.test(lower) ||
        /\d+\s?(mm|cm|inch|zoll|")/i.test(lower)
      ) {
        oneFeatureToken = null;
      }
    }

    variantSuffix = (
      oneFeatureToken ? `${oneFeatureToken} ${mpnVal}` : mpnVal
    ).trim();
  } else {
    // For low variance, list all tokens found (Color, Storage, etc.).
    // IDEALO Pattern: If we have "Cellular", we don't need "Wi-Fi" (it's redundant/implied).
    const hasCellular = variantTokens.some((t) =>
      /cellular|5g|lte/i.test(t.toLowerCase()),
    );
    let filteredTokens = hasCellular
      ? variantTokens.filter((t) => !/wi-?fi/i.test(t.toLowerCase()))
      : variantTokens;

    // PREMIUM TITLE LOGIC: Filter out "Technical Specs" from the main display title
    // We want to keep: Storage (TB/GB), RAM, Color, "Cellular"
    // We want to drop: Hz, W, Channels (2.0, 5.1), "2-in-1", Dimensions (mm/cm/inch)
    // Exception: If the product is a Monitor, "Hz" might be relevant, but user requested generic "premium" logic.
    // Usually "Brand Model" is best.
    filteredTokens = filteredTokens.filter((t) => {
      const lower = t.toLowerCase();
      // Keep Storage/RAM (GB/TB) - but filter out common noise like "128bit" if strictly storage
      if (/\d+\s?(gb|tb)/i.test(lower)) return true;

      // Keep Color (approximate check not easy here without lists, but distinct tokens usually OK)
      // If it's a known color from variantMap, it's already safe.
      // If it was in strippedUnits, it might be a spec.

      // Drop patterns
      if (/\d+\s?(hz|mhz|ghz)/i.test(lower)) return false; // Refresh rate
      if (/\d+\s?w$/i.test(lower)) return false; // Wattage
      if (/^\d+\.\d+(ch)?$/.test(lower)) return false; // Channels (2.1, 5.1, 5.1ch)
      if (/\d+(-| )?in(-| )?\d+/i.test(lower)) return false; // N-in-1
      if (/\d+\s?(mm|cm|inch|zoll|")/i.test(lower)) return false; // Size

      return true;
    });

    variantSuffix = filteredTokens.join(" ").trim();
  }

  const variantLabel = Array.from(new Set(variantTokens)).join(" ").trim();
  const displayTitle = variantSuffix
    ? `${modelTitle} ${variantSuffix}`
    : modelTitle;

  return {
    brand: resolvedBrand,
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
