import { and, eq, isNull, like, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { db, products } from "../../src/db/index";

/**
 * Intel Ark Sniper Scraper (German Edition)
 * Targets: https://www.intel.de/content/www/de/de/products/sku/...
 * Strategy: Uses Puppeteer to bypass 403 and extract specs from DOM.
 */
export class IntelArkScraper {
  private urlMap: Record<string, string> = {};
  private browser: any = null;

  constructor() {
    try {
      const mapPath = path.join(process.cwd(), "data", "intel-url-map.json");
      if (fs.existsSync(mapPath)) {
        this.urlMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
        console.log(
          `🗺️ Loaded URL map with ${Object.keys(this.urlMap).length} entries.`,
        );
      }
    } catch (e) {
      console.warn("⚠️ Could not load intel-url-map.json");
    }
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=de-DE"],
      });
    }
  }

  async closeBrowser() {
    if (this.browser) await this.browser.close();
  }

  /**
   * 1. Discovery: Look up URL in local map
   */
  async discoverUrl(modelName: string): Promise<string | null> {
    // Exact match
    if (this.urlMap[modelName]) return this.urlMap[modelName];

    // Fuzzy match (e.g. map has "i7-14700K", model is "Core i7-14700K")
    // Iterate keys
    for (const [key, url] of Object.entries(this.urlMap)) {
      if (modelName.includes(key) || key.includes(modelName)) {
        return url;
      }
    }

    return null;
  }

  /**
   * 2. Extraction: Puppeteer Page Visit
   */
  async scrapePage(url: string): Promise<Record<string, string> | null> {
    try {
      console.log(`🎯 Sniping: ${url}`);
      await this.initBrowser();
      const page = await this.browser.newPage();

      await page.setViewport({ width: 1920, height: 1080 });
      await page.setExtraHTTPHeaders({
        "Accept-Language": "de-DE,de;q=0.9",
      });

      // Go to page
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      // Extract specs from DOM
      const specs = await page.evaluate(() => {
        const allData: Record<string, string> = {
          Source: "Intel ARK",
          ExtractionDate: new Date().toISOString(),
        };

        // Try to capture all sections and their rows
        const sections = document.querySelectorAll(
          'section, .tech-section, [id^="specs-"]',
        );
        sections.forEach((section) => {
          let sectionName =
            section
              .querySelector("h3, h2, .tech-section-title")
              ?.textContent?.trim() || "";

          section
            .querySelectorAll(".tech-section-row, .row, tr")
            .forEach((row) => {
              const label = row
                .querySelector(".tech-label, .label, td:first-child")
                ?.textContent?.trim()
                .replace(/\s*‡\s*$/, "")
                .trim();
              const value = row
                .querySelector(".tech-data, .value, td:last-child")
                ?.textContent?.trim();

              if (
                label &&
                value &&
                label !== value &&
                label.length > 1 &&
                label.length < 150
              ) {
                const key = sectionName ? `${sectionName}: ${label}` : label;
                allData[key] = value;
              }
            });
        });

        // Global fallback if sections didn't work well
        if (Object.keys(allData).length < 10) {
          document
            .querySelectorAll(".tech-section-row, .row, tr")
            .forEach((row) => {
              const label = row
                .querySelector(".tech-label, .label, td:first-child")
                ?.textContent?.trim()
                .replace(/\s*‡\s*$/, "")
                .trim();
              const value = row
                .querySelector(".tech-data, .value, td:last-child")
                ?.textContent?.trim();
              if (
                label &&
                value &&
                label !== value &&
                label.length > 1 &&
                label.length < 150 &&
                !label.includes("\n")
              ) {
                if (!allData[label]) allData[label] = value;
              }
            });
        }

        return allData;
      });

      await page.close();
      return specs;
    } catch (e) {
      console.error("❌ Extraction Failed (Puppeteer):", e);
      return null;
    }
  }

  /**
   * Main Driver
   */
  async runBatch(limit = 10) {
    console.log("🔫 Intel Ark Sniper: Initializing...");

    // Find Intel CPUs without official specs, excluding coolers
    const targets = await db.query.products.findMany({
      where: and(
        like(products.title, "%Intel%"),
        isNull(products.officialSpecifications),
        // Filter out common cooler/non-cpu components that might match model-like numbers
        sql`${products.title} NOT LIKE '%Kühler%'`,
        sql`${products.title} NOT LIKE '%Cooler%'`,
        sql`${products.title} NOT LIKE '%Mainboard%'`,
        sql`${products.title} NOT LIKE '%Motherboard%'`,
      ),
      limit: limit,
      orderBy: products.id,
    });

    console.log(`📋 Found ${targets.length} targets.`);

    for (const p of targets) {
      // Robust Extraction Logic
      let model: string | null = null;

      // 1. Try to find the exact model pattern (e.g. i7-14700K, Ultra 7 155H, etc.)
      // This is the most reliable way to match against our 1,014 entry map.
      const patterns = [
        /(i[3579]-\d{4,5}[A-Z]{0,2})/i, // i7-14700K
        /(Ultra\s+[3579]\s+\d{3}[A-Z]{0,2})/i, // Ultra 7 155H
        /(Core\s+[3579]\s+\d{3,4}[A-Z]{0,2})/i, // Core 7 150U
        /\b(\d{4,5}[KFS]{1,2})\b/, // 14700K (alone)
      ];

      for (const reg of patterns) {
        const match = p.title.match(reg);
        if (match) {
          model = match[1] || match[0];
          break;
        }
      }

      if (!model) {
        // Fallback: look for just the SKU like "265K"
        const skuMatch = p.title.match(/\b(\d{3,5}[A-Z]{0,2})\b/);
        if (skuMatch) model = skuMatch[1];
      }

      if (!model) {
        console.log(`❌ Could not parse model from: "${p.title}"`);
        continue;
      }

      // Standardize model for mapping (e.g. "i7 14700K" -> "i7-14700K")
      model = model.replace(/\s+/g, " ").trim();
      if (/^i[3579]\s+\d/.test(model)) model = model.replace(" ", "-");

      console.log(`🔍 Seeking: "${model}" for title: "${p.title}"`);

      const url = await this.discoverUrl(model);
      if (url) {
        const specs = await this.scrapePage(url);
        if (specs && Object.keys(specs).length > 5) {
          console.log(
            `✅ Acquired ${Object.keys(specs).length} specs for ${model}`,
          );

          await db
            .update(products)
            .set({
              officialSpecifications: JSON.stringify(specs),
              officialTitle:
                specs["Processor Number"] ||
                specs["Prozessornummer"] ||
                model ||
                p.title,
              enrichmentStatus: "processed",
              lastEnrichedAt: new Date(),
            })
            .where(eq(products.id, p.id));

          // Sleep to be polite
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          console.log(`⚠️ Snipe incomplete/failed for ${url}`);
          await db
            .update(products)
            .set({ enrichmentStatus: "error" })
            .where(eq(products.id, p.id));
        }
      } else {
        console.log(`❌ No URL found in map for model: "${model}"`);
        // If not found in map, mark as not_found
        await db
          .update(products)
          .set({ enrichmentStatus: "not_found" })
          .where(eq(products.id, p.id));
      }
    }
  }
}

// Runnable
if (require.main === module) {
  const limit = parseInt(process.argv[2]) || 10;
  new IntelArkScraper().runBatch(limit).catch(console.error);
}
