import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import { chromium } from "playwright";
import { db, products } from "../../src/db";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";
import { GOOGLE_FIELD_MAP, normalizeGoogleValue } from "./google-mapper";

/**
 * Google Shopping (Knowledge Panel) Enricher
 * Uses Playwright to search for EANs and extract structured specs in German.
 */
class GoogleShoppingEnricher {
  private browser: any = null;
  private context: any = null;

  async init() {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      locale: "de-DE",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
  }

  async close() {
    if (this.browser) await this.browser.close();
  }

  async enrichByGtin(
    gtin: string,
    brand?: string,
  ): Promise<{
    specs: Record<string, string> | null;
    officialTitle: string | null;
  } | null> {
    const page = await this.context.newPage();
    try {
      // Use hl=de to ensure German results
      const url = `https://www.google.de/search?q=${gtin}&hl=de&tbm=shop`;
      console.log(`🌐 Navigating to: ${url}`);

      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      // Check for Block/Captcha
      const isBlocked = await page.evaluate(() => {
        return (
          document.body.innerText.includes("unusual traffic") ||
          document.body.innerText.includes("CAPTCHA") ||
          document.title.includes("Sorry!")
        );
      });

      if (isBlocked) {
        console.warn(
          "⚠️ Google Blocked us! Suspending enrichment to save IP reputation.",
        );
        process.exit(1); // Immediate exit to prevent further flags
      }

      // Check for consent (common on Google DE)
      const consentButton = await page.$(
        'button:has-text("Alle akzeptieren"), button:has-text("Ich stimme zu"), button:has-text("Akzeptieren")',
      );
      if (consentButton) {
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
        await consentButton.click();
      }

      // Look for the "Informationen zu diesem Produkt" or "Details" section
      // Often in the sidebar for EAN searches

      let officialTitle: string | null = null;

      // Selectors based on verified structure
      // .YU1Fsb is the row class
      // .TCzUld is the label class

      const specs: Record<string, string> = {};

      // Step 1: Specific Extraction logic
      const extractFromPage = async () => {
        // Extract Official Title (Knowledge Panel H1)
        officialTitle = await page.evaluate(() => {
          // Priority 1: H1 inside the Knowledge Panel / Detail view
          const h1 = document.querySelector(
            'h1, [role="heading"][aria-level="1"]',
          );
          if (h1 && h1.textContent) {
            const t = h1.textContent.trim();
            if (t.length > 5 && t.length < 150) return t;
          }
          return null;
        });

        const rows = await page.$$(".YU1Fsb, .W67Drf"); // .W67Drf is sometimes used in KP
        for (const row of rows) {
          const labelEl = await row.$(".TCzUld, .i9777c");
          if (!labelEl) continue;

          const label = (await labelEl.textContent())
            ?.trim()
            ?.replace(/:$/, "");

          const value = (await page.evaluate((el: any) => {
            const row = el.closest("tr, div.YU1Fsb, div.W67Drf");
            if (!row) return null;
            // The value is usually in a sibling div or cell
            const text = (row as HTMLElement).innerText || "";
            const labelText = (el as HTMLElement).innerText || "";
            return text
              .replace(labelText, "")
              .replace(/^[:\s]+/, "")
              .trim();
          }, labelEl)) as string | null;

          if (label && value) {
            const cpField = GOOGLE_FIELD_MAP[label];
            if (cpField) {
              specs[cpField] = normalizeGoogleValue(label, value);
            }
          }
        }

        // Sanitize the collected specs before returning
        const sanitized = sanitizeSpecs(specs, brand);
        Object.keys(specs).forEach((k) => delete specs[k]);
        Object.assign(specs, sanitized);
      };

      // Try Shopping Tab
      await extractFromPage();

      // Step 2: Skip General Search (Disabled for Speed)
      console.log(
        `   ⏭️ Skipping general search fallback (Disabled for speed)`,
      );

      return {
        specs: Object.keys(specs).length > 0 ? specs : null,
        officialTitle,
      };
    } catch (e: any) {
      console.error(`❌ Error enriching ${gtin}:`, e.message);
      return null;
    } finally {
      await page.close();
    }
  }

  async run(limit = 10) {
    await this.init();

    console.log(`🚀 Starting Google Shopping Enrichment (Limit: ${limit})...`);

    const targets = await db
      .select()
      .from(products)
      .where(
        and(
          isNotNull(products.gtin),
          isNull(products.icecatId),
          or(
            isNull(products.officialSpecifications),
            eq(products.enrichmentStatus, "pending"),
            eq(products.enrichmentStatus, "not_found"),
          ),
        ),
      )
      .limit(limit);

    console.log(`📋 Found ${targets.length} candidates.`);

    for (const product of targets) {
      console.log(`🔍 Checking Google for: ${product.title} (${product.gtin})`);
      const result = await this.enrichByGtin(
        product.gtin!,
        product.brand || undefined,
      );

      if (result && (result.specs || result.officialTitle)) {
        console.log(
          `✅ Extracted ${Object.keys(result.specs || {}).length} fields and ${result.officialTitle ? "official title" : "no title"}!`,
        );

        await db
          .update(products)
          .set({
            officialSpecifications: result.specs
              ? JSON.stringify(result.specs)
              : product.officialSpecifications,
            officialTitle: result.officialTitle || product.officialTitle,
            enrichmentStatus: "processed",
            lastEnrichedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      } else {
        console.log("❌ No significant data found on Google.");
      }

      // Random human-like delay between 5-10 seconds to avoid blocking
      const delay = 5000 + Math.random() * 5000;
      console.log(
        `⏱️ Waiting ${Math.round(delay / 1000)}s before next GTIN...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }

    await this.close();
  }
}

// CLI
if (require.main === module) {
  const enricher = new GoogleShoppingEnricher();
  const limit = parseInt(process.argv[2] || "5");
  enricher.run(limit).catch(console.error);
}
