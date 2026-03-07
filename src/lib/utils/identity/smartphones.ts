import { ProductIdentity, verifySpecModel } from "../product-identity";
import { extractRealStorageFromTitle } from "../variants";
import { IdentityStrategy } from "./types";

export class SmartphoneStrategy implements IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null {
    const rawSpecs =
      product.officialSpecifications || product.official_specifications;
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

    if (!specModel) return null;

    // Verify the spec model is actually in the title to avoid "Ghost Products"
    if (!verifySpecModel(specModel, title, brand)) return null;

    const storage =
      specs.storage ||
      specs.Storage ||
      specs["Interner Speicher"] ||
      extractRealStorageFromTitle(title);

    let color = specs.color || specs.Color || specs["Farbe"];

    // Title-based color recovery for smartphones
    if (!color) {
      const commonColors = [
        "Obsidian",
        "Hazel",
        "Porcelain",
        "Rose",
        "Mint",
        "Bay",
        "Aloe",
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
        "Space Gray",
        "Space Grey",
        "Natural",
        "Desert",
      ];
      const lowerTitle = title.toLowerCase();
      for (const c of commonColors) {
        if (lowerTitle.includes(c.toLowerCase())) {
          color = c;
          break;
        }
      }
    }

    const ram = specs.ram || specs.RAM || specs["Arbeitsspeicher (RAM)"];

    const variantMap: Record<string, string> = {};
    if (color) variantMap.color = String(color);
    if (storage) variantMap.storage = String(storage);
    if (ram) variantMap.ram = String(ram);

    return {
      model: specModel,
      fullModel: specModel,
      variantMap,
      traitCount: Object.keys(variantMap).length + 1,
    };
  }
}
