import { ProductIdentity } from "../product-identity";
import { IdentityStrategy } from "./types";

export class CpuStrategy implements IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null {
    const rawSpecs =
      product.officialSpecifications || product.official_specifications;
    const specs =
      typeof rawSpecs === "string" ? JSON.parse(rawSpecs) : rawSpecs || {};

    const modelName =
      specs["Modell"] ||
      specs["Model"] ||
      specs["Modellbezeichnung"] ||
      specs["Hersteller-Teilenummer"];
    const socket =
      specs["Prozessorsockel"] || specs["Socket"] || specs["Sockel"];
    const cores =
      specs["Anzahl der Prozessorkerne"] || specs["Kerne"] || specs["Cores"];
    const brand = product.brand || "";
    const title = product.title || "";

    if (!modelName) return null;

    // Clean model: Avoid brand duplication
    let cleanModel = String(modelName)
      .replace(new RegExp(brand, "gi"), "")
      .trim();

    const variantMap: Record<string, string> = {};
    if (socket) variantMap.socket = String(socket);
    if (cores) variantMap.cores = String(cores);

    return {
      model: cleanModel,
      fullModel: `${cleanModel} (${socket || "CPU"})`,
      variantMap,
      traitCount: Object.keys(variantMap).length + 1,
    };
  }
}
