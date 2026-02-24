import { Product } from "@/lib/product-registry";
import { describe, expect, mock, test } from "bun:test";
import { mapRawToLocalizedProduct } from "./category-products";

// Mock calculateDesirabilityScore to avoid dependencies
mock.module("./scoring", () => ({
  calculateDesirabilityScore: () => ({ popularityScore: 850 }),
}));

// Mock normalizeBrand
mock.module("../utils/category-utils", () => ({
  normalizeBrand: (b: string) => (b === "WD" ? "Western Digital" : b),
}));

describe("mapRawToLocalizedProduct", () => {
  const countryCode = "de";
  const categorySlug = "ssd";

  test("Fast-path: correctly maps an already localized product object", () => {
    const mockProduct = {
      id: 123,
      slug: "samsung-990-pro",
      asin: "B0B9C321",
      title: "Samsung 990 Pro 1TB",
      brand: "Samsung",
      category: "ssds",
      prices: { de: 120 },
      condition: "New",
      capacity: 1000,
      capacityUnit: "GB",
      normalizedCapacity: 1000,
      specifications: "{}", // Required for Fast-path trigger
      popularityScore: 500, // Should be recalculated by fast-path
    } as unknown as Product;

    const result = mapRawToLocalizedProduct(
      mockProduct,
      countryCode,
      categorySlug,
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe(123);
    expect(result?.price).toBe(120);
    expect(result?.popularityScore).toBe(850); // Recalculated value from mock
    expect(result?.brand).toBe("Samsung");
  });

  test("Fast-path: applies brand normalization", () => {
    const mockProduct = {
      id: 456,
      prices: { de: 80 },
      brand: "WD", // Should be normalized to Western Digital
      title: "WD Blue SN580",
    } as unknown as Product;

    const result = mapRawToLocalizedProduct(
      mockProduct,
      countryCode,
      categorySlug,
    );

    expect(result?.brand).toBe("Western Digital");
  });

  test("Normal-path: falls back to full mapping for raw DB rows", () => {
    // A raw DB row doesn't have the 'prices' object in the same way a Product entity does
    const rawRow = {
      id: 789,
      title: "Crucial P3 500GB SSD",
      brand: "Crucial",
      category: "ssds",
      prices: { de: 45 },
    };

    const result = mapRawToLocalizedProduct(rawRow, countryCode, categorySlug);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(789);
    expect(result?.price).toBe(45);
    // It should have extracted capacity from title if not present
    expect(result?.capacity).toBe(500);
  });
});
