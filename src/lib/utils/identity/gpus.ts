import { ProductIdentity } from "../product-identity";
import { IdentityStrategy } from "./types";

export class GpuStrategy implements IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null {
    const rawSpecs =
      product.officialSpecifications || product.official_specifications;
    const specs =
      typeof rawSpecs === "string" ? JSON.parse(rawSpecs) : rawSpecs || {};

    const gpu =
      specs["Grafikprozessor"] ||
      specs["GPU"] ||
      specs["Graphics Processing Unit"];
    const vram =
      specs["Grafikspeichergröße"] ||
      specs["Interne Speicherkapazität"] ||
      specs["Speicherkapazität"];
    const brand = product.brand || "";
    const title = product.title || "";

    if (!gpu) return null;

    // Clean GPU name: "NVIDIA GeForce RTX 4070 SUPER" -> "RTX 4070 SUPER"
    let cleanGpu = String(gpu)
      .replace(
        /NVIDIA\s?|AMD\s?|Intel\s?|GeForce\s?|Radeon\s?|Sapphire\s?|ASUS\s?|MSI\s?|Gigabyte\s?/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();

    // Aggressive cleaning of common noise that leaks into specs
    cleanGpu = cleanGpu
      .split(
        /\s(Gaming|OC|DUAL|HDMI|DP|Triple|Fan|Active|Pulse|Nitro|Edition)\b/i,
      )[0]
      .trim();

    // Normalize VRAM for the suffix
    let vramSuffix = vram ? String(vram).replace(/\s+/g, "").toUpperCase() : "";
    if (vramSuffix && !vramSuffix.endsWith("B") && !vramSuffix.endsWith("G")) {
      vramSuffix += "GB";
    }

    const model = cleanGpu;
    const variantMap: Record<string, string> = {};
    if (vramSuffix) variantMap.vram = vramSuffix;

    return {
      model,
      fullModel: `${model}${vramSuffix ? " " + vramSuffix : ""}`,
      variantMap,
      traitCount: vramSuffix ? 2 : 1,
    };
  }
}
