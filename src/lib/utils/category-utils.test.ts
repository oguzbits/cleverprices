import { describe, expect, test } from "bun:test";
import { sortProducts } from "./category-utils";

describe("category utils > sortProducts", () => {
  test("should inherit best value from family and rank Hub cards above their variants", () => {
    const products = [
      {
        id: 1,
        parentAsin: "FAMILY_A",
        title: "A Variant Expensive",
        price: 100,
      },
      { id: 2, parentAsin: "FAMILY_A", title: "A Variant Cheap", price: 80 },
      {
        id: 900,
        parentAsin: "FAMILY_A",
        title: "A Hub",
        price: 80,
        isParentView: true,
      },
      { id: 3, parentAsin: "FAMILY_B", title: "B Variant Mediocre", price: 90 },
      {
        id: 901,
        parentAsin: "FAMILY_B",
        title: "B Hub",
        price: 90,
        isParentView: true,
      },
    ];

    const sortedAsc = sortProducts(products, "price", "asc");

    // Expected order (Price ascending):
    // 1. A Hub (inherits 80, wins tiebreaker over A Variant Cheap)
    // 2. A Variant Cheap (80)
    // 3. B Hub (inherits 90, wins tiebreaker over B Variant Mediocre)
    // 4. B Variant Mediocre (90)
    // 5. A Variant Expensive (100)
    expect(sortedAsc.map((p) => p.id)).toEqual([900, 2, 901, 3, 1]);

    const sortedDesc = sortProducts(products, "price", "desc");

    // Expected order (Price descending):
    // If descending, familyBest inherits the HIGHEST value for the Hub!
    // FAMILY_A highest price is 100. So Hub A gets 100.
    // FAMILY_B highest price is 90. So Hub B gets 90.
    // Order:
    // 1. A Hub (100)
    // 2. A Variant Expensive (100)
    // 3. B Hub (90)
    // 4. B Variant Mediocre (90)
    // 5. A Variant Cheap (80)
    expect(sortedDesc.map((p) => p.id)).toEqual([900, 1, 901, 3, 2]);
  });
});
