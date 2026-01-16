#!/usr/bin/env bun
import { readFileSync, existsSync } from "fs";
import Papa from "papaparse";
import {
  db,
  products,
  prices,
  productIdentifiers,
  NewProduct,
  NewPrice,
} from "../src/db";
import { eq, and } from "drizzle-orm";
import type { CategorySlug } from "../src/lib/categories";

/**
 * Keepa CSV Importer (Universal Version)
 */

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: bun run scripts/import-from-csv.ts <path-to-csv>");
    process.exit(1);
  }

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`📂 Reading CSV: ${filePath}...`);
  const csvData = readFileSync(filePath, "utf-8");

  console.log("Parsing CSV...");
  const results = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const rows = results.data as any[];
  console.log(`✅ Parsed ${rows.length} rows.`);

  let successCount = 0;
  let updateCount = 0;
  let skipCount = 0;

  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      try {
        const asin = row["ASIN"];
        if (!asin) {
          skipCount++;
          continue;
        }

        // 1. Map Category
        const subCategory = row["Categories: Sub"] || "";
        const rootCategory = row["Categories: Root"] || "";
        const categorySlug = mapCategory(rootCategory, subCategory);

        if (!categorySlug) {
          skipCount++;
          continue;
        }

        // 2. Extract Info
        const title = row["Title"] || "";
        if (!title) {
          skipCount++;
          continue;
        }

        const brand = row["Brand"] || "";
        const manufacturer = row["Manufacturer"] || "";
        const description = row["Description & Features: Description"] || "";

        const features = [];
        for (let j = 1; j <= 10; j++) {
          const feat = row[`Description & Features: Feature ${j}`];
          if (feat) features.push(feat);
        }

        const imageList = row["Image"] || "";
        const imageUrl = imageList.split(";")[0] || null;

        const rating = parseFloat(row["Reviews: Rating"]) || null;
        const reviewCount = parseInt(row["Reviews: Rating Count"]) || null;
        const salesRank = parseInt(row["Sales Rank: Current"]) || null;
        const salesRankRef = parseInt(row["Sales Rank: Reference"]) || null;

        const monthlySoldRaw = row["Bought in past month"] || "0";
        const monthlySold =
          typeof monthlySoldRaw === "string"
            ? parseInt(monthlySoldRaw.replace(/[^0-9]/g, ""))
            : typeof monthlySoldRaw === "number"
              ? monthlySoldRaw
              : 0;

        const gtin =
          row["Product Codes: EAN"] ||
          row["Product Codes: UPC"] ||
          row["Product Codes: GTIN"] ||
          null;
        const mpn = row["Product Codes: PartNumber"] || null;

        // --- Specifications Bucket ---
        const specs: Record<string, any> = {};
        const specKeys = [
          "Model",
          "Color",
          "Size",
          "Material",
          "Style",
          "Pattern",
          "Item: Dimension (cm³)",
          "Item: Weight (g)",
          "Package: Dimension (cm³)",
          "Package: Weight (g)",
          "Release Date",
          "Operating System",
          "Hardware Interface",
        ];
        for (const key of specKeys) {
          if (row[key]) specs[key] = row[key];
        }

        // --- Normalization (for filtering) ---
        const capacityValue =
          parseFloat(row["Unit Details: Unit Value"]) || null;
        const capacityUnit = row["Unit Details: Unit Type"] || null;

        const priceAvg30 =
          parseCSVPrice(row["Amazon: 30 days avg."]) ||
          parseCSVPrice(row["New: 30 days avg."]);
        const priceAvg90 =
          parseCSVPrice(row["Amazon: 90 days avg."]) ||
          parseCSVPrice(row["New: 90 days avg."]);

        // 3. Upsert Product
        const productData: NewProduct = {
          asin,
          title,
          brand,
          manufacturer,
          description,
          features: JSON.stringify(features),
          imageUrl,
          rating,
          reviewCount,
          salesRank,
          salesRankReference: salesRankRef,
          monthlySold,
          gtin,
          mpn,
          parentAsin: row["Parent ASIN"] || null,
          variationAttributes: row["Variation Attributes"] || null,
          specifications: JSON.stringify(specs),
          rawData: JSON.stringify(row), // Full backup
          category: categorySlug,
          slug: slugify(`${brand} ${title}`.slice(0, 100) + ` ${asin}`),
          capacity: capacityValue,
          capacityUnit,
          historySeeded: !!(priceAvg30 || priceAvg90), // Mark as seeded if we got averages from CSV
          updatedAt: new Date(),
        };

        const existing = await db.query.products.findFirst({
          where: eq(products.asin, asin),
        });

        let productId: number;
        if (existing) {
          await db
            .update(products)
            .set(productData)
            .where(eq(products.id, existing.id));
          productId = existing.id;
          updateCount++;
        } else {
          const inserted = await db
            .insert(products)
            .values(productData)
            .returning({ id: products.id });
          productId = inserted[0].id;
          successCount++;
        }

        // 4. Update Price
        const amazonPrice = parseCSVPrice(row["Amazon: Current"]);
        const newPrice = parseCSVPrice(row["New: Current"]);
        if (amazonPrice || newPrice) {
          const priceData: NewPrice = {
            productId,
            country: "de",
            currency: "EUR",
            amazonPrice,
            newPrice,
            usedPrice: parseCSVPrice(row["Used: Current"]),
            warehousePrice: parseCSVPrice(row["Warehouse Deals: Current"]),
            listPrice: parseCSVPrice(row["List Price: Current"]),
            source: "keepa",
            lastUpdated: new Date(),
          };

          const existingPrice = await db.query.prices.findFirst({
            where: and(
              eq(prices.productId, productId),
              eq(prices.country, "de"),
            ),
          });

          if (existingPrice) {
            await db
              .update(prices)
              .set({
                ...priceData,
                priceAvg30:
                  parseCSVPrice(row["Amazon: 30 days avg."]) ||
                  parseCSVPrice(row["New: 30 days avg."]),
                priceAvg90:
                  parseCSVPrice(row["Amazon: 90 days avg."]) ||
                  parseCSVPrice(row["New: 90 days avg."]),
              })
              .where(eq(prices.id, existingPrice.id));
          } else {
            await db.insert(prices).values({
              ...priceData,
              priceAvg30:
                parseCSVPrice(row["Amazon: 30 days avg."]) ||
                parseCSVPrice(row["New: 30 days avg."]),
              priceAvg90:
                parseCSVPrice(row["Amazon: 90 days avg."]) ||
                parseCSVPrice(row["New: 90 days avg."]),
            });
          }
        }
      } catch (err) {
        console.error(`❌ Error processing ASIN ${row["ASIN"]}:`, err);
      }
    }

    if ((i + batch.length) % 1000 === 0) {
      console.log(`⏳ Progress: ${i + batch.length}/${rows.length}`);
    }
  }

  console.log(
    `\n✨ Done! Added: ${successCount}, Updated: ${updateCount}, Skipped: ${skipCount}`,
  );
}

function mapCategory(root: string, sub: string): CategorySlug | null {
  const s = sub.toLowerCase();
  if (
    s.includes("normale laptops") ||
    s.includes("notebooks") ||
    s.includes("macbooks")
  )
    return "notebooks";
  if (s.includes("grafikkarten")) return "gpu";
  if (s.includes("prozessoren") || s.includes("cpus")) return "cpu";
  if (s.includes("monitore")) return "monitors";
  if (s.includes("tastaturen")) return "keyboards";
  if (s.includes("mäuse") || s.includes("mice")) return "mice";
  if (s.includes("tablets")) return "tablets";
  if (s.includes("router")) return "routers";
  if (s.includes("3d-drucker") || s.includes("3d-druck")) return "3d-drucker";
  if (s.includes("laser")) return "laserdrucker";
  if (
    s.includes("drucker") ||
    s.includes("inkjet") ||
    s.includes("tintenstrahl") ||
    s.includes("multifunktions") ||
    s.includes("all-in-one")
  )
    return "multifunktionsdrucker";
  if (s.includes("systemkamera")) return "systemkameras";
  if (s.includes("kompaktkamera")) return "kompaktkameras";
  if (s.includes("spiegelreflex")) return "cameras";
  if (s.includes("kamera") || s.includes("camera") || s.includes("photo"))
    return "cameras";
  if (s.includes("handy") || s.includes("smartphone")) return "smartphones";
  if (s.includes("watch") || s.includes("uhr")) return "smartwatches";
  if (s.includes("solid state drives") && !s.includes("extern")) return "ssds";
  if (s.includes("ssd") && !s.includes("extern")) return "ssds";
  if (s.includes("festplatten") && !s.includes("extern")) return "hard-drives";
  if (s.includes("interner speicher") && s.includes("festplatten"))
    return "hard-drives";
  if (
    s.includes("externe datenspeicher") ||
    s.includes("externe festplatten") ||
    s.includes("externe solid state drives") ||
    s.includes("externer speicher")
  )
    return "external-storage";
  if (
    s.includes("headphones") ||
    s.includes("kopfhörer") ||
    s.includes("ohrhörer") ||
    s.includes("headset")
  )
    return "headphones";
  if (s.includes("fernseher") || s.includes("tvs") || s.includes("tv-geräte"))
    return "tvs";
  if (s.includes("arbeitsspeicher") || s.includes("ram")) return "ram";
  if (s.includes("lautsprecher") || s.includes("speakers")) return "speakers";
  if (s.includes("konsolen") || s.includes("consoles")) return "consoles";
  if (root === "Games" || s.startsWith("games")) return "consoles"; // Fallback for games root
  if (s.includes("netzteile") || s.includes("psu")) return "power-supplies";
  if (s.includes("gehäuse") || s.includes("cases")) return "pc-cases";
  if (s.includes("mainboards") || s.includes("motherboards"))
    return "motherboards";
  if (s.includes("lüfter") || s.includes("kühler") || s.includes("coolers"))
    return "cpu-coolers";
  if (s.includes("staubsauger")) return "staubsauger";
  if (s.includes("küchenmaschinen")) return "kuechenmaschinen";
  if (
    s.includes("speicherkarten") ||
    s.includes("micro sd") ||
    s.includes("sdhc") ||
    s.includes("sdxc") ||
    s.includes("memory card") ||
    s.includes("cfexpress") ||
    s.includes("compactflash") ||
    s.includes("compact flash") ||
    s.includes("securedigital") ||
    s.includes("sd card") ||
    s.includes("sd-karte")
  )
    return "speicherkarten";
  if (root.includes("Computer") || s.includes("computer")) return "computer";
  return null;
}

function parseCSVPrice(val: any): number | null {
  if (val === null || val === undefined || val === "" || val === "-")
    return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    let cleaned = val.replace(/[^\d,\.]/g, "");
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot)
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    else cleaned = cleaned.replace(/,/g, "");
    const result = parseFloat(cleaned);
    return isNaN(result) ? null : result;
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

main().catch(console.error);
