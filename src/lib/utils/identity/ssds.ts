import { ProductIdentity } from "../product-identity";
import { IdentityStrategy } from "./types";

export class SsdStrategy implements IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null {
    const rawSpecs =
      product.officialSpecifications || product.official_specifications;
    const specs =
      typeof rawSpecs === "string" ? JSON.parse(rawSpecs) : rawSpecs || {};

    const modelName = specs["Modell"] || specs["Model"] || specs["Name"];
    const capacity =
      specs["Speicherkapazität"] ||
      specs["Digitale Speicherkapazität"] ||
      specs["Kapazität"];
    const formFactor =
      specs["Festplatten-Formfaktor"] ||
      specs["Formfaktor"] ||
      specs["SSD Formfaktor"];
    const brand = product.brand || "";
    const title = product.title || "";

    if (!capacity) return null;

    // Clean model: If model is missing or generic, use brand
    let cleanModel = modelName
      ? String(modelName).replace(new RegExp(brand, "gi"), "").trim()
      : "";

    // Normalize Capacity
    let capStr = String(capacity).replace(/\s+/g, "").toUpperCase();
    if (!capStr.endsWith("B")) capStr += "B";

    const variantMap: Record<string, string> = {
      capacity: capStr,
    };
    if (formFactor) variantMap.formFactor = String(formFactor);

    return {
      model: cleanModel || brand,
      fullModel: `${cleanModel || brand} ${capStr}`,
      variantMap,
      traitCount: Object.keys(variantMap).length + 1,
    };
  }
}
