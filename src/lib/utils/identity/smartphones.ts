import { getCleanTokens, verifySpecModel } from "../product-identity";
import {
  extractRealStorageFromTitle,
  parseCapacityToGB,
  parseVariationAttributes,
} from "../variants";
import { IdentityStrategy, ProductIdentity } from "./types";

export class SmartphoneStrategy implements IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null {
    const rawSpecs =
      product.officialSpecifications || product["official_specifications"];
    const specs =
      typeof rawSpecs === "string" ? JSON.parse(rawSpecs) : rawSpecs || {};

    const specModel =
      specs.model ||
      specs.Model ||
      specs["Modell"] ||
      specs["Modellbezeichnung"] ||
      specs["Marketingname"];
    const brand = product.brand || "";
    const title = product.title || "";

    // 1. Model extraction with Title vs Spec reconciliation
    // Model regex: handles digit-only, letter suffix (e/a/s), and named variants (Pro Max, Ultra, Air, etc.)
    // We allow iPhone Air/SE without numbers as they are valid standalone names.
    // Expanded to cover Xperia, Redmi, Poco, Moto, etc.
    const titleModelMatch = title.match(
      /\b(Pixel\s\d+[a-z]?(?:\s(?:Pro\sXL|Pro|XL|Fold|aFold))?|iPhone\s(?:\d+[a-z]?|Air|SE)(?:\s(?:Pro\sMax|Pro|Plus|Air))?|Galaxy\s(?:S|A|Z)\d+[a-z]?(?:\sPlus|\sUltra|\sFE|\sFold|\sFlip)?|Xperia\s(?:\d+|[A-Z]+)\s?[A-Z]*\d*(?:\s(?:VI|VII|V|IV|III|II|I))?|Redmi\s(?:Note\s)?\d+[a-z]?(?:\s(?:Pro\+|Pro|Plus|Max|5G))?|Poco\s[A-Z]\d+(?:\s(?:Pro|GT|5G))?|Moto\s(?:G|Edge|Moto)\s?\d+[a-z]?(?:\s(?:Pro|Plus|Ultra|5G))?)\b/i,
    );
    const titleModel = titleModelMatch ? titleModelMatch[0] : null;

    let model = specModel;

    // If title has a more specific model (e.g. 9a vs 9), prioritize title
    // Normalize by stripping brand for the comparison (e.g. "Google Pixel 9" -> "Pixel 9")
    const brandLower = brand.toLowerCase();
    const cleanSpec = specModel?.toLowerCase().startsWith(brandLower)
      ? specModel.slice(brand.length).trim()
      : specModel;
    const cleanTitle = titleModel?.toLowerCase().startsWith(brandLower)
      ? titleModel.slice(brand.length).trim()
      : titleModel;

    // CRYPTIC MODEL CHECK: If spec model is just a technical code (e.g. A3526, SM-S928B, A2633 (Cdma + Gsm))
    // and we have a descriptive title model, prefer the title.
    const isCrypticSpec =
      /^A\d{4}/i.test(cleanSpec || "") || // Apple technical codes (A2633, A3526, etc.)
      /^SM-[A-Z0-9]+$/i.test(cleanSpec || "") || // Samsung technical codes (SM-S928B)
      (/^[A-Z0-9]{5,15}$/.test(cleanSpec || "") &&
        !/[a-z]/.test(cleanSpec || "")); // General cryptic ALL-CAPS codes (PB7Y0043SE)

    if (isCrypticSpec && titleModel) {
      model = titleModel;
    } else if (
      cleanTitle &&
      cleanSpec &&
      (cleanTitle.toLowerCase().includes(cleanSpec.toLowerCase()) ||
        (cleanTitle.toLowerCase().includes("air") &&
          cleanSpec.toLowerCase().includes("air"))) &&
      (cleanTitle.length > cleanSpec.length ||
        (cleanSpec.match(/\d+/) && !cleanTitle.match(/\d+/)))
    ) {
      // Preference: Title-based model is preferred if it's more specific OR
      // if the spec adds a version number (like iPhone 17 Air) that isn't in the title (iPhone Air)
      model = titleModel;
    } else if (!specModel && titleModel) {
      model = titleModel;
    }

    if (!model) return null;

    // Verify the model is actually in the title to avoid "Ghost Products"
    // Relax verification for known brands where specs are usually partial but title is specific
    const isHighConfidenceBrand =
      brand.toLowerCase() === "google" ||
      brand.toLowerCase() === "apple" ||
      brand.toLowerCase() === "samsung";

    if (!verifySpecModel(model, title, brand)) {
      // If verification fails, we STILL check for brand mismatch or absolute lack of overlap
      const candLower = model.toLowerCase();
      const otherBrands = [
        "apple",
        "samsung",
        "sony",
        "intel",
        "amd",
        "nvidia",
        "asus",
        "msi",
        "lg",
        "google",
        "huawei",
        "xiaomi",
        "motorola",
        "nokia",
        "rubie", // Added from the 'Lalaloopsy' ghost spec case
        "disney",
        "lego",
        "hasbro",
        "mattel",
      ];
      const hasBrandMismatch = otherBrands.some(
        (b) => candLower.includes(b) && brandLower !== b,
      );

      // Strict Overlap Check: Even for high confidence brands, there must be AT LEAST one common token
      // (excluding the brand itself) to prevent "wildly wrong" spec assignments.
      const tokensCand = getCleanTokens(model);
      const tokensTitle = getCleanTokens(title);
      const overlap = tokensCand.filter(
        (t) => tokensTitle.includes(t) && t !== brandLower,
      );
      const hasZeroOverlap = overlap.length === 0;

      if (hasBrandMismatch || !isHighConfidenceBrand || hasZeroOverlap) {
        return null;
      }
    }

    // Helper: treat placeholder "..." values as missing
    const realVal = (v: string | undefined) =>
      v && v.trim() !== "..." ? v : undefined;

    // Attributes from variation attributes (Fallback)
    const attrs = parseVariationAttributes(product.variationAttributes);

    const storageRaw =
      attrs.Storage ||
      attrs.Speicher ||
      realVal(specs.storage) ||
      realVal(specs.Storage) ||
      realVal(specs["Interner Speicher"]) ||
      realVal(specs["Interne Speicherkapazität"]) ||
      extractRealStorageFromTitle(title);

    // Normalize storage (e.g. 1.024 TB -> 1 TB)
    let storage = storageRaw;
    if (storageRaw) {
      const gb = parseCapacityToGB(storageRaw);
      if (gb >= 1024) storage = `${gb / 1024} TB`;
      else if (gb > 0) storage = `${gb} GB`;
    }

    let color =
      attrs.Color ||
      attrs.Farbe ||
      realVal(specs.color) ||
      realVal(specs.Color) ||
      realVal(specs["Farbe"]) ||
      realVal(specs["Produktfarbe"]) ||
      realVal(specs["Gehäusefarbe"]);

    // Title-based color recovery for smartphones.
    // Triggered when specs have no color OR only a placeholder value.
    if (!color) {
      // Order matters: longer/more-specific names first to avoid early partial matches.
      const commonColors = [
        // German colors (common in .de market)
        "Titanium Grau",
        "Titan Wüstensand",
        "Titan Natur",
        "Titan Schwarz",
        "Titan Blau",
        "Titan Weiß",
        "Dunkel Violett",
        "Pinkes Gold",
        "Weltraumgrau",
        "Weltraum Schwarz",
        "Mitternacht",
        "Polarstern",
        "Roségold",
        "Rosé Gold",
        "Himmelblau",
        "Wüstensand",
        "Produktfarbe",
        "Schwarz",
        "Weiß",
        "Blau",
        "Grün",
        "Gelb",
        "Lila",
        "Violett",
        "Grau",
        "Silber",
        "Gold",
        "Pink",
        "Rot",
        // English / brand-specific colors
        "Titanium Gray",
        "Titanium Grey",
        "Titanium Black",
        "Titanium Blue",
        "Titanium Violet",
        "Titanium Yellow",
        "Titanium Green",
        "Titanium Orange",
        "Titanium White",
        "Titanium Natural",
        "Titanium Desert",
        "Space Gray",
        "Space Grey",
        "Obsidian",
        "Hazel",
        "Porcelain",
        "Peony",
        "Iris",
        "Wintergreen",
        "Rose Quartz",
        "Aloe",
        "Mint",
        "Rosa",
        "Bay",
        "Rose",
        "Titanium",
        "Black",
        "White",
        "Blue",
        "Green",
        "Pink",
        "Yellow",
        "Purple",
        "Gold",
        "Silver",
        "Graphite",
        "Midnight",
        "Starlight",
        "Natural",
        "Desert",
        "Sage",
        "Coral",
        "Teal",
        "Lavender",
        "Ultramarine",
      ];
      const lowerTitle = title.toLowerCase();
      for (const c of commonColors) {
        if (lowerTitle.includes(c.toLowerCase())) {
          color = c;
          break;
        }
      }
    }

    const ram =
      specs.ram || specs.RAM || specs["Arbeitsspeicher (RAM)"] || attrs.RAM;

    const variantMap: Record<string, string> = {};
    if (color) variantMap.color = String(color);
    if (storage) variantMap.storage = String(storage);
    if (ram) variantMap.ram = String(ram);

    return {
      model: model,
      fullModel: model,
      variantMap,
      traitCount: Object.keys(variantMap).length + 1,
    };
  }
}
