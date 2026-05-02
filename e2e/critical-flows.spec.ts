import { expect, test } from "@playwright/test";

test.describe("Critical User Flows", () => {
  test("homepage loads with correct build ID and SSR content", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Verify Build ID Header
    const buildId = response?.headers()["x-build-id"];
    expect(buildId).toBeDefined();
    console.log(`Verified Build ID: ${buildId}`);

    // Verify SSR: Check if critical content exists in the initial HTML response
    const html = await response?.text();
    expect(html).toContain("Hardware Preisvergleich");
    expect(html).toContain("<main");

    // Verify UI
    await expect(page).toHaveTitle(/Hardware Preisvergleich Deutschland/i);
    await expect(page.locator("header")).toBeVisible();
  });

  test("health endpoint returns healthy status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("healthy");
  });

  test("search returns results for Samsung", async ({ page }) => {
    await page.goto("/");

    // Wait for the search manager to be mounted/active
    await page.waitForTimeout(1000);

    // Try to click the search button first (more resilient than keyboard shortcut)
    const searchButton = page.getByRole("button", { name: /Suche/i }).first();
    await expect(searchButton).toBeVisible();
    await searchButton.click();

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Type search query
    await page.keyboard.type("Samsung");

    // Expect results to appear in the dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText(/Samsung/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("product page loads from category list", async ({ page }) => {
    // Navigate to a known category
    await page.goto("/smartphones");
    await expect(page.locator("h1")).toBeVisible();

    // Click first product link
    const productLink = page.locator('a[href^="/p/"]').first();
    await expect(productLink).toBeVisible();
    await productLink.click();

    // Verify product page elements
    await expect(page.locator("h1")).toBeVisible();
    // Check for price or related keywords (Euro symbol is a good indicator)
    await expect(page.locator("body")).toContainText(/€|Preis|Angebot/i);
  });
});
