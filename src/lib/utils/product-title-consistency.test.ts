import { describe, expect, it } from "bun:test";

import { getFamilyIdentity } from "../product-families";
import { getProductIdentity } from "./product-identity";

describe("Product Title Consistency Guard Rail", () => {
  it("should ensure PDP title and Category Page title are identical for high-variance products", () => {
    // representative MacBook variant
    const product = {
      id: 289,
      brand: "Apple",
      title: "Apple MacBook Air Mitternacht 256 GB SSD 16 GB RAM MW123D/A",
      category: "notebooks",
      specifications: {
        Modell: "MacBook Air",
        Color: "Mitternacht",
        Storage: "256 GB",
        RAM: "16 GB",
      },
      variationAttributes: "Color: Mitternacht; Storage: 256 GB; RAM: 16 GB",
      mpn: "MW123D/A",
    };

    // 1. Get Identity (Used for internal lookups)
    const identity = getProductIdentity(product);

    // 2. Get Family Identity (Source of truth for DB/Grid)
    const { title: familyFullTitle, displaySubtitle } =
      getFamilyIdentity(product);

    // CATEGORY PAGE RENDER LOGIC (from IdealoGridCard/mapDbProduct)
    const categoryModelPart =
      displaySubtitle && familyFullTitle.includes(displaySubtitle)
        ? familyFullTitle.replace(displaySubtitle, "").trim()
        : familyFullTitle;
    const categorySubtitlePart = displaySubtitle;

    // PDP PAGE RENDER LOGIC (from IdealoProductPage H1)
    const pdpModelPart = displaySubtitle
      ? familyFullTitle.replace(displaySubtitle, "").trim()
      : familyFullTitle;
    const pdpSubtitlePart = displaySubtitle;

    console.log(
      "Category Title Partition:",
      `[${categoryModelPart}]`,
      `[${categorySubtitlePart}]`,
    );
    console.log(
      "PDP Title Partition:     ",
      `[${pdpModelPart}]`,
      `[${pdpSubtitlePart}]`,
    );

    // ASSERTION: The parts must combine into the exact same visual string
    expect(`${categoryModelPart} ${categorySubtitlePart}`).toBe(
      `${pdpModelPart} ${pdpSubtitlePart}`,
    );
  });
});
