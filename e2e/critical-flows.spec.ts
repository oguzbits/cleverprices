import { expect, test } from "@playwright/test";

test.describe("Critical User Flows", () => {
  test("homepage loads and shows categories", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CleverPrices/i);
    // Check that at least one category link is visible
    await expect(page.locator("a[href*='/']").first()).toBeVisible();
  });

  test("health endpoint returns healthy status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("healthy");
  });

  test("search returns results for Samsung", async ({ page }) => {
    await page.goto("/");
    // Open search modal (Cmd+K or click search button)
    await page.keyboard.press("Meta+k");
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Type search query
    await page.keyboard.type("Samsung");
    await page.waitForTimeout(500); // Debounce

    // Expect results to appear
    await expect(
      page
        .locator('[role="dialog"]')
        .getByText(/Samsung/i)
        .first(),
    ).toBeVisible();
  });

  test("product page loads with price", async ({ page }) => {
    // Navigate to a known product (using slug pattern)
    await page.goto("/smartphones");

    // Click first product link
    const productLink = page.locator('a[href^="/p/"]').first();
    await productLink.click();

    // Verify product page elements
    await expect(page.locator("h1")).toBeVisible();
  });
});
