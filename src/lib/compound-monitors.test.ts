import { describe, expect, it } from "bun:test";
import { getProductIdentity } from "./utils/product-identity";

describe("Compound Monitor Specs", () => {
  it("should strip '4k-Monitor' from the title", () => {
    const product = {
      title: "Samsung ViewFinity S8 4k-Monitor S27B800PXU",
      brand: "Samsung",
      category: "monitors",
    };
    const identity = getProductIdentity(product);
    // We want "Samsung ViewFinity S8 S27B800PXU" or similar
    // Crucially, it should NOT contain "4k-Monitor"
    expect(identity.displayTitle).not.toContain("4k-Monitor");
    expect(identity.displayTitle).not.toContain("4kMonitor");
  });

  it("should strip 'QHD-Display' from the title", () => {
    const product = {
      title: "LG UltraGear QHD-Display 27GP850-B",
      brand: "LG",
      category: "monitors",
    };
    const identity = getProductIdentity(product);
    expect(identity.displayTitle).not.toContain("QHD-Display");
  });
});
