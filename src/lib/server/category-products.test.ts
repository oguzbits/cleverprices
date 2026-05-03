import { describe, expect, test } from "bun:test";

import { Product } from "@/lib/product-definitions";

import { mapRawToLocalizedProduct } from "./category-products";

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
    expect(result?.popularityScore).toBeDefined(); // Recalculated value from real scoring
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
      id: 1,
      title: "Test Product",
      brand: "TestBrand",
      category: "smartphones",
      prices: { de: 100 },
    } as unknown as Product;
    const result = mapRawToLocalizedProduct(rawRow, countryCode, categorySlug);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.price).toBe(100);
    // It should have preserved the brand
    expect(result?.brand).toBe("TestBrand");
  });
});
