import { ProductIdentity, verifySpecModel } from "../product-identity";
import {
  extractRealStorageFromTitle,
  parseVariationAttributes,
} from "../variants";
import { IdentityStrategy } from "./types";

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
    // Model regex: handles digit-only, letter suffix (e/a/s), and named variants (Pro Max, Ultra, etc.)
    const titleModelMatch = title.match(
      /\b(Pixel\s\d+[a-z]?(?:\s(?:Pro\sXL|Pro|XL|Fold|aFold))?|iPhone\s\d+[a-z]?(?:\sPro\sMax|\sPro|\sPlus|\sAir)?|Galaxy\s(?:S|A|Z)\d+[a-z]?(?:\sPlus|\sUltra|\sFE|\sFold|\sFlip)?)\b/i,
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

    if (
      cleanTitle &&
      cleanSpec &&
      cleanTitle.toLowerCase().includes(cleanSpec.toLowerCase()) &&
      cleanTitle.length > cleanSpec.length
    ) {
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
      // If verification fails, we STILL check for brand mismatch even for high confidence brands
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
      ];
      const hasBrandMismatch = otherBrands.some(
        (b) => candLower.includes(b) && brandLower !== b,
      );

      if (hasBrandMismatch || !isHighConfidenceBrand) {
        return null;
      }
    }

    // Helper: treat placeholder "..." values as missing
    const realVal = (v: string | undefined) =>
      v && v.trim() !== "..." ? v : undefined;

    // Attributes from variation attributes (Fallback)
    const attrs = parseVariationAttributes(product.variationAttributes);

    const storage =
      realVal(specs.storage) ||
      realVal(specs.Storage) ||
      realVal(specs["Interner Speicher"]) ||
      realVal(specs["Interne Speicherkapazität"]) ||
      attrs.Storage ||
      attrs.Speicher ||
      extractRealStorageFromTitle(title);

    let color =
      realVal(specs.color) ||
      realVal(specs.Color) ||
      realVal(specs["Farbe"]) ||
      realVal(specs["Produktfarbe"]) ||
      realVal(specs["Gehäusefarbe"]) ||
      attrs.Color ||
      attrs.Farbe;

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

