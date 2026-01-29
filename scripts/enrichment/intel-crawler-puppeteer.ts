import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

/**
 * Intel Ark Crawler (Puppeteer Edition)
 * Uses headless Chrome to render Intel Ark listing pages and extract product URLs.
 */
const OUTPUT_FILE = path.join(process.cwd(), "data", "intel-url-map.json");

const SERIES_URLS = [
  "https://www.intel.de/content/www/de/de/products/details/processors/core/i9/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core/i7/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core/i5/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core/i3/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core-ultra/series-2/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core-ultra/series-1/products.html",
];

async function run() {
  console.log("🕷️ Intel Crawler (Puppeteer): Launching...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=de-DE"],
  });

  const productMap: Record<string, string> = {};

  try {
    const page = await browser.newPage();
    // Set viewport to trigger desktop layout
    await page.setViewport({ width: 1920, height: 1080 });

    // Set headers to look like a real German user
    await page.setExtraHTTPHeaders({
      "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    for (const url of SERIES_URLS) {
      console.log(`   Navigating to: ${url}`);
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

        // Wait for the table/list to appear
        // Intel pages often use a data table with class 'intel-table' or 'table' or a grid
        // We'll wait a bit just to be safe as the table loads async
        await new Promise((r) => setTimeout(r, 5000));

        // Extract links
        const links = await page.evaluate(() => {
          const results: { text: string; href: string }[] = [];
          const anchors = document.querySelectorAll("a");

          anchors.forEach((a) => {
            const href = a.getAttribute("href");
            const text = a.textContent?.trim() || "";

            if (href && href.includes("/products/sku/") && text.length > 5) {
              results.push({ text, href });
            }
          });
          return results;
        });

        console.log(`      Found ${links.length} potential product links.`);

        for (const link of links) {
          // Parse model name from text
          // "Intel® Core™ i9-14900K Processor (36M Cache, up to 6.00 GHz)" -> "i9-14900K"
          // "Intel® Core™ Ultra 9 Processor 185H (24M Cache, up to 5.10 GHz)" -> "Ultra 9 185H"
          const text = link.text;
          let model = "";

          const matchGen = text.match(/i\d-\d{4,5}[A-Z]{0,2}/i);
          if (matchGen) {
            model = matchGen[0];
          } else {
            const matchUltra = text.match(/Ultra \d \d{3}[A-Z]{0,1}/i);
            if (matchUltra) model = matchUltra[0];
          }

          if (model) {
            const fullUrl = link.href.startsWith("http")
              ? link.href
              : "https://www.intel.de" + link.href;
            // Prefer shorter URL links (sometimes duplicate with query params)
            if (
              !productMap[model] ||
              fullUrl.length < productMap[model].length
            ) {
              productMap[model] = fullUrl;
            }
          }
        }
      } catch (err: any) {
        console.error(`      Failed to crawl ${url}: ${err.message}`);
      }
    }

    console.log(
      `✅ Crawl Complete. Mapped ${Object.keys(productMap).length} processors.`,
    );
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(productMap, null, 2));
    console.log(`💾 Saved map to ${OUTPUT_FILE}`);
  } catch (e) {
    console.error("Critical Error:", e);
  } finally {
    await browser.close();
  }
}

run();
