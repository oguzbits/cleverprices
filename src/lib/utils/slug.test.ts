import { describe, expect, test } from "bun:test";
import { generateProductSlug } from "./slug";

describe("generateProductSlug", () => {
  test("generates basic slug from title and brand", () => {
    const slug = generateProductSlug(
      "Samsung 990 PRO 4TB NVMe M.2 SSD",
      "Samsung",
      "B0CBYZ6DD1",
    );
    expect(slug).toContain("990");
    expect(slug).toContain("pro");
    expect(slug).toEndWith("6dd1");
  });

  test("appends last 4 chars of ASIN for uniqueness", () => {
    const slug = generateProductSlug(
      "iPhone 15 Pro Max",
      "Apple",
      "B0CQXXXXYZ",
    );
    expect(slug).toEndWith("xxyz");
  });

  test("handles missing ASIN gracefully", () => {
    const slug = generateProductSlug("Samsung Galaxy S24 Ultra", "Samsung");
    expect(slug).toBeTruthy();
    expect(slug).not.toContain("undefined");
  });

  test("handles missing brand gracefully", () => {
    const slug = generateProductSlug(
      "Samsung Galaxy S24 Ultra",
      null,
      "B0ABCDEF12",
    );
    expect(slug).toBeTruthy();
    expect(slug).not.toContain("null");
  });

  test("includes storage attribute when not in model", () => {
    const slug = generateProductSlug("iPhone 15 Pro", "Apple", "B0ABCDEF12", {
      storage: "256GB",
    });
    expect(slug).toContain("256gb");
  });

  test("does not duplicate storage if already in title", () => {
    const slug = generateProductSlug(
      "Samsung 990 PRO 4TB",
      "Samsung",
      "B0CBYZ6DD1",
      { storage: "4TB" },
    );
    // Count occurrences of "4tb" - should appear exactly once
    const matches = slug.match(/4tb/g);
    expect(matches?.length).toBe(1);
  });

  test("includes color attribute", () => {
    const slug = generateProductSlug("iPhone 15 Pro", "Apple", "B0ABCDEF12", {
      color: "Titanblau",
    });
    expect(slug).toContain("titanblau");
  });

  test("transliterates German umlauts", () => {
    const slug = generateProductSlug(
      "Tübinger Gerät für Büroarbeit",
      "Generic",
      "B0ABCDEF12",
    );
    expect(slug).not.toContain("ü");
    expect(slug).not.toContain("ö");
  });

  test("strips special characters", () => {
    const slug = generateProductSlug(
      "Product (2024 Edition) [NEW!]",
      "Brand",
      "B0ABCDEF12",
    );
    expect(slug).not.toMatch(/[()[\]!]/);
  });

  test("produces deterministic output", () => {
    const args = ["Samsung 990 PRO 2TB", "Samsung", "B0CBYZ6DD1"] as const;
    const slug1 = generateProductSlug(...args);
    const slug2 = generateProductSlug(...args);
    expect(slug1).toBe(slug2);
  });

  test("empty inputs produce empty slug (no crash)", () => {
    const slug = generateProductSlug("", "", "");
    expect(slug).toBe(""); // Edge case: no title = no slug, but no crash
  });

  test("never produces double hyphens", () => {
    const slug = generateProductSlug(
      "Product---With   Spaces & Dashes",
      "Brand",
      "B0ABCDEF12",
    );
    expect(slug).not.toContain("--");
  });
});
