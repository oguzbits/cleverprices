import fs from "fs";
import { chromium } from "playwright";

const OUTPUT_FILE = "data/intel-url-map.json";
const TARGET_URLS = [
  "https://www.intel.de/content/www/de/de/products/details/processors/core/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core/i9/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core/i7/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core/i5/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core/i3/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/core-ultra/products.html",
  "https://www.intel.de/content/www/de/de/products/details/processors/xeon/products.html",
];

async function run() {
  console.log("🕷️ Intel Crawler (Puppeteer): Launching...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const productMap: Record<string, string> = {};

  try {
    const page = await context.newPage();

    for (const url of TARGET_URLS) {
      console.log(`   Navigating to: ${url}`);
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

        // 1. Handle cookie banner if visible
        try {
          const cookieBtn = await page.waitForSelector(
            "#onetrust-accept-btn-handler",
            {
              timeout: 5000,
            },
          );
          if (cookieBtn) await cookieBtn.click();
        } catch (e) {}

        // 2. Wait for content
        await page.waitForSelector("a[href*='/products/sku/']", {
          timeout: 15000,
        });

        // 3. Extract links
        const links = await page.evaluate(() => {
          const results: { text: string; href: string }[] = [];
          const anchors = document.querySelectorAll(
            "a[href*='/products/sku/']",
          );

          anchors.forEach((a) => {
            const href = a.getAttribute("href");
            const text = a.textContent?.trim() || "";
            if (href && text.length > 2) {
              results.push({ text, href });
            }
          });
          return results;
        });

        console.log(`      Found ${links.length} potential product links.`);

        for (const link of links) {
          const text = link.text;
          let model = "";

          // Capture everything after Core/Ultra/Xeon until the first parenthesis or comma
          const matchGen = text.match(/Core™?\s*([^,()]+)/i);
          const matchUltra = text.match(/Ultra\s*([^,()]+)/i);
          const matchXeon = text.match(/Xeon\s*([^,()]+)/i);

          if (matchGen) {
            model = matchGen[1].trim().replace(/\s+/g, "-");
            model = model.replace(/-(prozessor|processor)/i, "");
            if (
              !model.toLowerCase().startsWith("i") &&
              !model.toLowerCase().startsWith("core")
            ) {
              model = "Core-" + model;
            }
          } else if (matchUltra) {
            model = "Ultra-" + matchUltra[1].trim().replace(/\s+/g, "-");
          } else if (matchXeon) {
            model = "Xeon-" + matchXeon[1].trim().replace(/\s+/g, "-");
          }

          if (model) {
            const fullUrl = link.href.startsWith("http")
              ? link.href
              : "https://www.intel.de" + link.href;

            if (!productMap[model]) {
              // console.log(`         ✨ Mapped: ${model}`);
            }
            productMap[model] = fullUrl;
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
