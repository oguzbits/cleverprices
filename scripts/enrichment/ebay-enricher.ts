import { and, eq, isNotNull, like, not, or } from "drizzle-orm";
import { db, products } from "../../src/db";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";
import { EBAY_FIELD_MAP, normalizeEbayValue } from "./ebay-mapper";

/**
 * eBay Browse API Enricher
 * Uses EBAY_CLIENT_ID and EBAY_CLIENT_SECRET from environment.
 * Targets products by GTIN (EAN).
 */
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

class RateLimitError extends Error {
  constructor() {
    super("RATE_LIMIT");
  }
}

export class EbayEnricher {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl = "https://api.ebay.com/buy/browse/v1";

  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = process.env.EBAY_APP_ID;
    const clientSecret = process.env.EBAY_CERT_ID;

    if (!clientId || !clientSecret) {
      throw new Error("Missing EBAY_APP_ID or EBAY_CERT_ID in environment");
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    console.log("🔑 Requesting eBay Access Token (PRODUCTION)...");
    const response = await fetch(
      "https://api.ebay.com/identity/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
      },
    );

    const data: any = await response.json();
    if (data.error) {
      throw new Error(
        `eBay Auth Failed: ${data.error_description || data.error}`,
      );
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  async searchByGtin(
    gtin: string,
    title: string,
    mpn?: string | null,
  ): Promise<any> {
    const market = "EBAY_DE";
    const token = await this.getAccessToken();

    // 1. Try EXACT GTIN
    let url = `${this.baseUrl}/item_summary/search?q=${gtin}&limit=5&fieldgroups=ASPECTS,EXTENDED,MATCHING_ITEMS`;
    let response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": market,
      },
    });

    if (response.status === 429) throw new RateLimitError();

    let data = await response.json();
    let best = await this.getBestItemFromSummaries(data.itemSummaries, market);
    if (best) return { ...best, matchType: "gtin" };

    // 2. Try MPN
    if (mpn && mpn.length > 3) {
      console.log(`   🔄 No GTIN match, trying MPN: ${mpn}`);
      const url = `${this.baseUrl}/item_summary/search?q=${encodeURIComponent(mpn)}&limit=3&fieldgroups=ASPECTS,EXTENDED`;
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-EBAY-C-MARKETPLACE-ID": market,
          },
        });
        if (response.status === 429) throw new RateLimitError();
        const data = await response.json();
        const best = await this.getBestItemFromSummaries(
          data.itemSummaries,
          market,
        );
        if (best) {
          if (best.title.toLowerCase().includes(mpn.toLowerCase())) {
            return { ...best, matchType: "mpn" };
          }
        }
      } catch (err) {
        if (err instanceof RateLimitError) throw err;
      }
    }

    // 3. Try GTIN Variations
    let altGtin = "";
    if (gtin.length === 13 && gtin.startsWith("0")) {
      altGtin = gtin.substring(1);
    } else if (gtin.length === 12) {
      altGtin = "0" + gtin;
    }

    if (altGtin) {
      console.log(`   🔄 Trying alternate GTIN: ${altGtin}`);
      const url = `${this.baseUrl}/item_summary/search?q=${altGtin}&limit=3&fieldgroups=ASPECTS,EXTENDED`;
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-EBAY-C-MARKETPLACE-ID": market,
          },
        });
        if (response.status === 429) throw new RateLimitError();
        const data = await response.json();
        const best = await this.getBestItemFromSummaries(
          data.itemSummaries,
          market,
        );
        if (best) return { ...best, matchType: "gtin-alt" };
      } catch (err) {
        if (err instanceof RateLimitError) throw err;
      }
    }

    return null;
  }

  async getBestItemFromSummaries(summaries: any[], mkt: string) {
    if (!summaries || !Array.isArray(summaries)) return null;

    let bestItem: any = null;
    let maxAspects = -1;

    // Pick top 5
    const candidates = summaries.slice(0, 5);

    for (const summary of candidates) {
      // OPTIMIZATION: Check if the summary ALREADY contains aspects (via fieldgroups=ASPECTS)
      // If it has enough aspects (> 5), use it directly to save an API call.
      if (summary.localizedAspects && summary.localizedAspects.length > 5) {
        return summary;
      }

      // Fallback: If no aspects in summary, only THEN get details
      const details = await this.getItemDetails(summary.itemId, mkt);
      if (!details) continue;
      const aspectCount = details.localizedAspects?.length || 0;

      if (aspectCount > maxAspects) {
        maxAspects = aspectCount;
        bestItem = details;
      }

      if (aspectCount > 12) break;
    }

    return bestItem;
  }

  async getItemDetails(itemId: string, mkt = "EBAY_DE") {
    const token = await this.getAccessToken();
    const url = `https://api.ebay.com/buy/browse/v1/item/${itemId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": mkt,
      },
    });

    if (response.status === 429) throw new RateLimitError();

    return await response.json();
  }

  async run(limit = 10) {
    console.log(`🚀 Starting eBay Enrichment (Limit: ${limit})...`);

    const targets = await db
      .select()
      .from(products)
      .where(
        and(
          not(eq(products.enrichmentStatus, "not_found")),
          not(eq(products.enrichmentStatus, "error")),
          or(
            not(eq(products.enrichmentStatus, "processed")),
            like(products.specificationsSource, "variant-sync:%"),
          ),
          or(isNotNull(products.gtin), isNotNull(products.mpn)),
        ),
      )
      .orderBy(products.lastEnrichedAt)
      .limit(limit);

    console.log(`📋 Found ${targets.length} candidates with GTINs/MPNs.`);

    const junkBrands = [
      "jodabook",
      "shinobee",
      "rhino computer",
      "memory pc",
      "agando",
      "vibox",
      "csl",
      "megaport",
      "captiva",
      "systemtreff",
      "ankermann",
      "iclever",
      "dyon",
      "rca",
    ];

    const junkTitlePatterns = [
      /#[0-9]{3,}/, // #7343 SKU style
      /\| RAM: /i,
      /\| SSD: /i,
      /\| Office /i,
      /mit Rucksack/i,
      /Allround.*Notebook/i,
    ];

    const noiseTerms = [
      "hülle",
      "case",
      "cover",
      "folie",
      "kabel",
      "cable",
      "adapter",
      "tasche",
      "bag",
      "schutz",
    ];

    for (const product of targets) {
      // 1. Freshness Check: Skip if already processed by a sync in this run
      const currentStatus = await db
        .select({ status: products.enrichmentStatus })
        .from(products)
        .where(eq(products.id, product.id))
        .get();

      if (currentStatus?.status === "processed") {
        console.log(
          `   ⏭️ Skipping ID ${product.id} (Already enriched by sync)`,
        );
        continue;
      }

      // 2. Junk / Generic Filter (Enrichment Waste Prevention)
      const brand = product.brand?.toLowerCase() || "";
      const isJunkBrand = junkBrands.some((b) => brand.includes(b));
      const hasJunkPattern = junkTitlePatterns.some((p) =>
        p.test(product.title),
      );

      if (isJunkBrand || hasJunkPattern) {
        console.log(
          `   ⏩ Skipping generic/assembled product (Waste prevention): ${product.title}`,
        );
        await db
          .update(products)
          .set({ enrichmentStatus: "not_found", lastEnrichedAt: new Date() })
          .where(eq(products.id, product.id));
        continue;
      }

      // 3. Noise Filter (Pre-check for accessories)
      const lowTitle = product.title.toLowerCase();
      if (
        noiseTerms.some((term) => lowTitle.includes(term)) &&
        (product.category === "smartphones" || product.category === "laptops")
      ) {
        console.log(
          `   ⏩ Skipping noise product (No API call): ${product.title}`,
        );
        await db
          .update(products)
          .set({ enrichmentStatus: "not_found", lastEnrichedAt: new Date() })
          .where(eq(products.id, product.id));
        continue;
      }

      await sleep(1000); // Respectful 1s delay
      try {
        console.log(
          `🔍 Checking eBay for: ${product.title} (${[product.gtin, product.asin, product.mpn].filter(Boolean).join(", ")})`,
        );

        let ebayData: any = null;

        // 2. GTIN Handling (Normalize UPC to EAN if needed)
        let gtin = product.gtin;
        if (gtin && gtin.length === 12) gtin = "0" + gtin;

        if (gtin) {
          ebayData = await this.searchByGtin(gtin, product.title, product.mpn);
        }

        // 2. Fallback: Keyword Search (Waterfall Strategy)
        if (!ebayData) {
          console.log("   🔄 No GTIN match, trying keyword search...");

          const cleanTitle = (t: string) =>
            t
              .replace(/[®™©*]/g, "")
              .replace(/[()|,"+]/g, " ")
              .replace(/\d+(\.\d+)?\s*(MB\/s|GB\/s|MBps|GBps)/gi, "")
              .replace(/\b\d+(GB|TB|MB|MHz|GHz|Hz|W|Wh|mAh)\b/gi, "")
              .replace(
                /\b(Grafikkarte|Grafik|Smartphone|Handy|Drucker|Kühler|Motherboard|Mainboard|Notebook|Laptop|Tablet|SSD|HDD|Prozessor|CPU|Retail|OC|V2|LHR|Rev\.|Gen\.|Generation|Edition|Gaming|DDR6|GDDR6|DDR5|GDDR5|GB|TB|MB|Generalüberholt|Renewed|Refurbished|Zustand|Gut|Sehr|Wie|Neu|OVP|Ohne|Simlock|Netlock|Vertrag|Brandneu|WIE NEU|TOP ZUSTAND)\b/gi,
                "",
              )
              .replace(/\s+/g, " ")
              .trim();

          const modelSuffixes = [
            "pro",
            "plus",
            "max",
            "ultra",
            "air",
            "mini",
            "ti",
            "super",
            "xt",
            "xtx",
            "elite",
            "probook",
            "elitebook",
            "thinkpad",
          ];

          const validateMatch = (original: string, found: string): boolean => {
            const o = original.toLowerCase();
            const f = found.toLowerCase();
            // Critical check: If original has a suffix, found MUST have it too
            for (const suffix of modelSuffixes) {
              if (o.includes(` ${suffix}`) && !f.includes(` ${suffix}`)) {
                return false;
              }
              // Vice versa: if found has it but original doesn't
              if (f.includes(` ${suffix}`) && !o.includes(` ${suffix}`)) {
                return false;
              }
            }
            return true;
          };

          const words = product.title
            .replace(/[()|,"+]/g, " ")
            .split(/\s+/)
            .filter(Boolean);

          const attempts = [
            // Attempt 1: Just first 8 words (usually enough for full model + variant)
            words.slice(0, 8).join(" "),
            // Attempt 2: Cleaned title
            cleanTitle(product.title).split(/\s+/).slice(0, 6).join(" "),
            // Attempt 3: Brand + First 2 words of remainder
            product.brand && words.length > 2
              ? `${product.brand} ${words
                  .filter(
                    (w) => w.toLowerCase() !== product.brand?.toLowerCase(),
                  )
                  .slice(0, 3)
                  .join(" ")}`
              : "",
          ].filter((a) => a && a.length > 5);

          for (const q of [...new Set(attempts)]) {
            console.log(`      🧪 Trying query: "${q}"`);
            const potentialMatch = await this.searchByKeywords(q);
            if (potentialMatch && potentialMatch.localizedAspects) {
              if (validateMatch(product.title, potentialMatch.title)) {
                ebayData = potentialMatch;
                ebayData.isSearchMatch = true;
                break;
              } else {
                console.log(
                  `      ⚠️ Rejecting mismatch: "${potentialMatch.title}"`,
                );
              }
            }
          }
        }

        if (!ebayData || !ebayData.localizedAspects) {
          console.log("❌ No specs found on eBay.");
          const isUpgrade =
            product.specificationsSource?.startsWith("variant-sync:");
          await db
            .update(products)
            .set({
              enrichmentStatus: isUpgrade ? "processed" : "not_found",
              lastEnrichedAt: new Date(),
            })
            .where(eq(products.id, product.id));
          continue;
        }

        const rawSpecs: Record<string, string> = {};
        for (const aspect of ebayData.localizedAspects) {
          const cpField = EBAY_FIELD_MAP[aspect.name];
          if (cpField) {
            rawSpecs[cpField] = normalizeEbayValue(aspect.name, aspect.value);
          }
        }

        const sanitized = sanitizeSpecs(rawSpecs, product.brand || undefined);

        if (Object.keys(sanitized).length >= 1) {
          const source = ebayData.isSearchMatch ? "ebay-search" : "ebay";
          console.log(
            `✅ Extracted ${Object.keys(sanitized).length} clean fields from eBay! (${source}): ${Object.keys(sanitized).join(", ")}`,
          );

          // SMART SINKING: Update ALL products with the same GTIN
          const updateData = {
            officialTitle: ebayData.title || product.officialTitle,
            officialSpecifications: JSON.stringify(sanitized),
            ebayRawData: JSON.stringify(ebayData.localizedAspects), // Preserve original eBay data for future mapping
            enrichmentStatus: "processed",
            specificationsSource: source,
            lastEnrichedAt: new Date(),
          };

          if (product.gtin) {
            const syncResult = await db
              .update(products)
              .set(updateData)
              .where(eq(products.gtin, product.gtin));
            console.log(
              `   💎 Smart Sinking: Updated all variants with GTIN ${product.gtin}`,
            );
          } else {
            await db
              .update(products)
              .set(updateData)
              .where(eq(products.id, product.id));
          }
        } else {
          console.log(
            `⚠️ No mapped specs found. Raw eBay labels: ${ebayData.localizedAspects.map((a: any) => a.name).join(", ")}`,
          );
        }
      } catch (e: any) {
        if (e instanceof RateLimitError) {
          console.warn(
            `⛔ Rate Limit Hit for ID ${product.id}. Sleeping 30s...`,
          );
          // Mark as tried to move it to the end of the queue
          await db
            .update(products)
            .set({ lastEnrichedAt: new Date() })
            .where(eq(products.id, product.id));
          await sleep(30000);
          continue; // Skip DB update, keep as pending
        }
        console.error(`❌ Failed ID ${product.id}:`, e.message);
      }
    }
  }

  async searchByKeywords(q: string) {
    const token = await this.getAccessToken();
    const marketplaces = ["EBAY_DE", "EBAY_GB", "EBAY_US"];
    const forbiddenTerms = [
      "case",
      "hülle",
      "tasche",
      "folie",
      "kabel",
      "cable",
      "box only",
      "nur karton",
      "reparatur",
      "defekt",
      "for parts",
    ];

    for (const mkt of marketplaces) {
      const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&limit=5`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": mkt,
        },
      });

      if (response.status === 429) throw new RateLimitError();

      const data: any = await response.json();
      if (data.itemSummaries && data.itemSummaries.length > 0) {
        // Filter out items that contain forbidden terms in title
        const validSummaries = data.itemSummaries.filter((item: any) => {
          const title = item.title.toLowerCase();
          return !forbiddenTerms.some((term) => title.includes(term));
        });

        if (validSummaries.length > 0) {
          const best = await this.getBestItemFromSummaries(
            validSummaries.slice(0, 3), // Scan top 3 valid pieces
            mkt,
          );
          if (
            best &&
            best.localizedAspects &&
            best.localizedAspects.length > 2
          ) {
            return { ...best, isSearchMatch: true };
          }
        }
      }
    }
    return null;
  }
}

// CLI Execution
if (require.main === module) {
  const enricher = new EbayEnricher();
  const limit = parseInt(process.argv[2] || "5");
  enricher.run(limit).catch(console.error);
}
