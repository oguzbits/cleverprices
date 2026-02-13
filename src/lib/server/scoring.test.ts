import type { Product } from "@/lib/product-registry";
import { describe, expect, test } from "bun:test";
import { calculateDesirabilityScore } from "./scoring";

// Minimal product factory for testing — only fields used by scoring
function makeProduct(overrides: Record<string, any> = {}): Product {
  return {
    id: 1,
    slug: "test-product",
    asin: "B0TEST0001",
    title: "Test Product",
    brand: "Samsung",
    category: "ssd",
    affiliateUrl: "",
    prices: { de: 100 },
    condition: "New" as const,
    monthlySold: 100,
    reviewCount: 50,
    rating: 4.5,
    salesRank: 500,
    ...overrides,
  } as unknown as Product;
}

describe("calculateDesirabilityScore", () => {
  test("returns all required fields", () => {
    const result = calculateDesirabilityScore(
      makeProduct(),
      100,
      "Test Product",
    );
    expect(result).toHaveProperty("popularityScore");
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("prestigeMultiplier");
    expect(result).toHaveProperty("isPrestige");
    expect(result).toHaveProperty("scoreBreakdown");
  });

  test("prestige brand scores higher than budget brand", () => {
    const prestige = calculateDesirabilityScore(
      makeProduct({ brand: "Apple", monthlySold: 100, salesRank: 500 }),
      999,
      "iPhone 16 Pro",
    );
    const budget = calculateDesirabilityScore(
      makeProduct({ brand: "Doogee", monthlySold: 100, salesRank: 500 }),
      999,
      "Doogee Smartphone",
    );
    expect(prestige.popularityScore).toBeGreaterThan(budget.popularityScore);
  });

  test("marks prestige brands correctly", () => {
    const apple = calculateDesirabilityScore(
      makeProduct({ brand: "Apple" }),
      999,
      "iPhone",
    );
    const noname = calculateDesirabilityScore(
      makeProduct({ brand: "NoNameBrand123" }),
      999,
      "Phone",
    );
    expect(apple.isPrestige).toBe(true);
    expect(noname.isPrestige).toBe(false);
  });

  test("higher sales rank (lower number) scores higher", () => {
    const topSeller = calculateDesirabilityScore(
      makeProduct({ salesRank: 10 }),
      100,
      "Product A",
    );
    const poorSeller = calculateDesirabilityScore(
      makeProduct({ salesRank: 100000 }),
      100,
      "Product B",
    );
    expect(topSeller.scoreBreakdown.popularity).toBeGreaterThan(
      poorSeller.scoreBreakdown.popularity,
    );
  });

  test("used products get penalized", () => {
    const newProduct = calculateDesirabilityScore(
      makeProduct({ condition: "New" }),
      100,
      "Product",
    );
    const usedProduct = calculateDesirabilityScore(
      makeProduct({ condition: "Used" }),
      100,
      "Product",
    );
    expect(newProduct.popularityScore).toBeGreaterThan(
      usedProduct.popularityScore,
    );
  });

  test("products with more reviews rank higher (same rating)", () => {
    const manyReviews = calculateDesirabilityScore(
      makeProduct({ reviewCount: 5000, rating: 4.5 }),
      100,
      "Product",
    );
    const fewReviews = calculateDesirabilityScore(
      makeProduct({ reviewCount: 5, rating: 4.5 }),
      100,
      "Product",
    );
    expect(manyReviews.scoreBreakdown.trust).toBeGreaterThan(
      fewReviews.scoreBreakdown.trust,
    );
  });

  test("current year in title gets freshness boost", () => {
    const currentYear = new Date().getFullYear();
    const fresh = calculateDesirabilityScore(
      makeProduct(),
      100,
      `Product ${currentYear} Edition`,
    );
    const stale = calculateDesirabilityScore(
      makeProduct(),
      100,
      "Product 2019 Edition",
    );
    expect(fresh.scoreBreakdown.freshness).toBeGreaterThan(
      stale.scoreBreakdown.freshness,
    );
  });

  test("landing context applies stronger brand multiplier", () => {
    const landing = calculateDesirabilityScore(
      makeProduct({ brand: "Apple" }),
      999,
      "iPhone",
      "landing",
    );
    const category = calculateDesirabilityScore(
      makeProduct({ brand: "Apple" }),
      999,
      "iPhone",
      "category",
    );
    expect(landing.prestigeMultiplier).toBeGreaterThan(
      category.prestigeMultiplier,
    );
  });

  test("zero sales rank produces zero popularity", () => {
    const result = calculateDesirabilityScore(
      makeProduct({ salesRank: 0 }),
      100,
      "Product",
    );
    expect(result.scoreBreakdown.popularity).toBe(0);
  });

  test("budget brands get penalized on landing pages", () => {
    const budgetLanding = calculateDesirabilityScore(
      makeProduct({ brand: "Doogee" }),
      50,
      "Doogee Phone",
      "landing",
    );
    const budgetCategory = calculateDesirabilityScore(
      makeProduct({ brand: "Doogee" }),
      50,
      "Doogee Phone",
      "category",
    );
    expect(budgetLanding.scoreBreakdown.penalty).toBeLessThan(
      budgetCategory.scoreBreakdown.penalty,
    );
  });
});
