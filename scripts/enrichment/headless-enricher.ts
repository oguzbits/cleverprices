import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { chromium, type Page } from "playwright";
import { db, products } from "../../src/db";
import { getProductIdentity } from "../../src/lib/utils/product-identity";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";
import { RETAILER_FIELD_MAP } from "./retailer-mapper";

/**
 * 🕵️‍♂️ STEALTH SOPHISTICATED ENRICHER
 * Advanced anti-detection, concurrency, and structured data sniffing.
 */
class SophisticatedEnricher {
  private concurrency = 4; // Parallel processing threads

  async run() {
    const args = process.argv.slice(2);
    const limitArg = args.find((a) => !a.startsWith("-")) || "10";
    const limit = parseInt(limitArg) || 10;
    const targetId = args.find((a) => a.startsWith("--id="))?.split("=")[1];
    const categoryArg = args
      .find((a) => a.startsWith("--category="))
      ?.split("=")[1];
    const categoryList = categoryArg ? categoryArg.split(",") : null;

    console.log(
      `🚀 Starting Stealth Enrichment (Concurrency: ${this.concurrency}, Limit: ${limit}, Target ID: ${targetId || "none"}, Categories: ${categoryArg || "all"})...`,
    );

    const candidates = await db
      .select({
        id: products.id,
        title: products.title,
        gtin: products.gtin,
        category: products.category,
        brand: products.brand,
        enrichmentStatus: products.enrichmentStatus,
        lastEnrichedAt: products.lastEnrichedAt,
        officialSpecifications: products.officialSpecifications,
      })
      .from(products)
      .where(
        targetId
          ? eq(products.id, parseInt(targetId))
          : and(
              isNotNull(products.gtin),
              inArray(products.enrichmentStatus, [
                "pending",
                "not_found",
                "processed",
                "scavenged",
              ]),
              categoryList
                ? inArray(products.category, categoryList)
                : undefined,
            ),
      )
      .orderBy(asc(products.lastEnrichedAt))
      .limit(5000);

    const targets = candidates
      .filter((p) => {
        if (targetId) return true;
        const lowerTitle = p.title.toLowerCase();
        if (
          lowerTitle.includes("generalüberholt") ||
          lowerTitle.includes("refurbished")
        )
          return false;
        if (
          p.enrichmentStatus === "pending" ||
          p.enrichmentStatus === "not_found"
        )
          return true;
        if (!p.officialSpecifications) return true;
        try {
          return (
            Object.keys(JSON.parse(p.officialSpecifications as string)).length <
            20
          );
        } catch (e) {
          return true;
        }
      })
      .slice(0, limit);

    if (targets.length === 0) return console.log("✅ No targets found.");
    console.log(`📋 Processing ${targets.length} targets.`);

    const browser = await chromium.launch({ headless: true });

    for (let i = 0; i < targets.length; i += this.concurrency) {
      const chunk = targets.slice(i, i + this.concurrency);
      await Promise.all(
        chunk.map(async (product) => {
          const context = await browser.newContext({
            userAgent:
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            viewport: { width: 1440, height: 900 },
          });
          const page = await context.newPage();
          await this.applyStealth(page);
          try {
            await this.enrichProduct(page, product);
          } catch (err) {
            console.error(`❌ Thread Error [ID: ${product.id}]:`, err);
          } finally {
            await context.close();
          }
        }),
      );
      if (i + this.concurrency < targets.length) {
        await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
      }
    }
    await browser.close();
    console.log("🏁 Enrichment Cycle Complete.");
  }

  private async applyStealth(page: Page) {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      // @ts-ignore
      window.chrome = { runtime: {} };
      // @ts-ignore
      const originalQuery = window.navigator.permissions.query;
      // @ts-ignore
      window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission } as any)
          : originalQuery(parameters);
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
    });
  }

  private async enrichProduct(page: Page, product: any) {
    console.log(
      `\n🔍 [ID: ${product.id}] ${product.title.substring(0, 50)}...`,
    );
    let specs: Record<string, any> | null = null;
    let source = "";

    try {
      specs = await this.scrapeAlternate(page, product);
      if (specs) source = "alternate";
    } catch (e: any) {
      console.error(`   ⚠️ Alternate Error: ${e.message}`);
    }

    if (!specs) {
      try {
        specs = await this.scrapeCyberport(page, product);
        if (specs) source = "cyberport";
      } catch (e: any) {
        // console.error(`   ⚠️ Cyberport Error: ${e.message}`);
      }
    }

    if (specs) {
      const identity = getProductIdentity(product);
      const sanitized = sanitizeSpecs(specs, {
        title: product.title,
        brand: product.brand || "",
        model: identity.model,
      });

      if (Object.keys(sanitized).length >= 4) {
        console.log(
          `   ✅ Success! [${source}] Specs: ${Object.keys(sanitized).length}`,
        );
        await db
          .update(products)
          .set({
            officialSpecifications: JSON.stringify(sanitized),
            enrichmentStatus: "scavenged",
            specificationsSource: source,
            lastEnrichedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      } else {
        console.log(
          `   ⚠️ Partial match on ${source} (${Object.keys(sanitized).length} specs).`,
        );
        await db
          .update(products)
          .set({
            lastEnrichedAt: new Date(), // touch to prevent immediate re-processing
          })
          .where(eq(products.id, product.id));
      }
    } else {
      console.log(`   ❌ No match on retailers.`);
      await db
        .update(products)
        .set({
          enrichmentStatus: "not_found",
          lastEnrichedAt: new Date(),
        })
        .where(eq(products.id, product.id));
    }
  }

  private async scrapeAlternate(
    page: Page,
    product: any,
  ): Promise<Record<string, any> | null> {
    const identity = getProductIdentity(product);
    const gtinList = (product.gtin || "")
      .split(",")
      .map((s: string) => s.trim().replace(/^0+/, ""));
    const firstGtin = gtinList[0] || "";

    // Clean model for search
    const cleanModel = identity.model
      .replace(/Smartphone|Handy|Tablet|Laptop|Notebook|Prozessor/gi, "")
      .trim();
    const queries = [firstGtin, `${product.brand || ""} ${cleanModel}`].filter(
      (q) => q && q.length > 5,
    );

    for (const q of queries) {
      try {
        console.log(`   🔎 Alternate: Querying "${q}"`);
        await page.goto(
          `https://www.alternate.de/listing.xhtml?q=${encodeURIComponent(q)}`,
          {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          },
        );
        await this.handleCookies(page);

        // Anti-bot check
        if ((await page.title()) === "Alternate.de - Robot Check") {
          console.log("   🚫 Alternate BOT Block.");
          return null;
        }

        const isDetails =
          (await page
            .locator("#details, #product-details-tab, h1#product-name")
            .count()) > 0;

        if (isDetails) {
          const tableData = await this.extractTableData(page);
          if (tableData) {
            let foundGtin = "";
            const gtinKeys = [
              "gtin",
              "EAN",
              "ean",
              "Identifier - EAN",
              "EAN - EAN",
            ];
            for (const k of gtinKeys) {
              if (tableData[k]) {
                foundGtin = String(tableData[k])
                  .replace(/\s/g, "")
                  .trim()
                  .replace(/^0+/, "");
                break;
              }
            }

            const pageH1 = (
              (await page.locator("h1").first().innerText()) || ""
            ).toLowerCase();
            const brandMatch =
              !product.brand || pageH1.includes(product.brand.toLowerCase());

            if (
              brandMatch &&
              (!foundGtin ||
                gtinList.includes(foundGtin) ||
                foundGtin === firstGtin)
            ) {
              return tableData;
            } else {
              console.log(
                `   ❌ Alternate: Direct mismatch (GTIN: ${foundGtin})`,
              );
            }
          }
        } else {
          const results = page.locator(
            'div.listing-item a.productBox, div.listing a[href*="/product/"], a.productBox, div.listing-item h2.title',
          );
          const count = await results.count();
          const scanLimit = Math.min(count, 5);

          for (let r = 0; r < scanLimit; r++) {
            try {
              const res = results.nth(r);
              const linkTitle = (await res.innerText()).toLowerCase();

              const brandMatch =
                !product.brand ||
                linkTitle.includes(product.brand.toLowerCase());
              const modeWords = identity.model
                .toLowerCase()
                .split(" ")
                .filter((w) => w.length > 2);
              const modelMatch =
                modeWords.some((w) => linkTitle.includes(w)) ||
                linkTitle.includes(identity.model.toLowerCase());

              if (brandMatch && (modelMatch || gtinList.length > 0)) {
                // Accessory guard
                if (
                  product.category === "smartphones" &&
                  (linkTitle.includes("hülle") ||
                    linkTitle.includes("case") ||
                    linkTitle.includes("panzerglas") ||
                    linkTitle.includes("folie"))
                ) {
                  continue;
                }

                console.log(`   🔗 Alternate: Opening result ${r + 1}`);
                await res.click({ force: true });
                await page.waitForLoadState("domcontentloaded");
                await this.handleCookies(page);

                const tableData = await this.extractTableData(page);
                if (tableData) {
                  let foundGtin = "";
                  const gtinKeys = [
                    "gtin",
                    "EAN",
                    "ean",
                    "Identifier - EAN",
                    "EAN - EAN",
                  ];
                  for (const k of gtinKeys) {
                    if (tableData[k]) {
                      foundGtin = String(tableData[k])
                        .replace(/\s/g, "")
                        .trim()
                        .replace(/^0+/, "");
                      break;
                    }
                  }

                  if (foundGtin && !gtinList.includes(foundGtin)) {
                    console.log(
                      `   ⏭️ Alternate: Result ${r + 1} GTIN mismatch (${foundGtin})`,
                    );
                    await page.goBack();
                    continue;
                  }
                  return tableData;
                }
                await page.goBack();
              }
            } catch (e) {
              await page.goBack().catch(() => {});
              continue;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  private async scrapeCyberport(
    page: Page,
    product: any,
  ): Promise<Record<string, any> | null> {
    const gtin = product.gtin.split(",")[0].trim();
    console.log(`   🔎 Cyberport: Querying "${gtin}"`);
    try {
      await page.goto(`https://www.cyberport.de/search?q=${gtin}`, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
      const nextData = await page.evaluate(() => {
        const script = document.getElementById("__NEXT_DATA__");
        if (!script) return null;
        try {
          const json = JSON.parse(script.textContent || "");
          const p =
            json.props?.pageProps?.searchResult?.products?.[0] ||
            json.props?.pageProps?.product;
          if (p && p.attributes) return p;
          return null;
        } catch {
          return null;
        }
      });
      if (nextData && nextData.attributes) {
        const specs: Record<string, string> = {};
        nextData.attributes.forEach((attr: any) => {
          const internalKey = RETAILER_FIELD_MAP[attr.name] || attr.name;
          specs[internalKey] = attr.value;
        });
        return specs;
      }
    } catch (e) {}
    return null;
  }

  private async extractTableData(
    page: Page,
  ): Promise<Record<string, string> | null> {
    // Small delay to let tables render if client-side
    await page.waitForTimeout(500);
    return await page.evaluate((fieldMap: any) => {
      const data: Record<string, string> = {};
      const tables = document.querySelectorAll(
        "#product-details-tab table, #details table, table.techSpec, table.product-spec-table",
      );
      if (tables.length === 0) return null;
      tables.forEach((table) => {
        let stickyGroup = "";
        table.querySelectorAll("tr").forEach((row) => {
          const c1 = row.querySelector(".c1")?.textContent?.trim() || "";
          if (c1) stickyGroup = c1;
          const c2 = row.querySelector(".c2")?.textContent?.trim() || "";
          const c3 = row.querySelector(".c3")?.textContent?.trim() || "";
          const c4 = row.querySelector(".c4")?.textContent?.trim() || "";
          if (c4) {
            const keyParts = [stickyGroup, c2, c3].filter(Boolean);
            const uniqueParts: string[] = [];
            for (const part of keyParts) {
              if (
                uniqueParts.length === 0 ||
                part !== uniqueParts[uniqueParts.length - 1]
              ) {
                uniqueParts.push(part);
              }
            }
            const fullKey = uniqueParts.join(" - ");
            const internalKey =
              fieldMap[fullKey] ||
              fieldMap[c2] ||
              fieldMap[stickyGroup] ||
              fullKey;
            if (data[internalKey]) {
              if (!String(data[internalKey]).includes(c4))
                data[internalKey] += `; ${c4}`;
            } else {
              data[internalKey] = c4;
            }
          }
        });
      });
      return Object.keys(data).length > 0 ? data : null;
    }, RETAILER_FIELD_MAP);
  }

  private async handleCookies(page: Page) {
    await page
      .evaluate(() => {
        document
          .querySelectorAll(
            "#usercentrics-root, #usercentrics-cmp-ui, .usercentrics-overlay, .uc-backdrop, #consent_blackbox",
          )
          .forEach((el) => ((el as HTMLElement).style.display = "none"));
        document.body.style.overflow = "auto";
      })
      .catch(() => {});
  }
}

new SophisticatedEnricher().run().catch(console.error);
