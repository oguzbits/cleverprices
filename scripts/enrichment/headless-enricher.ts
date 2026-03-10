import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { type Page } from "playwright";
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

    const skipAlternate = args.some((a) => a === "--skip-alternate");

    console.log(
      `🚀 Starting Stealth Enrichment (Concurrency: ${this.concurrency}, Limit: ${limit}, Target ID: ${targetId || "none"}, Categories: ${categoryArg || "all"}, Skip Alternate: ${skipAlternate})...`,
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

    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      headless: true,
      channel: "chrome", // Try to use installed Chrome
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

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
            await this.enrichProduct(page, product, skipAlternate);
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
    await page.setExtraHTTPHeaders({
      "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    });
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

  private async enrichProduct(
    page: Page,
    product: any,
    skipAlternate: boolean,
  ) {
    console.log(
      `\n🔍 [ID: ${product.id}] ${product.title.substring(0, 50)}...`,
    );
    let specs: Record<string, any> | null = null;
    let source = "";

    // 1. Try Galaxus First (BEST Source: Unblocked + High Density)
    try {
      specs = await this.scrapeGalaxus(page, product);
      if (specs) source = "galaxus";
    } catch (e: any) {
      console.error(`   ⚠️ Galaxus Error: ${e.message}`);
    }

    // 2. Try Cyberport Second
    if (!specs) {
      try {
        specs = await this.scrapeCyberport(page, product);
        if (specs) source = "cyberport";
      } catch (e: any) {
        // console.error(`   ⚠️ Cyberport Error: ${e.message}`);
      }
    }

    // 3. Try Alternate as Fallback if not skipped
    if (!specs && !skipAlternate) {
      try {
        specs = await this.scrapeAlternate(page, product);
        if (specs) source = "alternate";
      } catch (e: any) {
        // console.error(`   ⚠️ Alternate Error: ${e.message}`);
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
            lastEnrichedAt: new Date(),
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
    const gtinListRaw = (product.gtin || "")
      .split(",")
      .map((s: string) => s.trim());
    const gtinList = gtinListRaw.map((s: string) => s.replace(/^0+/, ""));
    const firstGtin = gtinList[0] || "";
    const firstGtinRaw = gtinListRaw[0] || "";
    const firstGtinPadded =
      firstGtinRaw.length === 12 ? "0" + firstGtinRaw : firstGtinRaw;

    // Clean model for search
    const cleanModel = identity.model
      .replace(/Smartphone|Handy|Tablet|Laptop|Notebook|Prozessor/gi, "")
      .trim();

    const queries = [
      firstGtinPadded,
      firstGtinRaw,
      `${product.brand || ""} ${cleanModel}`,
    ].filter((q) => q && q.length > 5);

    // Remove duplicates
    const finalQueries = [...new Set(queries)];

    for (const q of finalQueries) {
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
        let pageTitle = await page.title();
        if (
          pageTitle === "Alternate.de - Robot Check" ||
          pageTitle === "Nur einen Moment..."
        ) {
          console.log(
            `   🚫 Alternate BOT/Cloudflare Block (Title: ${pageTitle}).`,
          );
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

                // Post-click BOT check
                pageTitle = await page.title();
                if (
                  pageTitle === "Alternate.de - Robot Check" ||
                  pageTitle.includes("Moment") ||
                  pageTitle.includes("Sicherheits")
                ) {
                  console.log(
                    `   🚫 Alternate BOT/Cloudflare Block on PDP (Title: ${pageTitle}).`,
                  );
                  return null;
                }

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

  private async scrapeGalaxus(
    page: Page,
    product: any,
  ): Promise<Record<string, any> | null> {
    const rawGtin = (product.gtin || "").split(",")[0].trim();
    const gtin = rawGtin.length === 12 ? "0" + rawGtin : rawGtin;

    const identity = getProductIdentity(product);
    const queries = [gtin, `${product.brand || ""} ${identity.model}`].filter(
      (q) => q && q.length > 3,
    );

    for (const q of queries) {
      console.log(`   🔎 Galaxus: Querying "${q}"`);
      try {
        await page.goto(
          `https://www.galaxus.de/de/search?q=${encodeURIComponent(q)}`,
          {
            timeout: 30000,
            waitUntil: "networkidle",
          },
        );
        console.log(`   📄 Galaxus Title: "${await page.title()}"`);
        await this.handleCookies(page);

        const isPDP =
          (await page.locator('[data-test="addToCartButton"]').count()) > 0;

        if (!isPDP) {
          // Wait longer for results to render
          await page.waitForTimeout(5000);
          // Galaxus search results use a grid or list.
          const results = page.locator(
            'a[data-test="product-card-link"], [data-test="product-grid"] a, article a[href*="/product/"], a[href*="/s1/product/"]',
          );
          if ((await results.count()) > 0) {
            console.log(`   🔗 Galaxus: Opening first search result`);
            await results.first().click({ force: true });
            await page.waitForLoadState("domcontentloaded");
            await this.handleCookies(page);
          } else {
            console.log(`   ⚠️ Galaxus: No results for "${q}"`);
            continue;
          }
        }

        // Metadata GTIN verify (Safety)
        const gtinMatch = await page.evaluate((targetGtin) => {
          const scripts = Array.from(
            document.querySelectorAll('script[type="application/ld+json"]'),
          );
          for (const s of scripts) {
            try {
              const json = JSON.parse(s.textContent || "");
              if (
                json.gtin13 === targetGtin ||
                json.gtin12 === targetGtin ||
                json.gtin === targetGtin
              )
                return true;
            } catch {}
          }
          return false;
        }, gtin);

        if (!gtinMatch && gtin) {
          console.log(
            `   ⏭️ Galaxus: GTIN mismatch in metadata. Proceeding cautiously.`,
          );
        }

        // 3. Extract specs
        return await this.extractGalaxusDOM(page);
      } catch (e: any) {
        console.error(`   ⚠️ Galaxus Error: ${e.message}`);
      }
    }
    return null;
  }

  private async extractGalaxusDOM(
    page: Page,
  ): Promise<Record<string, string> | null> {
    // Expand technical data if button exists
    const expandBtn = page.locator(
      '[data-test="showMoreButton-specifications"], button:has-text("Mehr anzeigen")',
    );
    if ((await expandBtn.count()) > 0) {
      await expandBtn
        .first()
        .click({ force: true })
        .catch(() => {});
      await page.waitForTimeout(1000); // Wait for expansion
    }

    return await page.evaluate((fieldMap) => {
      const specs: Record<string, string> = {};
      // Galaxus uses a table structure in their "Eigenschaften" section
      const rows = Array.from(document.querySelectorAll("tr"));
      rows.forEach((row) => {
        const td = Array.from(row.querySelectorAll("td"));
        if (td.length >= 2) {
          const label = td[0].textContent?.trim().replace(/i$/, "") || "";
          const value = td[1].textContent?.trim();
          if (label && value) {
            const internalKey = (fieldMap as any)[label] || label;
            // Prevent taking long descriptions
            if (value.length > 200) return;
            specs[internalKey] = value;
          }
        }
      });
      return Object.keys(specs).length > 5 ? specs : null;
    }, RETAILER_FIELD_MAP);
  }

  private async scrapeCyberport(
    page: Page,
    product: any,
  ): Promise<Record<string, any> | null> {
    const rawGtin = (product.gtin || "").split(",")[0].trim();
    // Padding 12 to 13 digits for search accuracy
    const gtin = rawGtin.length === 12 ? "0" + rawGtin : rawGtin;
    const identity = getProductIdentity(product);

    const queries = [gtin, `${product.brand || ""} ${identity.model}`].filter(
      (q) => q && q.length > 5,
    );

    for (const q of queries) {
      console.log(`   🔎 Cyberport: Querying "${q}"`);
      try {
        await page.goto(
          `https://www.cyberport.de/search?q=${encodeURIComponent(q)}`,
          {
            waitUntil: "domcontentloaded",
            timeout: 10000,
          },
        );
        await this.handleCookies(page);
        await page.waitForTimeout(1000); // Wait for potential title update/redirect

        const pageTitle = await page.title();
        console.log(`   📄 Cyberport Title: "${pageTitle}"`);
        if (
          !pageTitle ||
          pageTitle.toLowerCase().includes("blocked") ||
          pageTitle.includes("Nur einen Moment") ||
          pageTitle.includes("Access Denied") ||
          pageTitle.includes("Sicherheits")
        ) {
          console.log(
            `   🚫 Cyberport BOT/Cloudflare Block (Title: ${pageTitle || "EMPTY"}).`,
          );
          continue; // Try next query or give up
        }

        // Check if direct product page
        const hasTechnicalData =
          (await page.locator(".box-technical-data").count()) > 0;

        if (hasTechnicalData) {
          return await this.extractCyberportDOM(page);
        }

        // Check for search result (GTIN should ideally lead to 1 product)
        const firstResult = page.locator(
          "a.product-image[data-product-id], a.productBox",
        );
        if ((await firstResult.count()) > 0) {
          console.log(`   🔗 Cyberport: Opening first search result`);
          await firstResult.first().click({ force: true });
          await page.waitForLoadState("domcontentloaded");
          await this.handleCookies(page);
          return await this.extractCyberportDOM(page);
        }
      } catch (e: any) {
        // console.error(`   ⚠️ Cyberport Error: ${e.message}`);
      }
    }
    return null;
  }

  private async extractCyberportDOM(
    page: Page,
  ): Promise<Record<string, string> | null> {
    return await page.evaluate((fieldMap) => {
      const specs: Record<string, string> = {};
      const rows = document.querySelectorAll(".box-technical-data table tr");

      rows.forEach((row) => {
        const label = row.querySelector("td.label")?.textContent?.trim();
        const value = row.querySelector("td.value")?.textContent?.trim();

        if (label && value) {
          const internalKey = (fieldMap as any)[label] || label;
          specs[internalKey] = value;
        }
      });

      return Object.keys(specs).length > 0 ? specs : null;
    }, RETAILER_FIELD_MAP);
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
