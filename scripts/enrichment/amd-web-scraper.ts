import { and, eq, isNull, sql } from "drizzle-orm";
import { db, products } from "../../src/db/index";
import { DeviceEnricherBase } from "./device-enricher-base";

export class AmdWebScraper extends DeviceEnricherBase {
  async run(limit = 10) {
    console.log("🔴 AMD Scraper: Initializing...");
    const targets = await db.query.products.findMany({
      where: and(
        eq(products.brand, "AMD"),
        isNull(products.officialSpecifications),
        // Focus on Ryzen
        sql`${products.title} LIKE '%Ryzen%'`,
        // Exclude generic items
        sql`${products.title} NOT LIKE '%Fan%'`,
      ),
      limit: limit,
      orderBy: products.id,
    });

    console.log(`📋 Found ${targets.length} target AMD processors.`);

    if (targets.length === 0) return;

    const page = await this.getPage();

    // Static map to Series pages (more reliable than individual product search)
    const seriesMap: Record<string, string> = {
      "Ryzen 9 9":
        "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/ryzen-9.html",
      "Ryzen 9 7":
        "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/ryzen-9.html",
      "Ryzen 9 5":
        "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/ryzen-9.html",
      "Ryzen 7 9":
        "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/ryzen-7.html",
      "Ryzen 7 8":
        "https://www.amd.com/en/products/processors/desktops/ryzen/8000-series/ryzen-7.html",
      "Ryzen 7 7":
        "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/ryzen-7.html",
      "Ryzen 7 5":
        "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/ryzen-7.html",
      "Ryzen 5 9":
        "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/ryzen-5.html",
      "Ryzen 5 8":
        "https://www.amd.com/en/products/processors/desktops/ryzen/8000-series/ryzen-5.html",
      "Ryzen 5 7":
        "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/ryzen-5.html",
      "Ryzen 5 5":
        "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/ryzen-5.html",
      Threadripper:
        "https://www.amd.com/en/products/processors/desktops/ryzen-threadripper.html",
    };

    for (const p of targets) {
      try {
        console.log(`🔍 Processing: ${p.title}`);

        let seriesUrl = "";
        let modelParams = "";

        // Heuristic to find the right series page
        if (p.title.includes("Threadripper")) {
          seriesUrl = seriesMap["Threadripper"];
        } else {
          // Try to match "Ryzen 9 7950X" -> "Ryzen 9 7" key
          const match = p.title.match(/Ryzen\s+(\d)\s+(\d)/);
          if (match) {
            const key = `Ryzen ${match[1]} ${match[2]}`;
            seriesUrl = seriesMap[key];
          }
        }

        if (!seriesUrl) {
          // Fallback to general lookup if specific series not found
          console.log(`⚠️ Could not map ${p.title} to a specific series page.`);
          continue;
        }

        console.log(`🎯 Targeted Series URL: ${seriesUrl}`);
        await page.goto(seriesUrl, { waitUntil: "networkidle2" });

        // Extract specs from the series table logic
        // We look for a row that mentions our specific model number (e.g. "5800X")
        const modelNumberMatch = p.title.match(/(\d{4}[A-Z,0-9]*)/);
        const modelNumber = modelNumberMatch ? modelNumberMatch[1] : null;

        if (!modelNumber) {
          console.log(`❌ Could not extract model number from ${p.title}`);
          continue;
        }

        console.log(`👀 Looking for model number: ${modelNumber} in table...`);

        const specs = await page.evaluate((targetModel) => {
          const data: Record<string, string> = {
            Source: "AMD Series Page",
            ExtractionDate: new Date().toISOString(),
          };

          // Find row containing model number
          // AMD uses complex tables, sometimes div-based
          // Strategy 1: Look for table rows in the main specifications table
          let rows = Array.from(document.querySelectorAll("tbody tr"));
          let targetRow = rows.find((r) =>
            r.textContent?.includes(targetModel),
          );

          // Strategy 2: Look for grid items/divs if no table found
          if (!targetRow) {
            const divs = Array.from(
              document.querySelectorAll(".views-row, .row, .item"),
            );
            targetRow = divs.find((d) =>
              d.textContent?.includes(targetModel),
            ) as any;
          }

          if (targetRow) {
            // Try to map headers to values based on column index
            const cells = Array.from(
              targetRow.querySelectorAll("td, .views-field"),
            );

            // If we have a clean table row
            if (targetRow.tagName === "TR") {
              // Attempt to grab headers from the closest table
              const table = targetRow.closest("table");
              const headers = Array.from(
                table?.querySelectorAll("thead th") || [],
              ).map((h) => h.textContent?.trim() || "");

              headers.forEach((h, i) => {
                if (h && cells[i]) {
                  data[h] = cells[i].textContent?.trim() || "";
                }
              });
            } else {
              // Fallback for div-rows: try to find key/value inside the row
              // Often structure is <div class="field-content">Value</div>
              data["Model"] = targetModel;
              data["RawSpecs"] =
                targetRow.textContent?.replace(/\s+/g, " ").trim() || "";
            }
          }

          return data;
        }, modelNumber);

        if (Object.keys(specs).length > 3) {
          console.log(
            `✅ Success for ${modelNumber}: Extracted ${Object.keys(specs).length} specs.`,
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
            `⚠️ Model ${modelNumber} not found in table on ${seriesUrl}`,
          );
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
  new AmdWebScraper().run(limit).catch(console.error);
}
