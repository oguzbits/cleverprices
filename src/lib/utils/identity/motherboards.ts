import { ProductIdentity, verifySpecModel } from "../product-identity";
import { IdentityStrategy } from "./types";

export class MotherboardStrategy implements IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null {
    const rawSpecs =
      product.officialSpecifications || product.official_specifications;
    const specs =
      typeof rawSpecs === "string" ? JSON.parse(rawSpecs) : rawSpecs || {};

    const chipset = specs.chipset || specs.Chipset;
    const socket = specs.socket || specs.Socket || specs["Socket / Prozessor"];
    const formFactor = specs.formFactor || specs["Formfaktor"];
    const specModel = specs.model || specs.Model || specs["Modell"];

    if (!specModel && !chipset) return null;

    // We want to reconstruct a clean identity: Brand + Model
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
