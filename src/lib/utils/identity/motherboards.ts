import { ProductIdentity, verifySpecModel } from "../product-identity";
import { IdentityStrategy } from "./types";

export class MotherboardStrategy implements IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null {
    const specs =
      typeof product.officialSpecifications === "string"
        ? JSON.parse(product.officialSpecifications)
        : product.officialSpecifications || {};

    const chipset = specs.chipset || specs.Chipset;
    const socket = specs.socket || specs.Socket || specs["Socket / Prozessor"];
    const formFactor = specs.formFactor || specs["Formfaktor"];
    const specModel = specs.model || specs.Model || specs["Modell"];

    if (!specModel && !chipset) return null;

    // We want to reconstruct a clean identity: Brand + Model
    // If we have a specific model in specs, we verify it against the title
    let model = specModel || "";

    if (
      model &&
      verifySpecModel(model, product.title || "", product.brand || "")
    ) {
      return {
        model: model,
        fullModel: model,
        shortModel: model.split(" ")[0],
        traitCount: 2,
      };
    }

    // Fallback: Reconstruct from chipset if model is missing or invalid
    if (chipset) {
      const reconstructed = `${chipset}${socket ? " " + socket : ""}${formFactor ? " " + formFactor : ""}`;
      return {
        model: reconstructed,
        fullModel: reconstructed,
        traitCount: 1,
      };
    }

    return null;
  }
}
