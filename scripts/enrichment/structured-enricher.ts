import * as cheerio from "cheerio";
import { and, eq, isNull, like, or, sql } from "drizzle-orm";
import { db, products } from "../../src/db";
import { EbayEnricher, RateLimitError } from "./ebay-enricher";
import { EBAY_FIELD_MAP, normalizeEbayValue } from "./ebay-mapper";

/**
 * STRUCTURED DATA ENRICHER (V5.5 - PURE STRUCTURED)
 * -----------------------------------------------
 * A high-performance, scalable specification extractor using ONLY structured sources.
 * NO BRITTLE HTML SCRAPING.
 *
 * STRATEGY CASCADE:
 * 1. Icecat Live API (Primary - JSON)
 * 2. Brand-Specific Direct (JSON/Structured only)
 * 3. eBay Browse API (Localized Aspects JSON)
 * 4. Keepa Features Fallback (Structured)
 */
class StructuredEnricher {
  private USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

  private ebay = new EbayEnricher();

  async run(limit = 10, targetId?: number) {
    if (targetId) {
      console.log(`🎯 Targeting specific Product ID: ${targetId}`);
    } else {
      console.log(
        `📡 Starting Structured Data Enrichment V5.5 (Limit: ${limit})...`,
      );
    }

    const whereClause = targetId
      ? eq(products.id, targetId)
      : and(
          or(
            isNull(products.specificationsSource),
            eq(products.specificationsSource, ""),
            like(products.specificationsSource, "variant-sync:%"),
            eq(products.specificationsSource, "ebay-search"),
            eq(products.specificationsSource, "discovery_waterfall"),
            and(
              eq(products.specificationsSource, "ebay"),
              or(
                sql`length(${products.officialSpecifications}) < 200`,
                // Heal merged keys or marketplace metadata pollution
                sql`${products.officialSpecifications} LIKE '%Farbe Konnektivität%'`,
                sql`${products.officialSpecifications} LIKE '%Artikelzustand%'`,
                sql`${products.officialSpecifications} LIKE '%Rücknahme%'`,
                sql`${products.officialSpecifications} LIKE '%Bestätigter Kauf%'`,
                sql`${products.officialSpecifications} LIKE '%Maßeinheit%'`,
                sql`${products.officialSpecifications} LIKE '%Anbieter%'`,
                sql`${products.officialSpecifications} LIKE '%eBay Product ID%'`,
                sql`${products.officialSpecifications} LIKE '%(e Pid)%'`,
                sql`${products.officialSpecifications} LIKE '%Zustand%'`,
                sql`${products.officialSpecifications} LIKE '%GTIN%'`,
              ),
            ),
          ),
          or(
            sql`length(${products.gtin}) > 5`,
            sql`length(${products.mpn}) > 3`,
            sql`length(${products.title}) > 10`,
          ),
        );

    const targets = await db
      .select({
        id: products.id,
        title: products.title,
        brand: products.brand,
        mpn: products.mpn,
        gtin: products.gtin,
        category: products.category,
        specificationsSource: products.specificationsSource,
        officialSpecifications: products.officialSpecifications,
        keepaFeatures: products.keepaFeatures,
      })
      .from(products)
      .where(whereClause)
      .limit(targetId ? 1 : limit);

    console.log(
      `📋 Found ${targets.length} candidates for structured extraction.`,
    );

    let rateLimitCount = 0;

    for (const product of targets) {
      if (rateLimitCount >= 5) {
        console.error("🛑 Too many rate limits hit. Terminating run.");
        break;
      }
      console.log(`\n🔍 [ID: ${product.id}] ${product.title}`);
      let specs: Record<string, string> | null = null;
      let usedSource = "unknown";

      // Clean GTIN (handles comma separated lists)
      const primaryGtin = (product.gtin || "").split(",")[0].trim();
      const primaryMpn = (product.mpn || "").split(",")[0].trim();

      try {
        // 1. Icecat Live API (GTIN Based)
        if (primaryGtin && primaryGtin.length >= 8) {
          specs = await this.enrichViaIcecatLive(primaryGtin);
          if (specs) usedSource = "icecat";
        }

        // 2. Brand-Specific Direct (MPN Based)
        if (!specs || Object.keys(specs).length < 5) {
          const brand = (product.brand || "").toLowerCase();
          if (brand === "intel" && primaryMpn) {
            specs = await this.enrichFromIntelArk(primaryMpn);
            if (specs && Object.keys(specs).length >= 5)
              usedSource = "intel_ark";
          } else if (brand === "samsung" && primaryMpn) {
            specs = await this.enrichFromSamsung(primaryMpn);
            if (specs && Object.keys(specs).length >= 5)
              usedSource = "samsung_direct";
          } else if (brand === "lenovo" && primaryMpn) {
            specs = await this.enrichFromLenovo(primaryMpn);
            if (specs && Object.keys(specs).length >= 5)
              usedSource = "lenovo_psref";
          } else if (brand === "hp" && primaryMpn) {
            specs = await this.enrichFromHp(primaryMpn);
            if (specs && Object.keys(specs).length >= 5)
              usedSource = "hp_direct";
          }
        }

        // 3. eBay Browse API (Pure JSON Aspects)
        if (!specs || Object.keys(specs).length < 5) {
          console.log(
            `   🌐 Probing eBay Browse API for structured aspects...`,
          );
          const ebayData = product.gtin
            ? await this.ebay.searchByGtin(
                product.gtin,
                product.title,
                product.mpn,
              )
            : await this.ebay.searchByKeywords(product.title);

          if (ebayData && ebayData.localizedAspects) {
            const rawSpecs: Record<string, string> = {};
            for (const aspect of ebayData.localizedAspects) {
              const cpField = EBAY_FIELD_MAP[aspect.name] || aspect.name;
              rawSpecs[cpField] = normalizeEbayValue(aspect.name, aspect.value);
            }
            specs = this.cleanSpecs(rawSpecs);
            usedSource = ebayData.isSearchMatch ? "ebay-search" : "ebay";
          }
        }

        // 4. Keepa Features Fallback
        if (!specs || Object.keys(specs).length < 3) {
          const keepaSpecs = await this.recoverFromKeepa(product);
          if (keepaSpecs) {
            specs = this.cleanSpecs(keepaSpecs);
            usedSource = "keepa";
          }
        }

        if (specs && Object.keys(specs).length >= 3) {
          const oldKeys = product.officialSpecifications
            ? Object.keys(JSON.parse(product.officialSpecifications || "{}"))
                .length
            : 0;
          const newKeys = Object.keys(specs).length;

          const isBetterSource =
            targetId ||
            !product.specificationsSource ||
            product.specificationsSource.includes("variant-sync") ||
            product.specificationsSource === "ebay-search" ||
            product.specificationsSource === "discovery_waterfall" ||
            usedSource === "icecat" ||
            usedSource.includes("direct") ||
            (newKeys > oldKeys * 1.3 && newKeys > 10); // Overwrite if significantly deeper data

          if (isBetterSource) {
            console.log(
              `✅ Success via ${usedSource}! Overwriting ${product.specificationsSource || "empty"} with ${Object.keys(specs).length} specs.`,
            );
            await db
              .update(products)
              .set({
                officialSpecifications: JSON.stringify(specs),
                specificationsSource: usedSource,
                lastEnrichedAt: new Date(),
              })
              .where(eq(products.id, product.id));
            rateLimitCount = 0; // Reset on success
          } else {
            console.log(
              `ℹ️ Improvement found (${Object.keys(specs).length} keys) but existing source ${product.specificationsSource} is trusted. Skipping overwrite.`,
            );
          }
        } else {
          console.log(`❌ No significant structured data found. Marking as not_found.`);
          await db
            .update(products)
            .set({ 
              specificationsSource: "not_found", 
              lastEnrichedAt: new Date() 
            })
            .where(eq(products.id, product.id));
        }
      } catch (e: any) {
        if (e instanceof RateLimitError) {
          rateLimitCount++;
          console.warn(
            `⛔ eBay Rate Limit Hit (${rateLimitCount}/5). Sleeping 60s...`,
          );
          await new Promise((r) => setTimeout(r, 60000));
          continue;
        }
        console.error(`   ❌ Error: ${e.message}`);
      }

      // Add a slight delay to avoid bursting (2-4s)
      await new Promise((r) => setTimeout(r, 2000 + Math.random() * 2000));
    }
  }

  /**
   * ICECAT LIVE API (GTIN)
   */
  private async enrichViaIcecatLive(
    gtin: string,
  ): Promise<Record<string, string> | null> {
    console.log(`   🧊 Querying Icecat Live for GTIN: ${gtin}...`);
    // Using Demo Account endpoint which is public for live widgets
    const url = `https://live.icecat.biz/api/?shopname=openIcecat-live&sId=123&language=de&gtin=${gtin}`;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": this.USER_AGENT },
      });
      if (!res.ok) return null;
      const data = await res.json();

      if (data.data && data.data.Specs && data.data.Specs.length > 0) {
        const specs: Record<string, string> = {};
        data.data.Specs.forEach((s: any) => {
          if (s.Group && s.Group.Name && s.Value && s.Value.RawValue) {
            const key = `${s.Group.Name}: ${s.Name?.Value || ""}`.trim();
            specs[key] = String(s.Value.RawValue);
          } else if (s.Name?.Value && s.Value?.RawValue) {
            specs[s.Name.Value] = String(s.Value.RawValue);
          }
        });
        return this.cleanSpecs(specs);
      }
    } catch (e) {}
    return null;
  }

  /**
   * RECOVER FROM KEEPA (Structured)
   */
  private async recoverFromKeepa(
    product: any,
  ): Promise<Record<string, string> | null> {
    if (product.keepaFeatures) {
      try {
        const kf =
          typeof product.keepaFeatures === "string"
            ? JSON.parse(product.keepaFeatures)
            : product.keepaFeatures;
        if (kf.features && kf.features.length > 0) {
          const specs: Record<string, string> = {};
          kf.features.forEach((f: string) => {
            if (f.includes(":") && f.length < 100) {
              const [k, ...v] = f.split(":");
              specs[k.trim()] = v.join(":").trim();
            }
          });
          if (Object.keys(specs).length >= 3) {
            console.log(
              `      💡 Recovered ${Object.keys(specs).length} specs from Keepa Features.`,
            );
            return specs;
          }
        }
      } catch {}
    }
    return null;
  }

  /**
   * HTML EXTRACTION ENGINE (JSON-LD ONLY)
   */
  private extractFromHtml(
    html: string,
    contextHint = "",
  ): Record<string, string> {
    const $ = cheerio.load(html);
    const specs: Record<string, string> = {};

    // 1. JSON-LD Priority
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).html();
        if (text) this.parseJsonLd(JSON.parse(text), specs);
      } catch (e) {}
    });

    // 2. Brand-Specific Structured Tables (Trusted Only)
    if (
      contextHint === "intel" ||
      contextHint === "lenovo" ||
      contextHint === "hp"
    ) {
      $("tr").each((_, row) => {
        const cols = $(row).find("td, th");
        if (cols.length === 2) {
          const k = $(cols[0]).text().trim().replace(/:$/, "");
          const v = $(cols[1]).text().trim();
          if (k && v && k.length > 1 && k.length < 50 && v.length < 1000)
            specs[k] = v;
        }
      });
    }

    return this.cleanSpecs(specs);
  }

  /**
   * SPECIFICATION CLEANER & BLACKLIST
   */
  private cleanSpecs(specs: Record<string, string>): Record<string, string> {
    const final: Record<string, string> = {};
    const blacklist = new Set([
      "Artikelzustand",
      "Zustand",
      "Rücknahme",
      "Bestätigter Kauf",
      "Garantie",
      "Lieferung",
      "Versand",
      "Zahlung",
      "Maßeinheit",
      "GTIN",
      "UPC",
      "EAN",
      "MPN",
      "ePID",
      "eBay Product ID",
      "(e Pid)",
      "Marke",
      "Brand",
      "Herstellernummer",
      "Unit of Measure",
      "Condition",
      "Anbieter",
      "Verkäufer",
      "Shop",
      "Preis",
      "Gelistet seit",
      "Note",
    ]);

    for (const [k, v] of Object.entries(specs)) {
      const cleanK = k.replace(/&nbsp;/g, " ").trim();
      let cleanV = v.replace(/&nbsp;/g, " ").trim();

      // Skip internal/marketplace meta
      if (blacklist.has(cleanK) || cleanK.length < 2 || cleanK.length > 50)
        continue;

      // Handle the "Maßeinheit: Einheit" case or variants of it
      if (
        cleanK.includes("Maßeinheit") ||
        cleanV.toLowerCase() === "einheit" ||
        cleanV.toLowerCase() === "unit"
      )
        continue;

      // De-duplicate value repeats (e.g. "WeißWeiß" -> "Weiß")
      const half = Math.floor(cleanV.length / 2);
      if (half > 2 && cleanV.substring(0, half) === cleanV.substring(half)) {
        cleanV = cleanV.substring(0, half);
      }

      // Format weights and numbers (0.20000 -> 0.2)
      // Handles both dot and comma as decimal separator
      cleanV = cleanV.replace(/(\d+[\.,]\d*?[1-9])0+(?=\s|[a-zA-Z]|$)/g, "$1");
      cleanV = cleanV.replace(/(\d+)[\.,]0+(?=\s|[a-zA-Z]|$)/g, "$1");

      // Final validation: skip if value is nonsense
      if (
        cleanV.toLowerCase() === "unbekannt" ||
        cleanV.toLowerCase() === "unknown" ||
        cleanV === "-"
      )
        continue;

      if (cleanV.length > 0 && cleanV.length < 1000) {
        final[cleanK] = cleanV;
      }
    }
    return final;
  }

  private parseJsonLd(obj: any, specs: Record<string, string>) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach((o) => this.parseJsonLd(o, specs));
      return;
    }

    // Core Schema.org Product extraction
    const extractKeys = [
      "brand",
      "model",
      "mpn",
      "gtin",
      "color",
      "weight",
      "material",
      "releaseDate",
      "manufacturer",
    ];
    extractKeys.forEach((k) => {
      if (obj[k]) {
        const val =
          typeof obj[k] === "object"
            ? obj[k].name || obj[k].value
            : String(obj[k]);
        if (val && val !== "undefined") specs[k] = val;
      }
    });

    if (obj.additionalProperty && Array.isArray(obj.additionalProperty)) {
      obj.additionalProperty.forEach((p: any) => {
        if (p.name && p.value) specs[p.name] = String(p.value);
      });
    }

    // Traverse deeper
    Object.values(obj).forEach((v) => {
      if (v && typeof v === "object") this.parseJsonLd(v, specs);
    });
  }

  /**
   * DIRECT BRAND STRATEGIES
   */
  private async enrichFromIntelArk(mpn: string) {
    const url = `https://ark.intel.com/content/www/us/en/ark/search.html?_charset_=UTF-8&q=${encodeURIComponent(mpn)}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": this.USER_AGENT },
      });
      if (!res.ok) return {};
      const html = await res.text();
      const $ = cheerio.load(html);
      const specs: Record<string, string> = {};
      $(".spec-section tr").each((_, el) => {
        const k = $(el).find(".label").text().trim();
        const v = $(el).find(".value").text().trim();
        if (k && v) specs[k] = v;
      });
      return specs;
    } catch {
      return {};
    }
  }

  private async enrichFromSamsung(mpn: string) {
    const url = `https://www.samsung.com/de/support/model/${mpn}/`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": this.USER_AGENT },
      });
      return this.extractFromHtml(await res.text(), "samsung");
    } catch {
      return {};
    }
  }

  private async enrichFromLenovo(mpn: string) {
    const url = `https://psref.lenovo.com/Detail/${mpn}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": this.USER_AGENT },
      });
      if (!res.ok) return {};
      const html = await res.text();
      const $ = cheerio.load(html);
      const specs: Record<string, string> = {};
      $(".specification-table tr").each((_, el) => {
        const k = $(el).find(".spec-label").text().trim();
        const v = $(el).find(".spec-value").text().trim();
        if (k && v) specs[k] = v;
      });
      return specs;
    } catch {
      return {};
    }
  }

  private async enrichFromHp(mpn: string) {
    const cleanMpn = mpn.split("#")[0].trim();
    const url = `https://www.hp.com/de-de/shop/product.aspx?pname=${encodeURIComponent(cleanMpn)}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": this.USER_AGENT },
      });
      if (!res.ok) return {};
      return this.extractFromHtml(await res.text(), "hp");
    } catch {
      return {};
    }
  }
}

// EXECUTION
const limit = parseInt(process.argv[2] || "10");
const targetId = process.argv[3] ? parseInt(process.argv[3]) : undefined;
new StructuredEnricher().run(limit, targetId).catch(console.error);
