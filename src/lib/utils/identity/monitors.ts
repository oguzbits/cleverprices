import type { Product } from "../../product-definitions";
import { IdentityStrategy, ProductIdentity } from "./types";

export class MonitorStrategy implements IdentityStrategy {
  extract(product: Product): Partial<ProductIdentity> | null {
    const rawSpecs =
      product.officialSpecifications || product.official_specifications;
    const specs =
      typeof rawSpecs === "string" ? JSON.parse(rawSpecs) : rawSpecs || {};

    const brand = (product.brand || "").trim();
    const title = (product.title || "").trim();

    // 1. Algorithmic Attribute Pattern Detection (Stop Markers)
    // We stop model extraction when we hit units or standard resolutions
    const attributeMarker =
      /(\d+\s*(?:"|Zoll|Inch|Hz|ms|cm))|(\d{3,4}x\d{3,4})|(\b(4K|5K|8K|UHD|WQHD|FHD|IPS|VA|TN|OLED|LED|Monitor|Display|Bildschirm|Silber|White|Black|Silver|Curved)\b)/i;

    // 2. Base Model Extraction
    let modelName =
      specs["Modell"] || specs["Model"] || specs["Modellbezeichnung"];

    if (!modelName && title) {
      const tokens = title.split(/[\s,]+/);
      const modelParts: string[] = [];
      const franchises = [
        "ultrasharp",
        "viewfinity",
        "tuf",
        "rog",
        "strix",
        "odyssey",
        "alienware",
        "predator",
        "nitro",
        "legion",
        "precision",
        "gaming",
      ];
      const brandLower = brand.toLowerCase();

      let modelIdentified = false;
      for (const token of tokens) {
        const lowerToken = token.toLowerCase();

        // Skip the brand itself
        if (lowerToken === brandLower) continue;

        // Stop if we hit any physical attribute (size, hz, res)
        if (attributeMarker.test(token)) break;

        // Keep franchise words
        if (franchises.some((f) => lowerToken.includes(f))) {
          modelParts.push(token);
          continue;
        }

        // Identify Model/Series/MPN:
        if (/[A-Z].*\d|\d.*[A-Z]/i.test(token)) {
          // If we haven't found a model yet, take whatever alphanumeric we find (Series or Model)
          if (!modelIdentified) {
            modelParts.push(token);
            modelIdentified = true;
          }
          // If we already have a model (e.g. S70D), only take subsequent ones if they are very long (MPNs)
          else if (token.length >= 6) {
            modelParts.push(token);
          }
          continue;
        }

        // Catch-all: If it's capitalized and we don't have a model yet (e.g. "Plus")
        if (
          modelParts.length === 0 &&
          /^[A-Z]/.test(token) &&
          token.length > 2
        ) {
          modelParts.push(token);
        }
      }
      modelName = modelParts.join(" ");
    }

    // 3. Normalization logic
    const size =
      specs["Anzeigegrösse"] || specs["Screen Size"] || specs["Display-Größe"];
    const resolution =
      specs["Display-Auflösung"] ||
      specs["Maximale Displayauflösung"] ||
      specs["Auflösung"];
    const refresh = specs["Wiederholfrequenz"] || specs["Refresh Rate"];

    // Clean model Name
    const cleanModel = (modelName || "")
      .replace(new RegExp(brand, "gi"), "")
      .trim();

    // Size Normalization (even from title if missing in specs)
    let normSize = "";
    if (size) {
      normSize =
        String(size)
          .replace(/\s*(Zoll|Inch|")\s*/gi, "")
          .trim() + '"';
    } else {
      const sizeMatch = title.match(/(\d{2})\s*(?:"|Zoll|Inch)/i);
      if (sizeMatch) normSize = sizeMatch[1] + '"';
    }

    // Resolution Normalization
    let normRes = "";
    if (resolution) {
      const resStr = String(resolution).toUpperCase();
      if (resStr.includes("3840") && resStr.includes("2160")) normRes = "4K";
      else if (resStr.includes("2560") && resStr.includes("1440"))
        normRes = "WQHD";
      else if (resStr.includes("1920") && resStr.includes("1080"))
        normRes = "FHD";
      else normRes = resStr.split(/\s+/)[0]; // Just take first part
    } else {
      const resMatch = title.match(/\b(4K|5K|8K|UHD|WQHD|QHD|FHD)\b/i);
      if (resMatch) normRes = resMatch[1].toUpperCase();
    }

    const variantMap: Record<string, string> = {};
    if (normSize) variantMap.size = normSize;
    if (normRes) variantMap.resolution = normRes;
    if (refresh) variantMap.refresh = String(refresh).replace(/\s+Hz/i, "Hz");

    // Important: For identity, use ONLY the core model + primary variants
    const identityModel = cleanModel || brand;

    return {
      model: identityModel,
      fullModel: `${identityModel}${normSize ? " " + normSize : ""}${normRes ? " " + normRes : ""}`,
      variantMap,
      traitCount: Object.keys(variantMap).length + 1,
    };
  }
}
