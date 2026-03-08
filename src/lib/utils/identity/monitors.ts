import { IdentityStrategy, ProductIdentity } from "./types";

export class MonitorStrategy implements IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null {
    const rawSpecs =
      product.officialSpecifications || product.official_specifications;
    const specs =
      typeof rawSpecs === "string" ? JSON.parse(rawSpecs) : rawSpecs || {};

    const modelName =
      specs["Modell"] || specs["Model"] || specs["Modellbezeichnung"];
    const size =
      specs["Anzeigegrösse"] || specs["Screen Size"] || specs["Display-Größe"];
    const resolution =
      specs["Display-Auflösung"] ||
      specs["Maximale Displayauflösung"] ||
      specs["Auflösung"];
    const refresh = specs["Wiederholfrequenz"] || specs["Refresh Rate"];
    const brand = product.brand || "";
    const title = product.title || "";

    if (!size || !resolution) return null;

    // Clean model: If model is missing, try to extract from title
    let cleanModel = modelName
      ? String(modelName).replace(new RegExp(brand, "gi"), "").trim()
      : "";

    // Normalize Size (e.g. "27 Zoll" -> "27\"")
    let normSize =
      String(size)
        .replace(/\s*(Zoll|Inch|")\s*/gi, "")
        .trim() + '"';

    // Normalize Resolution (e.g. "3840 x 2160" -> "4K")
    let normRes = String(resolution).toUpperCase();
    if (normRes.includes("3840") && normRes.includes("2160")) normRes = "4K";
    else if (normRes.includes("2560") && normRes.includes("1440"))
      normRes = "WQHD";
    else if (normRes.includes("1920") && normRes.includes("1080"))
      normRes = "FHD";

    const variantMap: Record<string, string> = {
      size: normSize,
      resolution: normRes,
    };
    if (refresh) variantMap.refresh = String(refresh).replace(/\s+Hz/i, "Hz");

    return {
      model: cleanModel || brand,
      fullModel: `${cleanModel || brand} ${normSize} ${normRes}`,
      variantMap,
      traitCount: Object.keys(variantMap).length + 1,
    };
  }
}
