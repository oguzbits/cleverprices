// import type { Product } from "@/lib/product-registry"; // Removed to avoid runtime alias issues in scripts
import {
  extractRealStorageFromTitle,
  parseCapacityToGB,
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
  mpn?: string;
  isHighVariance: boolean;
  traitCount: number;
  isLaptop: boolean;
  categoryUsed: string;
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
  ],

  // Keys in specifications that indicate a model-identifying attribute
  IDENTITY_KEYS: [
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
  ],
};

export function getProductIdentity(product: Partial<Product>): ProductIdentity {
  const rawBrand = (product.brand || "").trim();
  const title = (product.title || "").trim();
  const category = (product.category || "").toLowerCase();
  const isFixedTraitCategory =
    IDENTITY_CONFIG.FIXED_TRAIT_CATEGORIES.includes(category);

  // 0. TRUSTED TITLE & SPECS OVERRIDE
  // High-quality data sources (Icecat, Google) often provide a "Clean" title.
  // If available, we trust this more than the raw retailer title.
  let officialModel: string | null = product.officialTitle || null;

  // Validate official title is a plausible model name (not a long sentence/description)
  if (
    officialModel &&
    (officialModel.length > 80 ||
      officialModel.includes("...") ||
      officialModel.toLowerCase().includes("unknown icecat product") ||
      officialModel.toLowerCase() === "unknown product")
  ) {
    officialModel = null;
  }

  const specs = product.officialSpecifications
    ? typeof product.officialSpecifications === "string"
      ? JSON.parse(product.officialSpecifications)
      : product.officialSpecifications
    : product.specifications || {};

  if (specs) {
    if (category === "processors-cpus" && specs["Prozessor"]) {
      officialModel = specs["Prozessor"];
    } else if (category === "graphics-cards" && specs["Grafikprozessor"]) {
      officialModel = specs["Grafikprozessor"];
    } else if (category === "consoles" && specs["Plattform"]) {
      officialModel = specs["Plattform"];
    }

    // Fallback: If we have "Model" or "Modell" explicitly
    // CRITICAL: We avoid "Technical Model Codes" (e.g. A3523) if they are just identifiers.
    const rawModel = specs["Model"] || specs["Modell"];
    if (!officialModel && rawModel) {
      const isTechnicalModelCode = /^[a-z]\d{4}$/i.test(
        String(rawModel).trim(),
      );
      if (!isTechnicalModelCode) {
        officialModel = rawModel;
      }
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

  // PROACTIVE RECOVERY: RAM (e.g. 16GB, 16 GB RAM)
  if (!variantMap.RAM && !variantMap.Arbeitsspeicher) {
    const ramMatch =
      title.match(/(\d+)\s?(?:GB|MB)\s?(?:RAM|Arbeitsspeicher)/i) ||
      title.match(/\b(\d+)\s?GB\b(?!.*(?:SSD|HDD|Zoll|Inch|"))/i);
    if (ramMatch) {
      const val = parseInt(ramMatch[1]);
      // Heuristic: RAM is usually 2, 4, 8, 16, 32, 64...
      if (
        [2, 4, 6, 8, 10, 12, 16, 18, 24, 32, 36, 48, 64, 96, 128].includes(val)
      ) {
        variantMap.RAM = `${val}GB`;
      }
    }
  }

  // PROACTIVE RECOVERY: Screen Size (TVs, Monitors)
  if (!variantMap.Size && !variantMap.Diagonale) {
    const sizeMatch = title.match(/(\d+(?:[\.,]\d+)?)\s?(?:Zoll|Inch|")/i);
    if (sizeMatch) {
      variantMap.Size = `${sizeMatch[1].replace(",", ".")}"`;
    }
  }

  // Proactively normalize Size to use " instead of Zoll/Inch (for cleaner slugs: 13-zoll -> 13)
  if (variantMap.Size) {
    variantMap.Size =
      variantMap.Size.replace(/\s*(?:Zoll|Inch|")/i, "").trim() + '"';
  }

  const isLaptop =
    category.includes("laptop") ||
    category.includes("notebook") ||
    category.includes("mc") ||
    title.toLowerCase().includes("macbook");

  // --- SHORT CIRCUIT: OFFICIAL MODEL ---
  if (officialModel) {
    let cleanOfficial = officialModel.replace(
      new RegExp(`^${brand}\\s+`, "i"),
      "",
    );

    // ESSENTIAL: For laptops/TVs, Size is part of the Model Identity.
    // If the official title is missing it, but we have it in the variantMap, append it.
    if (
      isFixedTraitCategory &&
      variantMap.Size &&
      !cleanOfficial.includes(variantMap.Size)
    ) {
      cleanOfficial = `${cleanOfficial} ${variantMap.Size}`.trim();
    }

    const fullModel = `${brand} ${cleanOfficial}`.trim();

    // Generate Variant Label (Subtitle items)
    const variantItems: string[] = [];
    const isSmartphone =
      category.includes("smartphone") || category.includes("handy");

    const hasStorage = variantMap.Storage || variantMap.Speicher;
    const hasRam = variantMap.RAM || variantMap.Arbeitsspeicher;
    const isComplexTech = isLaptop || (hasStorage && hasRam);

    [
      "Storage",
      "Speicher",
      "Kapazität",
      "Speicherkapazität",
      "RAM",
      "Arbeitsspeicher",
      "Size",
      "Bildschirmdiagonale",
      "Größe",
      "Color",
      "Farbe",
      "Style",
    ].forEach((k) => {
      const val = variantMap[k];
      if (val && typeof val === "string") {
        let displayVal = val;
        const valLower = val.toLowerCase();

        // Deduplicate: If the official title already implies this trait, skip it
        if (cleanOfficial.toLowerCase().includes(valLower)) return;

        // EXCLUSION: For Smartphones or FixedTrait categories, Size is handled in the model
        const isSizeKey =
          ["size", "bildschirmdiagonale", "größe"].includes(k.toLowerCase()) ||
          val.includes('"') ||
          val.toLowerCase().includes("zoll");
        if ((isSmartphone || isFixedTraitCategory) && isSizeKey) return;

        // COMPLEX TECH: Hide traits from suffix if strong identifiers present
        if (
          isComplexTech &&
          (k.toLowerCase().includes("storage") ||
            k.toLowerCase().includes("speicher") ||
            k === "RAM" ||
            k === "Arbeitsspeicher")
        ) {
          const hasColor = variantMap.Color || variantMap.Farbe;
          const mpnMatch = (product.mpn || variantMap.MPN || "").trim();
          if (hasColor && mpnMatch.length > 3) return;
        }

        // SMART LABELING
        if (valLower.includes("gb") || valLower.includes("tb")) {
          const hasSSD =
            valLower.includes("ssd") ||
            valLower.includes("hdd") ||
            title.toLowerCase().includes("ssd");
          const hasRAM =
            valLower.includes("ram") ||
            valLower.includes("arbeitsspeicher") ||
            k.toLowerCase().includes("ram") ||
            k.toLowerCase().includes("arbeitsspeicher");

          if (!hasSSD && !hasRAM) {
            if (
              k.toLowerCase().includes("storage") ||
              k.toLowerCase().includes("speicher")
            ) {
              displayVal = `${val} SSD`;
            } else if (k === "RAM" || k === "Arbeitsspeicher") {
              displayVal = `${val} RAM`;
            }
          }
        }

        if (!variantItems.includes(displayVal)) variantItems.push(displayVal);
      }
    });

    const variantLabel = variantItems.join(" ").trim();

    // Variant Suffix: Just the differentiators
    const variantSuffixParts = [variantLabel];
    // Robust MPN Recovery
    let mpnValue = (product.mpn || variantMap.MPN || "").trim().toUpperCase();
    if (!mpnValue) {
      const techCode = Object.entries(variantMap).find(
        ([k, v]) =>
          /^[a-z]{1,2}\d+[a-z\d\/]+$/i.test(String(v)) && String(v).length >= 4,
      )?.[1];
      if (techCode) {
        mpnValue = String(techCode).trim().toUpperCase();
      } else {
        // Fallback to title scan candidate
        const candidate = title
          .split(" ")
          .find(
            (w) =>
              /^[a-z]{1,2}\d+[a-z\d\/]{2,}$/i.test(w) ||
              (w.length >= 7 && /\d/.test(w) && /[A-Z]/.test(w)),
          );
        if (candidate) mpnValue = candidate.toUpperCase();
      }
    }

    // COMPLEXITY CHECK (Matches the non-official path)
    const traitCount = variantItems.filter((i) => i.trim().length > 0).length;
    // Hardened High Variance: Always true for laptops or multi-trait hardware
    const isHighVariance = isLaptop || traitCount > 2;

    if (
      (isHighVariance || isLaptop) &&
      mpnValue &&
      mpnValue.length > 3 &&
      !cleanOfficial.toUpperCase().includes(mpnValue) &&
      !variantLabel.toUpperCase().includes(mpnValue)
    ) {
      variantSuffixParts.push(mpnValue);
    }
    const variantSuffix = variantSuffixParts.join(" ").trim();

    return {
      brand: brand,
      model: cleanOfficial,
      fullModel: `${brand} ${cleanOfficial}`,
      shortModel: cleanOfficial.split(" ")[0] || "",
      variantLabel,
      variantMap,
      displayTitle: variantSuffix
        ? `${brand} ${cleanOfficial} ${variantSuffix}`
        : `${brand} ${cleanOfficial}`,
      modelTitle: `${brand} ${cleanOfficial}`,
      variantSuffix,
      mpn: mpnValue,
      isHighVariance,
      traitCount,
      isLaptop,
      categoryUsed: category,
    };
  }

  // 1. Build Model Parts
  // We collect meaningful tokens that form the Model Identity.
  const modelParts: string[] = [];
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
      IDENTITY_CONFIG.IDENTITY_KEYS.some((ik) => keyLower.includes(ik))
    )
      return;

    // Subtraction for variation specs
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

  // --- NOISE REDUCTION STRATEGY ---
  // Instead of one monolithic list, we categorize noise to allow for more granular control.

  // 1. Core Technical Units (Almost always noise in model names)
  const CORE_TECHNICAL_NOISE = [
    "gb",
    "tb",
    "mb",
    "wh",
    "watt",
    "zoll",
    "inch",
    "ghz",
    "mhz",
    "mega",
    "pixel",
    "mp",
    "dual-sim",
    "lte",
    "5g",
    "4g",
    "wifi",
    "bluetooth",
    "usb",
    "ram",
    "vram",
  ];

  // 2. Marketing & Sales Fluff (Always noise)
  const MARKETING_NOISE = [
    "refurbished",
    "renewed",
    "generalueberholt",
    "wie",
    "neu",
    "top",
    "deal",
    "angebot",
    "sale",
    "cheap",
    "offer",
    "ovp",
    "original",
    "verpackt",
    "edition",
    "slim",
    "gaming",
    "modular",
    "fully",
    "plus",
  ];

  // 3. Descriptive/Category Noise (Context-Dependent)
  // These are often noise *if* they match the category name itself.
  const DESCRIPTIVE_NOISE = [
    "smartphone",
    "handy",
    "monitor",
    "bildschirm",
    "display",
    "tv",
    "fernseher",
    "laptop",
    "notebook",
    "pc",
    "computer",
    "processor",
    "prozessor",
    "grafikkarte",
    "graphics",
    "headset",
    "kopfhoerer",
    "headphones",
    "ssd",
    "hdd",
    "gehaeuse",
    "body",
  ];

  // 4. Conjunctions & Helper Words
  const HELPER_NOISE = ["und", "mit", "inkl", "ohne", "fuer", "for", "with"];

  // 5. Colors (Almost always noise in model names)
  const COLOR_NOISE = [
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
    "starlight",
    "midnight",
    "cosmic",
    "orange",
    "peony",
    "iris",
    "porcelain",
    "tiefblau",
    "space",
    "graphit",
    "graphite",
    "ocean",
    "mint",
    "lavender",
    "purple",
    "mitternacht",
    "polarstern",
    "spacegrau",
    "polarsilber",
    "abendrot",
    "himmelblau",
    "rosé",
  ];

  // 6. Build Subtraction Set
  CORE_TECHNICAL_NOISE.forEach((s) => {
    // PROTECT "Pixel" for Google devices as it is the core model name
    if (s === "pixel" && brand.toLowerCase().includes("google")) return;
    subtractTokens.add(s);
  });

  MARKETING_NOISE.forEach((s) => subtractTokens.add(s));
  HELPER_NOISE.forEach((s) => subtractTokens.add(s));
  COLOR_NOISE.forEach((s) => subtractTokens.add(s));

  // Only strip descriptive noise if it's not part of the brand or a very short model
  DESCRIPTIVE_NOISE.forEach((s) => {
    subtractTokens.add(s);
  });

  // Structural Cleaning: Remove technical suffixes (e.g. MG8H4ZD/A, MW123D/A) from tokens
  // We do this by adding tokens that look like part numbers but aren't core model names to subtraction.
  title.split(/[^a-z0-9/]+/).forEach((t) => {
    const lower = t.toLowerCase();
    const cleaned = lower.replace(/[^a-z0-9]/g, "");
    // Match common MPNs: MW123D/A, MG8H4, A1234, etc.
    if (
      (/^[a-z]{1,2}\d+[a-z\d/]+$/i.test(t) || /^[a-z]\d{4}$/i.test(t)) &&
      t.length >= 4
    ) {
      subtractTokens.add(lower);
      subtractTokens.add(cleaned);
    }
  });

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
    if (lower === "macbook") return "MacBook";
    return w;
  };

  // Proactively find an MPN candidate in the title to subtract from the core model name
  const mpnCandidate = rawWords.find(
    (w) =>
      /^[a-z]{1,2}\d+[a-z\d\/]{2,}$/i.test(w) ||
      (w.length >= 7 && /\d/.test(w) && /[A-Z]/.test(w)),
  );
  if (mpnCandidate) subtractTokens.add(mpnCandidate.toLowerCase());

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

    // B. Unit & Capacity Protection
    // Handles "128GB", "3.6GHz", "32MP", "165Hz"
    const hasUnits =
      /^\d+(\.\d+)?(gb|tb|mb|wh|w|zoll|inch|ghz|mhz|mp|cores?|kerne|kabel|threads?|hz)$/i.test(
        cleanLower,
      ) || /^\d+(\.\d+)?(hz|ghz|mhz)/i.test(rawLower);

    if (hasUnits) return;

    // C. Model Numbers
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

    // D. Subtraction Logic (with normalization for special chars like 80+)
    const normalizedToken = cleanLower
      .replace(/80plus/g, "plus")
      .replace(/80/g, "plus");
    if (subtractTokens.has(cleanLower) || subtractTokens.has(normalizedToken))
      return;

    if (rawLower.includes("80+") || rawLower.includes("80-plus")) return;

    modelWords.push(word);
  });

  // ESSENTIAL: For Laptops/TVs, Screen Size is part of the Model Identity.
  // If we have it in variantMap but NOT in the modelWords, inject it.
  if (isFixedTraitCategory && variantMap.Size) {
    const sizeNorm = variantMap.Size.replace(/\s*(?:Zoll|Inch|")/i, "").trim();
    const hasSizeInModel = modelWords.some((w) => {
      const wClean = w.replace(/\s*(?:Zoll|Inch|")/i, "").trim();
      return wClean === sizeNorm || w.includes('"');
    });

    if (!hasSizeInModel) {
      modelWords.push(variantMap.Size);
    }
  }

  // Fallback
  if (modelWords.length === 0 && rawWords.length > 0) {
    modelWords.push(rawWords[0]);
  }

  // 5. Construct Descriptive Final Titles
  const orderedWords: string[] = [];
  const modelHead = modelWords[0] || "";
  orderedWords.push(modelHead);

  // Collect traits (deduplicated)
  const traits = new Set<string>();
  modelWords.slice(1).forEach((t) => {
    if (t.toLowerCase() !== modelHead.toLowerCase()) traits.add(t);
  });

  // Sort traits by type-priority for the model name
  const sortedTraits = Array.from(traits).sort((a, b) => {
    const getPriority = (s: string) => {
      const l = s.toLowerCase();

      // Dynamic Check: Is this the Size?
      if (variantMap.Size) {
        const sizeVal = parseFloat(variantMap.Size);
        const tokenVal = parseFloat(l.replace(",", "."));
        // If strict match on numeric value
        if (
          !isNaN(sizeVal) &&
          !isNaN(tokenVal) &&
          Math.abs(sizeVal - tokenVal) < 0.1 &&
          // Safety: Don't treat "4" as size match for PS4 if size is 4"... unlikely but possible for small screens
          variantMap.Size.includes('"')
        ) {
          return 3;
        }
      }

      // Priority -1: GPU/Marketing Prefixes (Must precede numbers)
      if (
        [
          "geforce",
          "radeon",
          "rtx",
          "gtx",
          "rx",
          "arc",
          "intel",
          "amd",
        ].includes(l)
      )
        return -1;

      // Priority 0: Pure Model ID / Numbers (e.g. "4", "15", "S25", "A54", "4070")
      // Must be relatively short alphanumeric start-sequence
      if (/^([a-z]{0,2}\d{1,5}[a-z]?)$/i.test(l)) return 0;

      // Priority 2 -> 0.1: Explicit Suffix Modifiers
      // Make them stick closer to the model number than generic words (Priority 1)
      if (
        [
          "air",
          "pro",
          "max",
          "ultra",
          "plus",
          "mini",
          "slim",
          "studio",
          "ti",
          "xt",
          "super",
          "oc",
        ].includes(l)
      )
        return 0.1;

      // Priority 3: Size
      if (l.includes("zoll") || l.includes("inch") || l.includes('"')) return 3;

      // Priority 4: Year
      if (/^202\d$/.test(l)) return 4;

      // Priority 5: Chip Generation
      if (/^m[1-9]/.test(l)) return 5;

      return 1; // Default for other words (e.g. "Artisan", "Gaming")
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

  // 4. Variant Labeling (Idealo Style: [Traits] [Color] [MPN])
  const isSmartphone =
    category.includes("smartphone") || category.includes("handy");

  const hasStorage = variantMap.Storage || variantMap.Speicher;
  const hasRam = variantMap.RAM || variantMap.Arbeitsspeicher;
  const isTablet =
    category.includes("tablet") || title.toLowerCase().includes("ipad");
  const isComplexTech = isLaptop || isTablet || (hasStorage && hasRam);

  const variantItems: string[] = [];
  [
    "Storage",
    "Speicher",
    "Kapazität",
    "Speicherkapazität",
    "RAM",
    "Arbeitsspeicher",
    "Size",
    "Bildschirmdiagonale",
    "Größe",
    "Color",
    "Farbe",
    "Style",
  ].forEach((k) => {
    const val = variantMap[k];
    if (val && typeof val === "string") {
      let displayVal = val;
      const valLower = val.toLowerCase();

      // Deduplicate against modelWithTraits (Token-based check)
      const modelTokens = modelWithTraits.toLowerCase().split(/[^a-z0-9]+/);
      const valTokens = valLower.split(/[^a-z0-9]+/);

      // Filter out tokens that are already in the model name (e.g. "Series X")
      const uniqueTokens = valTokens.filter(
        (t) => t.length > 0 && !modelTokens.includes(t),
      );

      if (uniqueTokens.length === 0) return; // Entire value is redundant

      // If some tokens were removed, rebuild the displayVal
      if (uniqueTokens.length < valTokens.length) {
        displayVal = val
          .split(/[^a-z0-9]+/i)
          .filter((t) => t.length > 0 && !modelTokens.includes(t.toLowerCase())) // Keep only tokens NOT in modelTokens
          .join(" ")
          .replace(/^[^a-z0-9]+/i, "")
          .replace(/[^a-z0-9]+$/i, "")
          .trim();

        if (!displayVal) return;
      }

      // EXCLUSION: For Smartphones, Size is usually noise in the display title/subtitle
      const isSizeKey =
        ["size", "bildschirmdiagonale", "größe"].includes(k.toLowerCase()) ||
        val.includes('"') ||
        val.toLowerCase().includes("zoll");

      // If it's a category where Size is part of the Model (Laptops, TVs), exclude from suffix entirely
      if (isFixedTraitCategory && isSizeKey) return;
      // Also exclude for smartphones
      if (isSmartphone && isSizeKey) return;

      // COMPLEX TECH: For MacBooks/Laptops, exclude Storage/RAM from the suffix IF we have Color+MPN
      // USER REQUEST: Always keep storage for Tablets/Phones as they are primary differentiators
      if (
        isComplexTech &&
        !isTablet &&
        !isSmartphone &&
        (k.toLowerCase().includes("storage") ||
          k.toLowerCase().includes("speicher") ||
          k === "RAM" ||
          k === "Arbeitsspeicher")
      ) {
        const hasColor = variantMap.Color || variantMap.Farbe;
        const mpn = (product.mpn || variantMap.MPN || "").trim();
        if (hasColor && mpn.length > 3) return;
      }

      // SMART LABELING: Append context if missing (e.g. 16 GB -> 16 GB RAM)
      if (valLower.includes("gb") || valLower.includes("tb")) {
        const hasSSD =
          valLower.includes("ssd") ||
          valLower.includes("hdd") ||
          title.toLowerCase().includes("ssd");
        const hasRAM =
          valLower.includes("ram") ||
          valLower.includes("arbeitsspeicher") ||
          k.toLowerCase().includes("ram") ||
          k.toLowerCase().includes("arbeitsspeicher");

        if (!hasSSD && !hasRAM) {
          if (
            k.toLowerCase().includes("storage") ||
            k.toLowerCase().includes("speicher")
          ) {
            displayVal = `${val} SSD`;
          } else if (k === "RAM" || k === "Arbeitsspeicher") {
            displayVal = `${val} RAM`;
          }
        }
      }

      const isAlreadyRepresented = variantItems.some((item) => {
        const itemNorm = item.toLowerCase().replace(/[^a-z0-9]/g, "");
        const valNorm = val.toLowerCase().replace(/[^a-z0-9]/g, "");
        const displayNorm = displayVal.toLowerCase().replace(/[^a-z0-9]/g, "");

        // 1. Exact or normalized string match
        if (item === displayVal) return true;
        if (itemNorm.includes(valNorm) || valNorm.includes(itemNorm))
          return true;
        if (displayNorm.includes(itemNorm) || itemNorm.includes(displayNorm))
          return true;

        // 2. Semantic Capacity Match (e.g. "1 TB" and "1024 GB" and "1 TB SSD")
        const itemGB = parseCapacityToGB(item);
        const valGB = parseCapacityToGB(val);
        if (itemGB > 0 && itemGB === valGB) return true;

        return false;
      });

      if (!isAlreadyRepresented) {
        variantItems.push(displayVal);
      }
    }
  });

  const variantLabel = variantItems.join(" ").trim();

  // Model Title: Brand + Model Name (without variants)
  const modelTitleParts = [];
  if (brand) modelTitleParts.push(brand);
  modelTitleParts.push(modelWithTraits);
  const modelTitle = modelTitleParts.join(" ").trim();

  // Variant Suffix: Just the differentiators
  const variantSuffixParts = [variantLabel];
  // Robust MPN Recovery for Suffix
  let mpnVal = (product.mpn || variantMap.MPN || "").trim().toUpperCase();
  if (!mpnVal) {
    // Try to find anything that looks like a technical model code in the variantMap
    const techCode = Object.entries(variantMap).find(
      ([k, v]) =>
        /^[a-z]{1,2}\d+[a-z\d\/]+$/i.test(String(v)) && String(v).length >= 4,
    )?.[1];
    if (techCode) {
      mpnVal = String(techCode).trim().toUpperCase();
    } else if (mpnCandidate) {
      // Fallback to title scan candidate already identified
      mpnVal = mpnCandidate.toUpperCase();
    }
  }

  // COMPLEXITY CHECK: Only show MPN in suffix if it's a complex category or highly variable.
  // Idealo logic: simple products (Smartphone with Color+Storage) don't need MPN in title/slug.
  // Complex products (Laptops with 5+ variable traits) DO need MPN.
  const traitCount = variantItems.filter((i) => i.trim().length > 0).length;
  // Hardened High Variance: Always true for laptops or multi-trait hardware
  const isHighVariance = isLaptop || traitCount > 2;

  if (
    (isHighVariance || isLaptop) &&
    mpnVal &&
    mpnVal.length > 3 &&
    !modelWithTraits.toUpperCase().includes(mpnVal) &&
    !variantLabel.toUpperCase().includes(mpnVal)
  ) {
    variantSuffixParts.push(mpnVal);
  }
  const variantSuffix = variantSuffixParts.join(" ").trim();

  // Full Display Title: Model Title + Variant Suffix
  const displayTitle = variantSuffix
    ? `${modelTitle} ${variantSuffix}`
    : modelTitle;

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
    mpn: mpnVal,
    isHighVariance,
    traitCount,
    isLaptop,
    categoryUsed: category,
  };
}
