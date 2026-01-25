// import type { Product } from "@/lib/product-registry"; // Removed to avoid runtime alias issues in scripts
import { parseVariationAttributes } from "./variants";

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

export interface ProductIdentity {
  brand: string;
  model: string;
  fullModel: string;
  shortModel: string;
  variantLabel: string;
  variantMap: Record<string, string>;
  displayTitle: string;
}

/**
 * Universally determines the identity of a product across all categories.
 * Uses a token-based subtraction approach to separate the core Model
 * from variation specs (color, storage) and brand.
 */
export function getProductIdentity(product: Partial<Product>): ProductIdentity {
  const rawBrand = (product.brand || "").trim();
  const title = (product.title || "").trim();
  const category = (product.category || "").toLowerCase();

  const brand = normalizeBrand(rawBrand, title, category);
  const brandLower = brand.toLowerCase();

  // 0. Protected Tokens (Attribute-Driven)
  // We scan specifications for "Model", "Series", "MPN", etc. to explicitly protect those tokens.
  const protectedTokens = new Set<string>();
  const IDENTITY_KEYS = [
    "model",
    "modell",
    "series",
    "serie",
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
    "family",
    "familie",
  ];

  const specs = product.specifications || {};
  // Combine official variations and specs to find identity tokens
  const allAttrs: Record<string, any> = { ...specs };
  if (product.variationAttributes) {
    Object.assign(
      allAttrs,
      parseVariationAttributes(product.variationAttributes),
    );
  }

  // Populate Protected Tokens
  Object.entries(allAttrs).forEach(([k, v]) => {
    const keyLower = k.toLowerCase();
    const isIdentityKey = IDENTITY_KEYS.some((ik) => keyLower.includes(ik));

    if (isIdentityKey && typeof v === "string") {
      v.toLowerCase()
        .split(/[^a-z0-9]+/)
        .forEach((t) => {
          // Protect meaningful tokens (e.g. "4070", "rtx", "s24", "pro")
          // Avoid protecting extremely generic short words if they appear in specs (unless it's MPN)
          if (t.length > 1 || (t.match(/\d/) && t.length > 0)) {
            protectedTokens.add(t);
          }
        });
    }
  });

  // 1. Build Subtraction Set (Attribute-Aware)
  const officialAttributes = parseVariationAttributes(
    product.variationAttributes,
  );
  const variantMap: Record<string, string> = { ...officialAttributes };

  // PROACTIVE RECOVERY: If Storage/Capacity is missing, try to extract it from title
  if (!variantMap.Storage && !variantMap.Capacity && !variantMap.Kapazität) {
    const capacityMatch = title.match(/(\d+)\s?(GB|TB|MB|W|Watt)/i);
    if (capacityMatch) {
      variantMap.Storage = capacityMatch[0];
    }
  }

  // PROACTIVE RECOVERY: Screen Size (TVs, Monitors)
  if (!variantMap.Size && !variantMap.Diagonale) {
    const sizeMatch = title.match(/(\d+)\s?(Zoll|Inch|")/i);
    if (sizeMatch) {
      variantMap.Size = sizeMatch[0];
    }
  }

  // PROACTIVE RECOVERY: Generational Markers (M1/M2/M3/M4, Years)
  // These often appear in parentheses or after delimiters, so we extract them before splitting.
  const generationalTokens: string[] = [];

  // Apple M-Series Chips (Standardized Casing)
  const mChipMatch = title.match(/\b(m[1-9])(?:\s+(pro|max|ultra))?\b/i);
  if (mChipMatch) {
    // Force standard casing: "M4", "M4 Pro"
    const chip = mChipMatch[1].toUpperCase(); // "M4"
    const suffix = mChipMatch[2]
      ? ` ${mChipMatch[2].charAt(0).toUpperCase() + mChipMatch[2].slice(1).toLowerCase()}`
      : "";
    generationalTokens.push(`${chip}${suffix}`.replace(/\s+/g, "-"));
  }

  // Release Years (2020-2029)
  const yearMatch = title.match(/\b(202\d)\b/);
  if (yearMatch) {
    generationalTokens.push(yearMatch[1]);
  }

  // Release Date from Specs (Notebooks/Tablets only)
  if (
    variantMap["Release Date"] &&
    (category === "notebooks" || category === "tablets")
  ) {
    const releaseYearMatch = variantMap["Release Date"].match(/\b(202\d)\b/);
    if (releaseYearMatch) {
      if (!generationalTokens.includes(releaseYearMatch[1])) {
        generationalTokens.push(releaseYearMatch[1]);
      }
    }
  }

  // 2. Pre-process Title (Normalization & Aggressive Head Extraction)
  // Split by common marketing delimiters to get the core model head
  let cleanTitle = title
    .split(/ \- | \/ | \(| \||: | mit | inkl |,/i)[0]
    .trim();
  const rawWords = cleanTitle.split(/[\s,+\*~]+/).filter(Boolean);

  const subtractTokens = new Set<string>();

  // Add ALL attribute values as tokens to subtract
  Object.entries(variantMap).forEach(([k, v]) => {
    // Ignore explicit Model attributes - we want these in the model name!
    const keyLower = k.toLowerCase();
    if (
      keyLower === "model" ||
      keyLower === "modell" ||
      IDENTITY_KEYS.some((ik) => keyLower.includes(ik))
    )
      return;

    if (typeof v === "string") {
      v.toLowerCase()
        .split(/[^a-z0-9]+/)
        .forEach((t) => {
          if (t && (t.length > 2 || /^[a-z]+$/.test(t) || /^\d+$/.test(t))) {
            // Subtract small numbers too if they are part of a variant (e.g. "2" in "2 TB")
            subtractTokens.add(t);
          }
        });
    }
  });

  // Universal Technical & Marketing Noise
  const universalNoise = [
    "schwarz",
    "weiss",
    "blau",
    "rot",
    "gruen",
    "gelb",
    "grau",
    "silber",
    "gold",
    "rosa",
    "black",
    "white",
    "blue",
    "red",
    "green",
    "yellow",
    "gray",
    "grey",

    "silver",
    "pink",
    "titan",
    "titanium",
    "refurbished",
    "renewed",
    "generalueberholt",
    "interne?",
    "externe?",
    "gb",
    "tb",
    "mb",
    "wh",
    "watt",
    "zoll",
    "inch",
    "kerne",
    "cores",
    "nvme",
    "pcie",
    "ssd",
    "hdd",
    "kabellos",
    "wireless",
    "bluetooth",
    "kabel",
    "threads",
    "ghz",
    "mhz",
    "mega",
    "pixel",
    "mp",
    "processor",
    "prozessor",
    "monitor",
    "gaming",
    "bildschirm",
    "display",
    "psu",
    "netzteil",
    "modular",
    "fully",
    "plus",
    "gold",
    "platinum",
    "silver",
    "bronze",
    "80+",
    "80-plus",
    "wie",
    "neu",
    "und",
    "mit",
    "inkl",
    "ohne",
    "smartphone",
    "handy",
    "ai",
    "noise",
    "cancelling",
    "headphones",
    "kopfhoerer",
    "headset",
    "smart",
    "tv",
    "4k",
    "8k",
    "uhd",
    "oled",
    "qled",
    "body",
    "gehaeuse",
    "edition",
    "slim",
    "gaming",
    "model",
    "modell",
    "nvme",
    "pcie",
    "ssd",
    "sata",
    "m2",
    "m.2",
    "cheap",
    "offer",
    "sale",
    "top",
    "deal",
    "ovp",
  ];

  universalNoise.forEach((s) => subtractTokens.add(s));

  // 3. Identification Logic
  const modelWords: string[] = [];

  // Helper to standardise tech casing (e.g. oled -> OLED, rtx -> RTX)
  const fixTechCasing = (w: string) => {
    const lower = w.toLowerCase();
    if (
      /^(oled|qled|hdtv|uhd|fhd|wqhd|rtx|gtx|rx|xt|ti|super|oc|ai|5g|4g|lte|wifi|usb)$/.test(
        lower,
      )
    )
      return w.toUpperCase();
    if (/^m[1-9]$/.test(lower)) return w.toUpperCase(); // M1, M2...
    if (/^s[0-9]+$/.test(lower)) return w.toUpperCase(); // S24, S25...
    return w;
  };

  rawWords.forEach((word, index) => {
    const rawLower = word.toLowerCase();
    const normalized = rawLower
      .normalize("NFKC")
      .replace(/\u00E4/g, "ae")
      .replace(/\u00F6/g, "oe")
      .replace(/\u00FC/g, "ue")
      .replace(/\u00DF/g, "ss");
    const cleanLower = normalized.replace(/[^a-z0-9]/g, "");

    if (!cleanLower) return;

    // A. Always keep first word if it's not the brand
    if (index === 0) {
      if (cleanLower !== brandLower) modelWords.push(word);
      return;
    }

    // B. Protected Model Keywords
    // B. Check against Dynamically Protected Tokens (Attribute-Driven)
    if (protectedTokens.has(cleanLower)) {
      modelWords.push(word);
      return;
    }

    // C. Unit & Capacity Protection
    // Handles "128GB", "3.6GHz", "32MP", "165Hz"
    const hasUnits =
      /^\d+(\.\d+)?(gb|tb|mb|wh|w|zoll|inch|ghz|mhz|mp|cores?|kerne|kabel|threads?|hz)$/i.test(
        cleanLower,
      ) || /^\d+(\.\d+)?(hz|ghz|mhz)/i.test(rawLower);
    if (hasUnits) return;

    // D. Model Numbers
    const isPureNumber = /^\d+$/.test(cleanLower);
    if (isPureNumber) {
      // Priority: If this number is explicitly a variant token, strip it
      if (subtractTokens.has(cleanLower)) return;

      const num = parseInt(cleanLower);

      const isCommonCapacity = [64, 128, 256, 512, 1024, 2048, 4096].includes(
        num,
      );
      // Relaxed Tech Series: Allow GPU numbers like 4070, 3060 (divisible by 10)
      const isTechSeries = num >= 1000 && num % 10 === 0;

      // PROTECT: Small numbers (1-99) or high-series (3000-9000)
      // STRIP: PSUs often have "80" (from 80+). We strip this manually.
      if (num === 80) return;

      if (num < 100 || (num >= 900 && !isCommonCapacity) || isTechSeries) {
        modelWords.push(word);
      }

      return;
    }

    // E. Subtraction Logic (with normalization for special chars like 80+)
    // E. Subtraction Logic (with normalization for special chars like 80+)
    const normalizedToken = cleanLower
      .replace(/80plus/g, "plus")
      .replace(/80/g, "plus");
    if (subtractTokens.has(cleanLower) || subtractTokens.has(normalizedToken))
      return;

    if (rawLower.includes("80+") || rawLower.includes("80-plus")) return;

    modelWords.push(word);
  });

  // Append Rescued Generational Tokens (M3, 2025) if not already present
  generationalTokens.forEach((token) => {
    const parts = token.split("-");
    // Check if parts are already in modelWords
    const alreadyExists = parts.every((p) =>
      modelWords.some((w) => w.toLowerCase() === p),
    );
    if (!alreadyExists) {
      modelWords.push(token);
    }
  });

  // Fallback
  if (modelWords.length === 0 && rawWords.length > 0) {
    modelWords.push(rawWords[0]);
  }

  const modelName = modelWords.map(fixTechCasing).join(" ").trim();
  const fullModel =
    brand && !modelName.toLowerCase().startsWith(brand.toLowerCase())
      ? `${brand} ${modelName}`.trim()
      : modelName;

  // 4. Variant Labeling (Aggregated from attributes)
  const variantItems: string[] = [];
  ["Storage", "Size", "Color", "Farbe", "Style"].forEach((k) => {
    const val = variantMap[k];
    if (val && typeof val === "string") variantItems.push(val);
  });
  const variantLabel = variantItems.join(" ").trim();

  return {
    brand,
    model: modelName,
    fullModel,
    shortModel: fullModel,
    variantLabel,
    variantMap,
    displayTitle: variantLabel ? `${fullModel} (${variantLabel})` : fullModel,
  };
}
