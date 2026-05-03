import { describe, expect, it, mock } from "bun:test";

import { type Product } from "../product-definitions";
import { getPDPRenderData } from "./cached-products";

// Mock dependencies
mock.module("../product-registry", () => ({
  fetchSimilarProducts: () =>
    Promise.resolve([
      { id: 101, title: "Similar", prices: { de: 50 } } as unknown as Product,
    ]),
  getCanonicalFamilyId: () => Promise.resolve(1),
  getProductVariants: () => Promise.resolve([]),
  getProductById: mock(() =>
    Promise.resolve({
      id: 1,
      slug: "test-product",
      category: "ssd",
      prices: { de: 100 },
      title: "Test Product",
    } as unknown as Product),
  ),
}));

mock.module("../categories", () => ({
  getCategoryBySlug: () => Promise.resolve({ name: "SSD", slug: "ssd" }),
}));

mock.module("./live-data", () => ({
  mergeLivePricesSelective: (products: Product[]) => Promise.resolve(products),
}));

describe("cached-products / getPDPRenderData", () => {
  it("should include a 'now' timestamp in the render data", async () => {
    const data = await getPDPRenderData("1_-test-product", "de");

    expect(data).not.toBeNull();
    if (data) {
      expect(data.now).toBeDefined();
      expect(typeof data.now).toBe("number");
      expect(data.now).toBeGreaterThan(1700000000000); // Sometime in the 2020s
    }
  });

  it("should batch merge all products (product, variants, sidebar, carousel)", async () => {
    const data = await getPDPRenderData("1_-test-product", "de");
    expect(data?.similarCarousel).toHaveLength(1);
    expect(data?.similarCarousel[0].title).toBe("Similar");
  });
});
