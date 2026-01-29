import { and, eq, isNull, sql } from "drizzle-orm";
import { db, products } from "../../src/db/index";
import { DeviceEnricherBase } from "./device-enricher-base";

export class SamsungWebScraper extends DeviceEnricherBase {
  async run(limit = 10) {
    console.log("🌌 Samsung Galaxy Scraper: Initializing...");
    const targets = await db.query.products.findMany({
      where: and(
        eq(products.brand, "Samsung"),
        isNull(products.officialSpecifications),
        // Focus on Galaxy S and A series smartphones
        sql`(${products.title} LIKE '%Galaxy S%' OR ${products.title} LIKE '%Galaxy A%')`,
        // Exclude accessories
        sql`${products.title} NOT LIKE '%Case%'`,
        sql`${products.title} NOT LIKE '%Cover%'`,
        sql`${products.title} NOT LIKE '%Folie%'`,
      ),
      limit: limit,
      orderBy: products.id,
    });

    console.log(`📋 Found ${targets.length} target Samsung devices.`);

    if (targets.length === 0) return;

    const page = await this.getPage();

    for (const p of targets) {
      try {
        console.log(`🔍 Processing: ${p.title}`);

        // clean title
        let query = p.title;
        const match = p.title.match(
          /(Samsung\s+Galaxy\s+[S|A]\d{2,3}\s?([5|4]G)?( FE)?( Ultra)?(\+)?)/i,
        );
        if (match) {
          query = match[0];
          console.log(`🧹 Cleaned query: "${query}"`);
        }

        // 1. Search on Samsung Germany
        // Using Google Search restricted to Samsung DE is often more reliable than internal search
        const searchUrl = `https://www.google.com/search?q=site:samsung.com/de+${encodeURIComponent(query + " technische daten")}`;
        await page.goto(searchUrl, { waitUntil: "networkidle2" });

        // 2. Extract the best link (looking for /smartphones/galaxy-... path)
        const productUrl = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll("a"));
          const target = links.find(
            (a) =>
              (a.href.includes("samsung.com/de/smartphones/") ||
                a.href.includes("/support/model/")) &&
              !a.href.includes("/accessories/") &&
              !a.href.includes(".pdf") &&
              !a.href.includes("amazon"),
          );
          return target ? target.href : null;
        });

        if (productUrl) {
          console.log(`🎯 Found product URL: ${productUrl}`);
          await page.goto(productUrl, { waitUntil: "networkidle2" });

          // 3. Try to expand the 'Spezifikationen' or scroll to #specs
          // Often Samsung specs are loaded dynamically or in an accordion
          try {
            await page.waitForSelector("#specs, .feature-specs", {
              timeout: 5000,
            });
          } catch (e) {
            // Sometimes it's a "Technische Daten" button
          }

          const specs = await page.evaluate(() => {
            const data: Record<string, string> = {
              Source: "Samsung DE",
              ExtractionDate: new Date().toISOString(),
            };

            // Selector strategy for Samsung's varied layouts
            // 1. New Layout (Accordion/List)
            document
              .querySelectorAll(
                ".spec-highlight__title, .spec-bar__title, .specs__item-title",
              )
              .forEach((el) => {
                const key = el.textContent?.trim();
                const val = el.nextElementSibling?.textContent?.trim();
                if (key && val) data[key] = val;
              });

            // 2. Table Layout
            document.querySelectorAll("table tr").forEach((row) => {
              const k = row
                .querySelector("th, td:first-child")
                ?.textContent?.trim();
              const v = row.querySelector("td:last-child")?.textContent?.trim();
              if (k && v && k !== v) data[k] = v;
            });

            return data;
          });

          if (Object.keys(specs).length > 3) {
            console.log(
              `✅ Success: Extracted ${Object.keys(specs).length} specs.`,
            );
            await db
              .update(products)
              .set({
                officialSpecifications: JSON.stringify(specs),
                enrichmentStatus: "processed",
                lastEnrichedAt: new Date(),
              })
              .where(eq(products.id, p.id));
          } else {
            console.log(
              `⚠️ Low spec count (${Object.keys(specs).length}) for ${productUrl}`,
            );
          }
        } else {
          console.log(`❌ No product page found for ${p.title}`);
        }

        // Polite delay
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        console.error(`💥 Error processing ${p.title}:`, e);
      }
    }

    await page.close();
    await this.closeBrowser();
  }
}

if (require.main === module) {
  const limit = parseInt(process.argv[2]) || 5;
  new SamsungWebScraper().run(limit).catch(console.error);
}
