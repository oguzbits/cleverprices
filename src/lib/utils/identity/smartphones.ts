import { ProductIdentity, verifySpecModel } from "../product-identity";
import { extractRealStorageFromTitle } from "../variants";
import { IdentityStrategy } from "./types";

export class SmartphoneStrategy implements IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null {
    const specs =
      typeof product.officialSpecifications === "string"
        ? JSON.parse(product.officialSpecifications)
        : product.officialSpecifications || {};

    const specModel =
      specs.model ||
      specs.Model ||
      specs["Modellbezeichnung"] ||
      specs["Marketingname"];
    const brand = product.brand || "";
    const title = product.title || "";

    if (!specModel) return null;

    // Verify the spec model is actually in the title to avoid "Ghost Products"
    if (!verifySpecModel(specModel, title, brand)) return null;

    const storage =
      specs.storage ||
      specs.Storage ||
      specs["Interner Speicher"] ||
      extractRealStorageFromTitle(title);
    const color = specs.color || specs.Color || specs["Farbe"];
    const ram = specs.ram || specs.RAM || specs["Arbeitsspeicher (RAM)"];

    const variantMap: Record<string, string> = {};
    if (storage) variantMap.storage = String(storage);
    if (color) variantMap.color = String(color);
    if (ram) variantMap.ram = String(ram);

    return {
      model: specModel,
      fullModel: specModel,
      variantMap,
      traitCount: Object.keys(variantMap).length + 1,
    };
  }
}
