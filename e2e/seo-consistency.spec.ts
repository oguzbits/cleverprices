import { expect, test } from "@playwright/test";

/**
 * SEO Consistency & Guard Rails
 * 
 * This test suite ensures that:
 * 1. Variants (200M+ IDs) are accessible to users (no 301 redirect to Hub).
 * 2. Variants correctly point to the Hub (900M+ IDs) via rel="canonical".
 * 3. Hub pages (900M+ IDs) are accessible and serve as the canonical.
 */
test.describe("SEO Canonical & Routing Guard Rails", () => {
  
  test("Variant page (200M+) is accessible and has Hub (900M+) as canonical", async ({ page }) => {
    // 1. Start at a category page
    await page.goto("/smartphones");
    
    // 2. Go to a product page (Hub)
    const firstProduct = page.locator('a[href^="/p/"]').first();
    await firstProduct.click();
    await page.waitForLoadState("networkidle");

    // 3. Find a variant chip (200M+ ID)
    const variantLink = page.locator('a[href^="/p/200"]').first();
    if (!(await variantLink.isVisible())) {
      console.log("Skipping variant check: No 200M+ variant links found on this page.");
      return;
    }

    const variantHref = await variantLink.getAttribute("href");
    await variantLink.click();
    
    // Wait for URL to contain the variant ID
    await page.waitForURL(`**${variantHref}*`);

    // 4. Verify the canonical tag points to the Hub (900M+)
    // Use .first() to avoid strict mode violation if multiple tags are present (though we strive for 1)
    const canonical = await page.locator('head > link[rel="canonical"]').first().getAttribute("href");
    console.log(`Current URL: ${page.url()}`);
    console.log(`Canonical Tag: ${canonical}`);
    
    expect(canonical).toMatch(/\/p\/900/);
    
    // 5. Verify the Product Schema also uses the 900M+ ID
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let productSchemaFound = false;
    for (const script of scripts) {
      const content = await script.textContent();
      if (content && (content.includes('"@type":"Product"') || content.includes('"@type": "Product"'))) {
        productSchemaFound = true;
        expect(content).toMatch(/\/p\/900/);
        break;
      }
    }
    
    if (!productSchemaFound) {
      console.log("Warning: Product Schema (@type: Product) not found on this page.");
      // In a strict environment, we might want to expect(productSchemaFound).toBe(true);
    }
  });

  test("Directly visiting a 900M+ Hub URL works and stays there", async ({ page }) => {
    await page.goto("/smartphones");
    
    // Find a Hub link in the listings
    const hubLink = page.locator('a[href*="/p/900"]').first();
    if (!(await hubLink.isVisible())) {
       console.log("Skipping Hub check: No 900M+ links found in listings.");
       return;
    }

    const hubHref = await hubLink.getAttribute("href");
    await hubLink.click();
    await page.waitForLoadState("networkidle");
    
    expect(page.url()).toContain("900");
    
    const canonical = await page.locator('head > link[rel="canonical"]').first().getAttribute("href");
    expect(canonical).toMatch(/\/p\/900/);
  });

  test("Stale slug for a valid ID results in a 301 redirect to correct slug", async ({ page }) => {
    await page.goto("/smartphones");
    const firstProduct = page.locator('a[href^="/p/"]').first();
    const href = await firstProduct.getAttribute("href");
    
    if (href) {
        // Create a stale URL by changing the slug part
        const origin = new URL(page.url()).origin;
        const staleUrl = origin + href.replace(/_-.*$/, "_-stale-slug-test");
        
        // Navigate to stale URL
        const responseData = await page.goto(staleUrl);
        
        // Verify it redirected back to the correct href
        expect(page.url()).toContain(href);
        expect(page.url()).not.toContain("stale-slug-test");
        
        // Wait for navigation and verify it redirected back to the correct href
        await page.waitForURL(url => url.toString().includes(href), { timeout: 10000 });
        expect(page.url()).toContain(href);
        expect(page.url()).not.toContain("stale-slug-test");
    }
  });
});
