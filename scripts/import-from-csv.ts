#!/usr/bin/env bun
import { and, eq, sql } from "drizzle-orm";
import { existsSync, readFileSync } from "fs";
import Papa from "papaparse";
import { db, NewPrice, NewProduct, prices, products } from "../src/db";
import type { CategorySlug } from "../src/lib/categories";
import { generateProductSlug } from "../src/lib/utils/slug";

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

        // 2. Extract Info
        const title = row["Title"] || "";
        if (!title) {
          skipCount++;
          continue;
        }

        // 1. Map Category
        const subCategory = row["Categories: Sub"] || "";
        const rootCategory = row["Categories: Root"] || "";
        const treeCategory = row["Categories: Tree"] || "";
        const productType = row["Type"] || ""; // Amazon's official product type
        const categorySlug =
          mapCategory(
            title,
            rootCategory,
            subCategory,
            treeCategory,
            productType,
          ) || "uncategorized";

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

        // Lean schema: no description, features, salesRankReference, rawData
        const productData: NewProduct = {
          asin,
          title,
          brand,
          manufacturer,
          imageUrl,
          rating,
          reviewCount,
          salesRank,
          monthlySold,
          gtin,
          mpn,
          parentAsin: row["Parent ASIN"] || null,
          variationAttributes: row["Variation Attributes"] || null,
          specifications: JSON.stringify(specs),
          category: categorySlug as CategorySlug,
          slug: generateProductSlug(
            title,
            brand,
            asin,
            capacityValue,
            capacityUnit,
          ),
          capacity: capacityValue,
          capacityUnit,
          historySeeded: false,
          updatedAt: new Date(),
        };

        const existing = await db.query.products.findFirst({
          where: eq(products.asin, asin),
        });

        let productId: number;
        if (existing) {
          // Preserve historySeeded status (don't reset to false on CSV import)
          const { historySeeded, ...updateData } = productData;
          await db
            .update(products)
            .set(updateData)
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

        // 4. Update Price (Lean schema: consolidated price column)
        const amazonPrice = parseCSVPrice(row["Amazon: Current"]);
        const newPrice = parseCSVPrice(row["New: Current"]);
        const usedPrice = parseCSVPrice(row["Used: Current"]);
        const buyBoxPrice = parseCSVPrice(row["Buy Box: Current"]);

        // Calculate consolidated "clever" price
        const amz = amazonPrice && amazonPrice > 0 ? amazonPrice : null;
        const mkt = newPrice && newPrice > 0 ? newPrice : null;
        const bBox = buyBoxPrice && buyBoxPrice > 0 ? buyBoxPrice : null;
        const cleverPrice =
          bBox ?? (amz && mkt ? Math.min(amz, mkt) : (amz ?? mkt));

        if (cleverPrice) {
          const priceData: NewPrice = {
            productId,
            country: "de",
            currency: "EUR",
            price: cleverPrice,
            usedPrice,
            priceAvg90:
              parseCSVPrice(row["Amazon: 90 days avg."]) ||
              parseCSVPrice(row["New: 90 days avg."]),
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
                price: cleverPrice,
                usedPrice,
                priceAvg90: priceData.priceAvg90,
                lastUpdated: new Date(),
              })
              .where(eq(prices.id, existingPrice.id));
          } else {
            await db.insert(prices).values(priceData);
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

  // --- ULTIMATE SELF-HEALING: Core recovery in one pass ---
  console.log("\n🩹 Running bulk history recovery for all orphaned records...");
  try {
    const healStart = performance.now();
    // 1. Sync ASIN links
    await db.run(sql`
      UPDATE price_history 
      SET product_id = (SELECT id FROM products WHERE products.asin = price_history.asin)
      WHERE asin IS NOT NULL AND (product_id IS NULL OR product_id NOT IN (SELECT id FROM products))
    `);
    // 2. Sync GTIN links (for non-Amazon sources)
    await db.run(sql`
      UPDATE price_history 
      SET product_id = (SELECT id FROM products WHERE products.gtin = price_history.gtin)
      WHERE gtin IS NOT NULL AND product_id IS NULL
    `);
    const duration = ((performance.now() - healStart) / 1000).toFixed(2);
    console.log(`✅ History recovered and re-linked in ${duration}s.`);
  } catch (e: any) {
    console.warn("⚠️  Bulk recovery had issues:", e.message);
  }
}

function mapCategory(
  title: string,
  root: string,
  sub: string,
  tree: string,
  productType: string,
): CategorySlug | null {
  const s = sub.toLowerCase();
  const t = title.toLowerCase();
  const tr = tree.toLowerCase();

  const pt = productType ? productType.toUpperCase() : "";

  // ============================================================================
  // 0. PRE-FLIGHT CHECKS (Global Exclusions/Redirects)
  // ============================================================================

  // Cables & Adapters (Global check to prevent them landing in device categories)
  if (/\b(kabel|cable|adapter)\b/i.test(t) && !/\b(tv|monitor)\b/i.test(t)) {
    // careful not to catch "TV with cable" but often "USB Cable" is clear
    return "cables";
  }

  // SSD Cases / Enclosures
  if (
    /\b(gehäuse|enclosure|case)\b/i.test(t) &&
    /\b(ssd|festplatte|hdd)\b/i.test(t) &&
    !/\b(pc|computer)\b/i.test(t) // avoid PC cases
  ) {
    return "external-storage";
  }

  // Soundbars (Title override)
  if (/\bsoundbar\b/i.test(t)) return "soundbars";

  // Raspberry Pi Kits (Pollute components, so exclude even if case/set)
  if (/raspberry pi/i.test(t)) {
    return null;
  }

  // Obvious SSDs (Global override for bad Amazon data, e.g. SSDs in Headphones)
  if (
    /\b(ssd|nvme)\b/i.test(t) &&
    /\b(gb|tb|pcie|m\.2)\b/i.test(t) &&
    !/\b(gehäuse|enclosure|case|mount|halterung|adapter|kabel|cable|dock)\b/i.test(
      t,
    )
  ) {
    return "ssds";
  }

  if (root.toLowerCase().includes("software") || s.includes("software"))
    return null;
  if (s.includes("zubehör") && !s.includes("computer & zubehör")) return null;

  // ============================================================================
  // 1. SUBCATEGORY-BASED DETECTION (Highest Priority - Most Specific)
  // ============================================================================
  // Using Amazon's Categories: Sub column for exact match categorization
  const SUB_TO_CATEGORY: Record<string, CategorySlug> = {
    // Storage
    "solid state drives": "ssds",
    "interne ssd": "ssds",
    "externe solid state drives": "external-storage",
    "externe festplatten": "external-storage",
    // "festplatten": "hard-drives", <-- Too generic, often contains SSDs. Fallback to Tree logic.
    "micro sd": "speicherkarten",
    // PC Components
    grafikkarten: "gpu",
    mainboards: "motherboards",
    arbeitsspeicher: "ram",
    prozessoren: "cpu",
    prozessorlüfter: "cpu-coolers",
    "pc-gehäuse": "pc-cases",
    "pc-netzteile": "power-supplies",
    // Peripherals
    monitore: "monitors",
    mäuse: "mice",
    tastaturen: "keyboards",
    "bluetooth-kopfhörer": "headphones",
    "lautsprecher, smart speaker": "speakers",
    // Computers
    "normale laptops": "notebooks",
    tablets: "tablets",
    // Mobile
    "simlockfreie handys": "smartphones",
    smartwatches: "smartwatches",
    // Cameras
    kompaktkameras: "kompaktkameras",
    "kompakte systemkameras": "systemkameras",
    // Printers
    laserdrucker: "laserdrucker",
    "3d-drucker": "3d-drucker",
    "tintenstrahl, tintenstrahldrucker": "multifunktionsdrucker",
    // TV & Networking
    "fernseher, smart-tvs": "tvs",
    router: "routers",
    // Gaming
    konsolen: "consoles",
  };

  // Exact match on subcategory (most reliable)
  if (SUB_TO_CATEGORY[s]) {
    return SUB_TO_CATEGORY[s];
  }

  // ============================================================================
  // 2. TYPE-BASED DETECTION (Amazon's Official Type - Second Priority)
  // ============================================================================
  const TYPE_TO_CATEGORY: Record<string, CategorySlug> = {
    // Storage
    // COMPUTER_DRIVE_OR_STORAGE: "ssds", // Too generic, can be HDD or SSD
    FLASH_MEMORY: "speicherkarten",
    // PC Components
    VIDEO_CARD: "gpu",
    MOTHERBOARD: "motherboards",
    INTERNAL_MEMORY: "ram",
    COMPUTER_PROCESSOR: "cpu",
    ELECTRONIC_COMPONENT_FAN: "cpu-coolers",
    COMPUTER_CHASSIS: "pc-cases",
    SYSTEM_POWER_DEVICE: "power-supplies",
    // Peripherals
    MONITOR: "monitors",
    INPUT_MOUSE: "mice",
    KEYBOARDS: "keyboards",
    HEADPHONES: "headphones",
    // Computers
    NOTEBOOK_COMPUTER: "notebooks",
    TABLET_COMPUTER: "tablets",
    // Mobile
    CELLULAR_PHONE: "smartphones",
    WEARABLE_COMPUTER: "smartwatches",
    // Cameras
    CAMERA_DIGITAL: "cameras",
    // Printers
    PRINTER: "multifunktionsdrucker",
    "3D_PRINTER": "3d-drucker",
    // TV & Networking
    TELEVISION: "tvs",
    NETWORKING_ROUTER: "routers",
    // Gaming
    VIDEO_GAME_CONSOLE: "consoles",
    VIDEO_GAME: "games",
    PHYSICAL_VIDEO_GAME_SOFTWARE: "games",
    DOWNLOADABLE_VIDEO_GAME: "games",
  };

  if (pt && TYPE_TO_CATEGORY[pt]) {
    return TYPE_TO_CATEGORY[pt];
  }

  // ============================================================================
  // 3. TREE-BASED DETECTION (Amazon's Category Hierarchy - Third Priority)
  // ============================================================================
  // Only used when Sub and Type don't provide a match

  // Storage (with title-based safety checks for miscategorization)
  if (tr.includes("solid state drives") || tr.includes("interne ssd"))
    return "ssds";
  if (tr.includes("externe festplatten") || tr.includes("externe ssd"))
    return "external-storage";
  if (
    (tr.includes("interner speicher") && tr.includes("festplatten")) ||
    tr.includes("festplatten - intern")
  ) {
    // Exclude SSDs and SD Cards miscategorized as HDDs
    if (/\b(ssd|nvme)\b/i.test(t)) return "ssds";
    if (/\b(sd|sdxc|sdhc|microsd|microsdxc|microsdhc|uhs)\b/i.test(t))
      return "speicherkarten";
    return "hard-drives";
  }
  if (tr.includes("speicherkarten")) return "speicherkarten";

  // PC Components
  if (tr.includes("grafikkarten")) return "gpu";
  if (tr.includes("mainboards") || tr.includes("motherboards")) {
    if (/raspberry pi/i.test(t)) return null; // Exclude Raspberry Pi
    return "motherboards";
  }
  if (tr.includes("arbeitsspeicher") || tr.includes("ddr-sdram")) return "ram";
  if (tr.includes("prozessoren") || tr.includes("cpus")) return "cpu";
  if (tr.includes("cpu-kühler") || tr.includes("prozessorlüfter"))
    return "cpu-coolers";
  if (tr.includes("pc-gehäuse")) return "pc-cases";
  if (tr.includes("netzteile") && !tr.includes("notebook")) {
    if (/raspberry pi/i.test(t)) return null; // Exclude RPi power supplies
    return "power-supplies";
  }

  // Peripherals
  if (tr.includes("monitore") || tr.includes("computerbildschirme"))
    return "monitors";
  if (tr.includes("mäuse") && !tr.includes("mauspad")) return "mice";
  if (tr.includes("tastaturen")) return "keyboards";
  if (tr.includes("headsets") || tr.includes("kopfhörer")) {
    // VR Headsets (Meta Quest, etc.)
    if (/meta quest|oculus|vr headset|vr-brille/i.test(t)) return "vr-headsets";
    return "headphones";
  }
  if (tr.includes("vr-brillen")) return "vr-headsets";
  if (tr.includes("webcams")) return "webcams";
  if (tr.includes("soundbars")) return "soundbars";
  if (tr.includes("lautsprecher")) return "speakers";
  if (tr.includes("mikrofone")) return "microphones";

  // Computers
  if (
    tr.includes("laptops") ||
    tr.includes("notebooks") ||
    tr.includes("gaming-notebook")
  )
    return "notebooks";
  if (tr.includes("tablets")) return "tablets";

  // Mobile
  if (tr.includes("smartphones") || tr.includes("handys")) return "smartphones";
  if (tr.includes("smartwatches")) return "smartwatches";

  // Cameras
  if (tr.includes("spiegellose systemkameras") || tr.includes("systemkameras"))
    return "systemkameras";
  if (tr.includes("digitalkameras")) return "cameras";
  if (tr.includes("kompaktkameras")) return "kompaktkameras";
  if (tr.includes("drohnen")) return "drones";

  // Printers
  if (tr.includes("3d-drucker")) return "3d-drucker";
  if (tr.includes("laserdrucker")) return "laserdrucker";
  if (tr.includes("multifunktionsgeräte") || tr.includes("tintenstrahldrucker"))
    return "multifunktionsdrucker";

  // TV & Networking
  if (tr.includes("fernseher") || tr.includes("tvs")) return "tvs";
  if (tr.includes("router") || tr.includes("repeater")) return "routers";

  // Gaming
  if (tr.includes("spielekonsolen") || tr.includes("konsolen"))
    return "consoles";
  if (tr.includes("games") || tr.includes("videospiele")) return "games";

  // ============================================================================
  // 4. TITLE-BASED FALLBACK (Last Resort - Only for products with no Sub/Type/Tree)
  // ============================================================================
  // Minimal regex patterns for obvious products that have empty structured data

  // SSD detection (for products with empty Type/Sub)
  if (/\b(ssd|nvme)\b/i.test(t) && /\b(gb|tb|pcie|m\.2)\b/i.test(t)) {
    return "ssds";
  }

  // HDD detection
  if (
    /\b(hdd|festplatte)\b/i.test(t) &&
    /\b(7200|5400|rpm|3\.5|2\.5)\b/i.test(t)
  ) {
    if (/\bextern/i.test(t)) return "external-storage";
    return "hard-drives";
  }

  // Mouse detection (for products in wrong CSV)
  if (
    /\b(mouse|gaming-maus|deathadder|mx master|basilisk)\b/i.test(t) &&
    !t.includes("tastatur")
  ) {
    return "mice";
  }

  // ============================================================================
  // 5. SKIP UNRECOGNIZED (Strict Guard)
  // ============================================================================
  // If there's Tree/Sub/Type data but we didn't match, skip to avoid miscategorization
  if (tr.length > 10 || s.length > 3 || pt.length > 3) {
    return null;
  }

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
main().catch(console.error);
