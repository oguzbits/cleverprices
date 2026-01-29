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
}

/**
 * Universally determines the identity of a product across all categories.
 * Uses a token-based subtraction approach to separate the core Model
 * from variation specs (color, storage) and brand.
 */
const TITLE_TEMPLATES: Record<string, string[]> = {
  "processors-cpus": ["Prozessor"],
  "graphics-cards": ["Grafikprozessor"],
  consoles: ["Plattform"],
};

export function getProductIdentity(product: Partial<Product>): ProductIdentity {
  const rawBrand = (product.brand || "").trim();
  const title = (product.title || "").trim();
  const category = (product.category || "").toLowerCase();

  // 0. TRUSTED SPECS OVERRIDE
  // If we have official specs, try to build the model name deterministically
  const specs = product.officialSpecifications
    ? typeof product.officialSpecifications === "string"
      ? JSON.parse(product.officialSpecifications)
      : product.officialSpecifications
    : product.specifications || {};

  let officialModel: string | null = null;

  if (specs) {
    if (category === "processors-cpus" && specs["Prozessor"]) {
      officialModel = specs["Prozessor"];
    } else if (category === "graphics-cards" && specs["Grafikprozessor"]) {
      officialModel = specs["Grafikprozessor"];
    } else if (category === "consoles" && specs["Plattform"]) {
      officialModel = specs["Plattform"];
    }

    // Fallback: If we have "Model" or "Modell" explicitly
    if (!officialModel && (specs["Model"] || specs["Modell"])) {
      officialModel = specs["Model"] || specs["Modell"];
    }
  }

  const brand = normalizeBrand(rawBrand, title, category);
  const brandLower = brand.toLowerCase();

  // 1. Build Subtraction Set (Attribute-Aware) & Variant Map
  const officialAttributes = parseVariationAttributes(
    product.variationAttributes || undefined,
  );
  const variantMap: Record<string, string> = { ...officialAttributes };

  // BACKFILL: If no database attributes, try to fill from Official Specs
  if (Object.keys(variantMap).length === 0 && specs) {
    const mapping: Record<string, string> = {
      Arbeitsspeicher: "RAM",
      Speicher: "RAM",
      Kapazität: "Storage",
      Speicherkapazität: "Storage",
      Festplattenkapazität: "Storage",
      Farbe: "Farbe", // Keep for now, checked in list
      Color: "Color",
      Grafikchipsatz: "Grafik",
      Bildschirmdiagonale: "Size",
      Größe: "Size",
    };

    Object.entries(specs).forEach(([k, v]) => {
      if (v) {
        // 1. Direct Mapping
        if (mapping[k]) {
          variantMap[mapping[k]] = String(v);
        }
        // 2. Keep specific useful keys as-is if not mapped
        else if (
          [
            "Farbe",
            "Color",
            "Style",
            "RAM",
            "Storage",
            "Size",
            "Kapazität",
          ].includes(k)
        ) {
          variantMap[k] = String(v);
        }
      }
    });
  }

  // PROACTIVE RECOVERY: If Storage/Capacity is missing, try to extract it from title
  if (!variantMap.Storage && !variantMap.Capacity && !variantMap.Kapazität) {
    const recovered = extractRealStorageFromTitle(title);
    if (recovered) {
      variantMap.Storage = recovered;
    }
  }

  // PROACTIVE RECOVERY: Screen Size (TVs, Monitors)
  if (!variantMap.Size && !variantMap.Diagonale) {
    const sizeMatch = title.match(/(\d+(?:[\.,]\d+)?)\s?(?:Zoll|Inch|")/i);
    if (sizeMatch) {
      variantMap.Size = `${sizeMatch[1].replace(",", ".")} Zoll`;
    }
  }

  // --- SHORT CIRCUIT: OFFICIAL MODEL ---
  if (officialModel) {
    // Clean model name (remove brand if present to avoid duplication)
    const cleanOfficial = officialModel.replace(
      new RegExp(`^${brand}\\s+`, "i"),
      "",
    );
    const fullModel = `${brand} ${cleanOfficial}`.trim();

    // Generate Variant Label
    const variantItems: string[] = [];
    [
      "Storage",
      "Size",
      "Color",
      "Farbe",
      "Style",
      "Speicher",
      "Kapazität",
      "Speicherkapazität",
    ].forEach((k) => {
      const val = variantMap[k];
      if (val && typeof val === "string") variantItems.push(val);
    });
    const variantLabel = variantItems.join(" ").trim();

    return {
      brand,
      model: cleanOfficial,
      fullModel,
      shortModel: fullModel,
      variantLabel,
      variantMap,
      displayTitle: variantLabel ? `${fullModel} (${variantLabel})` : fullModel,
      modelTitle: fullModel,
      variantSuffix: variantLabel,
    };
  }

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

  // PROACTIVE RECOVERY: Generational Markers (M1/M2/M3/M4, Years)
  const coreGenerationalTokens: string[] = []; // Part of the Model Identity (e.g. M4)
  const descriptiveTokens: string[] = []; // Only for Titles (e.g. 2025, 13")

  // 1. Apple M-Series Chips (CORE IDENTITY)
  const mChipMatch = title.match(/\b(m[1-9])(?:\s+(pro|max|ultra))?\b/i);
  if (mChipMatch) {
    const chip = mChipMatch[1].toUpperCase();
    const suffix = mChipMatch[2]
      ? ` ${mChipMatch[2].charAt(0).toUpperCase() + mChipMatch[2].slice(1).toLowerCase()}`
      : "";
    coreGenerationalTokens.push(`${chip}${suffix}`.trim());
  }

  // 2. Size (CORE IDENTITY for Fixed Trait Categories)
  const isFixedTraitCategory = [
    "notebooks",
    "tablets",
    "monitors",
    "tvs",
    "graphics-cards",
    "gpu",
    "processors-cpus",
  ].includes(category);

  if (isFixedTraitCategory && variantMap.Size) {
    coreGenerationalTokens.push(variantMap.Size);
  }

  // 3. Release Year (CORE IDENTITY for Fixed Trait Categories)
  const yearMatch = title.match(/\b(202\d)\b/);
  if (isFixedTraitCategory && yearMatch) {
    coreGenerationalTokens.push(yearMatch[1]);
  } else if (yearMatch) {
    descriptiveTokens.push(yearMatch[1]);
  } else if (
    isFixedTraitCategory &&
    title.includes("M4") &&
    title.includes("MacBook")
  ) {
    // HARD FALLBACK for 2025 MacBook Air M4 if year missing in title/specs
    coreGenerationalTokens.push("2025");
  }

  const specYear =
    specs["Model Year"] ||
    specs["Modelljahr"] ||
    specs["Release Year"] ||
    specs["Erscheinungsjahr"];
  if (specYear && String(specYear).match(/\b(202\d)\b/)) {
    const y = String(specYear).match(/\b(202\d)\b/)?.[1];
    if (y) {
      if (isFixedTraitCategory) coreGenerationalTokens.push(y);
      else descriptiveTokens.push(y);
    }
  }

  // 4. Memory/RAM only for technical core components (GPU/CPU) - CORE IDENTITY
  if (["gpu", "graphics-cards", "processors-cpus"].includes(category)) {
    if (variantMap.Storage) coreGenerationalTokens.push(variantMap.Storage);
    if (variantMap.RAM || variantMap.VRAM)
      coreGenerationalTokens.push(variantMap.RAM || variantMap.VRAM);
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

    // ESSENTIAL: For certain categories, Size (e.g. 13", 55") is part of the Model Identity, not just a variant.
    const isFixedTraitCategory = [
      "notebooks",
      "tablets",
      "monitors",
      "tvs",
    ].includes(category);

    if (
      isFixedTraitCategory &&
      (keyLower === "size" ||
        keyLower === "größe" ||
        keyLower === "bildschirmdiagonale")
    ) {
      return; // Don't subtract size tokens for these categories
    }

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
  // 1. Add Core Generational Traits to model identity (e.g. M4, 16GB VRAM)
  coreGenerationalTokens.forEach((token) => {
    const tokenLower = token.toLowerCase();
    const tokenClean = tokenLower.replace(/[^a-z0-9]+/g, "");
    if (!tokenClean) return;

    const alreadyExists = modelWords.some((word) => {
      const wordLower = word.toLowerCase();
      const wordClean = wordLower.replace(/[^a-z0-9]+/g, "");
      if (wordLower.includes(tokenLower) || tokenLower.includes(wordLower))
        return true;
      if (wordClean.includes(tokenClean) || tokenClean.includes(wordClean))
        return true;
      return false;
    });

    if (!alreadyExists) {
      modelWords.push(token);
    }
  });

  // Fallback
  if (modelWords.length === 0 && rawWords.length > 0) {
    modelWords.push(rawWords[0]);
  }

  // No-op - moved logic below to ensure trait ordering

  // 5. Construct Descriptive Final Titles (Idealo Pattern: Model + Size + Year + Chip)
  // We want a stable order for the Hub title regardless of title word order.
  const orderedWords: string[] = [];
  const modelHead = modelWords[0] || "";
  orderedWords.push(modelHead);

  // Collect traits (deduplicated)
  const traits = new Set<string>();
  [
    ...modelWords.slice(1),
    ...coreGenerationalTokens,
    ...descriptiveTokens,
  ].forEach((t) => {
    if (t.toLowerCase() !== modelHead.toLowerCase()) traits.add(t);
  });

  // Sort traits by type-priority for the model name
  const sortedTraits = Array.from(traits).sort((a, b) => {
    const getPriority = (s: string) => {
      const l = s.toLowerCase();
      // Priority 0: Essential Model Extensions
      if (["air", "pro", "max", "ultra", "plus", "mini", "studio"].includes(l))
        return 0;
      // Priority 1: Size
      if (
        l.includes("zoll") ||
        l.includes("inch") ||
        l.includes('"') ||
        /^\d{2}$/.test(l)
      )
        return 1;
      // Priority 2: Year/Generation
      if (/^202\d$/.test(l)) return 2;
      // Priority 3: Chip Generation
      if (/^m[1-9]/.test(l)) return 3;
      return 4;
    };
    return getPriority(a) - getPriority(b);
  });

  // Hub title: No parentheses for clean look
  const hubModelName = [modelHead, ...sortedTraits.map(fixTechCasing)]
    .join(" ")
    .trim();
  const fullModel = `${brand} ${hubModelName}`.trim();

  // Format traits for Display Title (no parentheses for year to match Idealo)
  const displayTraits = sortedTraits.map((t) => {
    return fixTechCasing(t);
  });
  const modelWithTraits = [modelHead, ...displayTraits].join(" ").trim();

  // 4. Variant Labeling (Idealo Style: [Traits] [Color] [MPN] [Brand])
  let colorKey = Object.keys(variantMap).find((k) =>
    ["farbe", "color"].includes(k.toLowerCase()),
  );
  let color = colorKey ? variantMap[colorKey] : null;

  // RECOVERY: If color is missing from attributes, pull from title suffix
  if (!color && title.includes(" - ")) {
    const parts = title.split(" - ");
    const potentialColor = parts[parts.length - 1].trim();
    if (
      potentialColor.length < 30 &&
      !potentialColor.toLowerCase().includes("zoll") &&
      !potentialColor.toLowerCase().includes("gb")
    ) {
      color = potentialColor;
      variantMap["Color"] = color;
    }
  }

  const mpn = (product.mpn || variantMap.MPN || "").trim().toUpperCase();

  const variantItems: string[] = [];
  ["Storage", "RAM", "Style"].forEach((k) => {
    const val = variantMap[k];
    if (val && typeof val === "string") {
      const valLower = val.toLowerCase();
      if (!modelWithTraits.toLowerCase().includes(valLower)) {
        variantItems.push(val);
      }
    }
  });
  const variantLabel = variantItems.join(" ").trim();

  // Construct Final Display Title (Idealo Style: Brand + Model + Traits + Color + MPN)
  const displayParts: string[] = [];
  if (brand) displayParts.push(brand);
  displayParts.push(modelWithTraits);
  if (color) displayParts.push(color);
  if (mpn && mpn.length > 3) displayParts.push(mpn);

  const displayTitle = displayParts.join(" ").trim();

  // Split parts for UI hierarchy
  const modelTitleParts = [];
  if (brand) modelTitleParts.push(brand);
  modelTitleParts.push(modelWithTraits);
  const modelTitle = modelTitleParts.join(" ").trim();

  const variantSuffixParts = [];
  if (color) variantSuffixParts.push(color);
  if (mpn && mpn.length > 3) variantSuffixParts.push(mpn);
  const variantSuffix = variantSuffixParts.join(" ").trim();

  return {
    brand,
    model: hubModelName,
    fullModel,
    shortModel: modelHead,
    variantLabel,
    variantMap,
    displayTitle,
    modelTitle,
    variantSuffix,
  };
}
