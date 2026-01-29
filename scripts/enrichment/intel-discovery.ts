import * as cheerio from "cheerio";

/**
 * Intel Ark Crawler (German)
 * Discovers product URLs by traversing the categorized hierarchy.
 */
export class IntelCrawler {
  private static BASE_URL = "https://www.intel.de";
  // Hardcoded Series URLs to bypass dynamic navigation issues
  private static START_URLS = [
    "https://www.intel.de/content/www/de/de/products/details/processors/core/i9/products.html",
    "https://www.intel.de/content/www/de/de/products/details/processors/core/i7/products.html",
    "https://www.intel.de/content/www/de/de/products/details/processors/core/i5/products.html",
    "https://www.intel.de/content/www/de/de/products/details/processors/core/i3/products.html",
    "https://www.intel.de/content/www/de/de/products/details/processors/core-ultra/series-2/products.html",
    "https://www.intel.de/content/www/de/de/products/details/processors/core-ultra/series-1/products.html",
  ];

  // Cache visited URLs to avoid loops
  private visited = new Set<string>();

  // Map of "i7-14700K" -> "https://..."
  public productMap = new Map<string, string>();

  async crawl() {
    console.log("🕷️ Intel Crawler: Starting discovery...");

    // Process hardcoded series
    for (const url of IntelCrawler.START_URLS) {
      console.log(`   Scanning series: ${url}`);
      await this.scanSeriesPage(url);
    }

    console.log(
      `✅ Discovery Complete. Mapped ${this.productMap.size} products.`,
    );
    // debug print some
    // console.log([...this.productMap.entries()].slice(0, 5));
  }

  private async scanSeriesPage(url: string) {
    const html = await this.fetch(url);
    if (!html) return;

    const $ = cheerio.load(html);

    // Find Product Links (SKU links)
    // href contains "/products/sku/"
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();

      if (href && href.includes("/products/sku/") && text) {
        const fullUrl = href.startsWith("http")
          ? href
          : "https://www.intel.de" + href;

        // Extract clean model name from text
        // Text: "Intel® Core™ i7-14700K Prozessor (33 MB Cache, bis zu 5,60 GHz)"
        // We want "i7-14700K"
        const modelMatch = text.match(
          /(i\d-\d{4,5}[A-Z]{0,2}|Ultra \d \d{3}[A-Z]{0,1})|(\d{3,5}[A-Z]{0,2})/i,
        );

        if (modelMatch) {
          const model = modelMatch[0]; // e.g. i7-14700K
          // Add strict filter to avoid "Manuals" or generic links
          if (!this.productMap.has(model)) {
            this.productMap.set(model, fullUrl);
            // console.log(`      Found: ${model} -> ${fullUrl}`);
          }
        }
      }
    });

    // Be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  private async fetch(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      console.error(`Error fetching ${url}:`, e);
      return null;
    }
  }
}

// Runnable
if (require.main === module) {
  const crawler = new IntelCrawler();
  crawler.crawl().then(() => {
    console.log("Dumping Map JSON:");
    console.log(
      JSON.stringify(Object.fromEntries(crawler.productMap), null, 2),
    );
  });
}
