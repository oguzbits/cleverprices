import https from "https";
import zlib from "zlib";

import { type CategorySlug } from "@/lib/categories";
import { type CountryCode } from "@/lib/countries";

import type { DataSourceProvider, UnifiedProduct } from "./types";

/**
 * ICECAT OPEN DATA SOURCE
 *
 * Access: Free (Registration Required)
 * URL: https://data.icecat.biz/
 * Auth: Basic Auth (username/password)
 *
 * USAGE:
 * The adapter fetches the daily index file, maps EAN/GTIN to Icecat IDs,
 * and then retrieves the full product XML/JSON for enrichment.
 *
 * NOTE: This source is strictly for SPECS enrichment. It does not provide pricing.
 */

// Native Node deps for streaming
// We use regex for XML parsing to keep it lightweight and dependency-minimal for this adapter
// "Robust" parsing would use a real parser, but regex is faster for specific extraction points

const ICECAT_USERNAME = process.env.ICECAT_USERNAME;
const ICECAT_PASSWORD = process.env.ICECAT_PASSWORD;
const INDEX_URL =
  "https://data.icecat.biz/export/freexml/EN/files.index.xml.gz";

import { getSafeDate } from "@/lib/server/deterministic-time";

export class IcecatDataSource implements DataSourceProvider {
  id = "icecat" as const;
  name = "Open Icecat";

  isAvailable(): boolean {
    return Boolean(ICECAT_USERNAME && ICECAT_PASSWORD);
  }

  private getAuthHeader(): string {
    if (!ICECAT_USERNAME || !ICECAT_PASSWORD) return "";
    return (
      "Basic " +
      Buffer.from(`${ICECAT_USERNAME}:${ICECAT_PASSWORD}`).toString("base64")
    );
  }

  /**
   * STREAMING INDEX SEARCH
   * Scans the remote GZIP index for a matching identifier (GTIN or MPN).
   */
  private async findIdByMatch(
    value: string,
    attribute: "EAN_UPC" | "Prod_ID",
  ): Promise<string | null> {
    console.log(`[Icecat] Streaming index to find ${attribute}: ${value}...`);

    return new Promise((resolve, _reject) => {
      const request = https.get(
        INDEX_URL,
        {
          headers: { Authorization: this.getAuthHeader() },
        },
        (response) => {
          if (response.statusCode !== 200) {
            console.error(
              `[Icecat] Index access failed: ${response.statusCode}`,
            );
            resolve(null);
            return;
          }

          const gunzip = zlib.createGunzip();
          response.pipe(gunzip);

          let buffer = "";
          let resolved = false;

          gunzip.on("data", (chunk) => {
            if (resolved) return;
            buffer += chunk.toString();

            if (buffer.length > 1000000) buffer = buffer.slice(-500000);

            // Check for match
            if (buffer.includes(value)) {
              const lines = buffer.split(">");
              for (const line of lines) {
                if (attribute === "EAN_UPC") {
                  if (
                    line.includes(`EAN_UPC="${value}"`) ||
                    line.includes(`EAN_UPC="${value},`) ||
                    line.includes(`,${value}"`)
                  ) {
                    const match = line.match(/Product_ID="(\d+)"/);
                    if (match) {
                      resolved = true;
                      response.destroy();
                      gunzip.destroy();
                      resolve(match[1]);
                      return;
                    }
                  }
                } else if (attribute === "Prod_ID") {
                  // Prod_ID matches exactly or starts with
                  if (line.includes(`Prod_ID="${value}"`)) {
                    const match = line.match(/Product_ID="(\d+)"/);
                    if (match) {
                      resolved = true;
                      response.destroy();
                      gunzip.destroy();
                      resolve(match[1]);
                      return;
                    }
                  }
                }
              }
            }
          });

          gunzip.on("end", () => {
            if (!resolved) resolve(null);
          });

          gunzip.on("error", (_err) => {
            if (!resolved) resolve(null);
          });
        },
      );

      request.on("error", (_err) => resolve(null));
    });
  }

  async findIdByGtin(gtin: string): Promise<string | null> {
    return this.findIdByMatch(gtin, "EAN_UPC");
  }

  async findIdByMpn(mpn: string): Promise<string | null> {
    return this.findIdByMatch(mpn, "Prod_ID");
  }

  /**
   * FETCH & PARSE XML
   */
  private async fetchProductXml(id: string): Promise<UnifiedProduct | null> {
    const url = `https://data.icecat.biz/xml_s3/xml_server3.cgi?product_id=${id};lang=de;output=productxml`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: this.getAuthHeader() },
      });

      if (!res.ok) return null;
      const xml = await res.text();

      // Basic Regex Extraction for Title & Brand
      const titleMatch = xml.match(/Product Name="([^"]+)"/);
      const brandMatch = xml.match(/Supplier Name="([^"]+)"/);
      const descMatch = xml.match(/LongDesc="([^"]+)"/);
      const imgMatch = xml.match(/HighPic="([^"]+)"/);

      const rawTitle = titleMatch ? titleMatch[1] : null;
      // Basic Entity Decode for title
      const title = rawTitle
        ? rawTitle
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
        : null;

      // ROBUST MANUAL PARSING (Parsing without DOM)
      const specs: Record<string, string> = {};

      // Strategy: Split by <ProductFeature ...> tag to isolate each spec block
      const productFeatures = xml.split("<ProductFeature ");

      for (let i = 1; i < productFeatures.length; i++) {
        const block = productFeatures[i];
        // Extract the Value (Presentation_Value)
        // Format: ... Presentation_Value="PCI Express x16 2.0" ...
        const valMatch = block.match(/Presentation_Value="([^"]+)"/);
        if (!valMatch) continue;

        const value = valMatch[1];

        // Extract the Name (Inside nested <Name ... Value="Spec Name">)
        // We search forward until </ProductFeature>
        const endIdx = block.indexOf("</ProductFeature>");
        const innerContent = block.substring(
          0,
          endIdx !== -1 ? endIdx : block.length,
        );

        // Look for <Name ... Value="Spec Name">
        const nameMatch = innerContent.match(/<Name[^>]+Value="([^"]+)"/);

        if (nameMatch) {
          const name = nameMatch[1];
          // Decode XML entities if basic ones exist (simple replace)
          const cleanName = name.replace(/&amp;/g, "&");
          specs[cleanName] = value;
        }
      }

      return {
        id: id,
        title: title || "",
        category: "uncategorized" as CategorySlug, // We'd need to map Icecat CatID to our slug
        imageUrl: imgMatch ? imgMatch[1] : undefined,
        specifications: {
          brand: brandMatch ? brandMatch[1] : undefined,
          description: descMatch ? descMatch[1] : undefined,
          ...specs,
        },
        offers: [],
        bestOffer: undefined,
        lastUpdated: getSafeDate(),
        primarySource: "icecat",
        sources: ["icecat"],
      };
    } catch (e) {
      console.error("Icecat XML fetch error:", e);
      return null;
    }
  }

  /**
   * Fetch by EAN/GTIN (The primary way to match Icecat data)
   */
  async fetchProductByGtin(
    gtin: string,
    _country: CountryCode,
  ): Promise<UnifiedProduct | null> {
    if (!this.isAvailable()) return null;

    const id = await this.findIdByGtin(gtin);
    if (!id) {
      console.log(`[Icecat] GTIN ${gtin} not found in index.`);
      return null;
    }

    console.log(
      `[Icecat] Found ID ${id} for GTIN ${gtin}. Fetching details...`,
    );
    return this.fetchProductXml(id);
  }

  // Required by interface but not primary use case for Icecat
  async fetchProducts(
    _category: CategorySlug,
    _country: CountryCode,
  ): Promise<UnifiedProduct[]> {
    return [];
  }

  async fetchProduct(
    id: string,
    _country: CountryCode,
  ): Promise<UnifiedProduct | null> {
    return this.fetchProductXml(id);
  }

  async searchProducts(
    _query: string,
    _country: CountryCode,
  ): Promise<UnifiedProduct[]> {
    return [];
  }
}

export const icecatDataSource = new IcecatDataSource();
