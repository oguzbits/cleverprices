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
        const categorySlug =
          mapCategory(title, rootCategory, subCategory) || "uncategorized";

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
          historySeeded: false, // CSV averages are not full granular history, always enrich via Keepa
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
                asin,
                gtin,
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
              asin,
              gtin,
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
): CategorySlug | null {
  const s = sub.toLowerCase();
  const t = title.toLowerCase();

  // ============================================================================
  // 1. HELPERS & DEFINITIONS (Defined first so they can cross-reference)
  // ============================================================================

  function isEnclosure(): boolean {
    return (
      (t.includes("gehäuse") ||
        t.includes("enclosure") ||
        t.includes("festplattengehäuse")) &&
      (t.includes("ssd") ||
        t.includes("nvme") ||
        t.includes("m.2") ||
        t.includes("festplatte") ||
        t.includes("sata") ||
        s.includes("festplatten-zubehör"))
    );
  }

  function isAccessory(): boolean {
    const accKeywords = [
      "hülle",
      "tasche",
      "bag",
      "cover",
      "skin",
      "mounting",
      "bracket",
      "kabel",
      "cable",
      "adapter",
      "charger",
      "ladegerät",
      "folie",
      "protector",
      "docking",
      "hub",
      "ständer",
      "stand",
      "halterung",
      "mount",
      "ersatz",
      "replacement",
      "tastaturschutz",
      "rucksack",
      "backpack",
      "schutztasche",
      "einbaurahmen",
      "cloning kit",
      "standfuß",
      "wandhalterung",
      "netzteil für",
      "mousepad",
      "mauspad",
      "bumper",
      "strap",
      "armband",
      "displayfolie",
      "panzerglas",
      "schutzfolie",
      "screen protector",
    ];
    const accPattern = /\b(battery|akku|zubehör|accessory|batterie)\b/i;
    const forPattern =
      /\b(fuer|for|compatibile con|compatible with|pour|passend fuer|passend für)\b/i;
    const startsWithAcc =
      /^(hülle|case|tasche|bag|cover|kabel|cable|adapter|charger|batterie|akku|zubehör|skin|schutz|reparatur)/i.test(
        t,
      );

    // Safety check: High-end device features should never be accessories
    // "Batterie für den ganzen Tag" triggers accPattern, so we protect against it here
    if (
      t.includes("retina xdr") ||
      t.includes("lidar scanner") ||
      t.includes("nanotexturglas") ||
      t.includes("m4 chip") ||
      t.includes("m5 chip")
    )
      return false;

    const hasAccKeyword = accKeywords.some((kw) => t.includes(kw));
    const isActuallyAccessory =
      hasAccKeyword || accPattern.test(t) || startsWithAcc;
    const isForSomething = forPattern.test(t);

    if (
      t.includes("headset") ||
      t.includes("controller") ||
      t.includes("maus") ||
      t.includes("tastatur") ||
      t.includes("drucker") ||
      t.includes("multifunktion") ||
      t.includes("ecotank") ||
      t.includes("pixma")
    )
      return false;
    if (
      t.includes("tower") ||
      t.includes("atx") ||
      t.includes("itx") ||
      t.includes("matx")
    )
      return false;

    return isActuallyAccessory || (isForSomething && hasAccKeyword);
  }

  function isMiniPc(): boolean {
    return (
      /\b(nuc|mini pc|mini-pc|micro pc|micro-pc|beelink|geekom|minisforum|pro micro|ultraneptune|tiny pc)\b/i.test(
        t,
      ) ||
      s.includes("mini pcs") ||
      s.includes("barebones")
    );
  }

  function isNotebook(): boolean {
    if (root.toLowerCase().includes("software")) return false;

    // 1. Definite Notebook Models & Keywords
    const strongModels =
      /\b(macbook|chromebook|matebook|thinkpad|ideapad|yoga|legion|latitude|vostro|precision|inspiron|xps|pavilion|envy|victus|omen|zenbook|vivobook|expertbook|swift|aspire|predator|gram|galaxy book|surface laptop|surface pro|elitebook|probook|jodabook|toughbook)\b/i;
    const hpModel = /\bhp\s+(\d{3}|g\d)\b/i;
    const isExplicitTitleSystem =
      /\b(laptop|notebook|ultrabook|convertible|macbook|chromebook)\b/i.test(
        t,
      ) ||
      strongModels.test(t) ||
      hpModel.test(t);

    // 2. Hardware Spec Patterns (e.g., Core i5 + 16GB RAM + SSD)
    const hasCpu =
      /\b(core i[3579]|ryzen [3579]|intel core|athlon|pentium|celeron|apple m[1234])\b/i.test(
        t,
      );
    const hasRam = /\b(\d+gb|ram)\b/i.test(t);
    const hasSsd = /\b(\d+gb|ssd|nvme|m\.2|tb ssd)\b/i.test(t);
    const hasSystemSpecs = hasCpu && hasRam && hasSsd;

    const isOtherPeripheral =
      /\b(maus|mouse|tastatur|keyboard|monitor|headset|headphone|kopfhörer|speicherkarte|sd-karte|powerbank|kamera|drucker)\b/i.test(
        t,
      );
    const isSsdProduct =
      (t.startsWith("ssd") ||
        t.startsWith("interner ssd") ||
        t.startsWith("samsung 9")) &&
      !t.includes("laptop") &&
      !t.includes("notebook");

    // If it has peripheral names but is clearly a system, it's a notebook
    if (
      (isOtherPeripheral || isSsdProduct) &&
      !isExplicitTitleSystem &&
      !hasSystemSpecs
    )
      return false;

    const isNitroSystem =
      t.includes("nitro") &&
      (t.includes("acer") || t.includes("laptop") || t.includes("notebook"));
    const isKnownSub =
      s.includes("notebook") || s.includes("macbook") || s.includes("laptops");
    const isMainlyBag =
      /^(tasche|rucksack|hülle|cover|case|stand|ständer)/i.test(t);

    return (
      (isExplicitTitleSystem ||
        hasSystemSpecs ||
        isNitroSystem ||
        isKnownSub) &&
      !isMainlyBag
    );
  }

  function isRam(): boolean {
    if (
      t.includes("mainboard") ||
      t.includes("motherboard") ||
      isNotebook() ||
      isMiniPc()
    )
      return false;
    if (/\b(x870|z890|z790|z690|b760|b650|h610)\b/i.test(t)) {
      if (!/\b(\d+gb|cl\d+|mt\/s|mhz)\b/i.test(t)) return false;
    }
    const ramPattern =
      /\b(vengeance|fury|trident|dominator|crucial ram|kingston ram|corsair ram|g\.skill|v-color|lexar thorium|arbeitsspeicher|sodimm|ddr4|ddr5)\b/i;
    return (
      ramPattern.test(t) ||
      s.includes("arbeitsspeicher") ||
      s.includes("ddr-sdram")
    );
  }

  function isMainboard(): boolean {
    if (
      isNotebook() ||
      isEnclosure() ||
      t.includes("psu") ||
      t.includes("netzteil") ||
      isMiniPc()
    )
      return false;
    if (
      t.includes("kühler") ||
      t.includes("cooler") ||
      t.includes("gehäuse") ||
      t.includes("case") ||
      t.includes("ssd")
    )
      return false;
    const mbKeywords = ["mainboard", "motherboard"];
    const mbPattern =
      /\b(tuf|rog|strix|prime|aorus|phantom|legend|proart|mag|mpg|meg|asrock|gigabyte|biostar|b450|b550|b650|x570|x670|z690|z790|h610|a620|b760|x870|z890)\b/i;
    const gpuKeywords = /\b(geforce|radeon rx|rtx|gtx|arc)\b/i;
    if (gpuKeywords.test(t)) return false;
    return mbKeywords.some((kw) => t.includes(kw)) || mbPattern.test(t);
  }

  function isSsd(): boolean {
    if (
      isEnclosure() ||
      isNotebook() ||
      isMainboard() ||
      t.includes("extern") ||
      isMiniPc()
    )
      return false;
    const ssdKeywords = ["ssd", "nvme", "m.2 ssd"];
    const ssdPattern =
      /\b(samsung 980|samsung 990|crucial p[235]|wd[ _]black|wd blue sn|kingston [a-z]v|pny cs)\b/i;
    return (
      ssdKeywords.some((kw) => t.includes(kw)) ||
      ssdPattern.test(t) ||
      s.includes("interne ssd")
    );
  }

  function isHardDrive(): boolean {
    const isSsdProduct =
      t.includes("ssd") || t.includes("nvme") || t.includes("m.2");
    return (
      (t.includes("festplatte") ||
        t.includes("hdd") ||
        s.includes("festplatten") ||
        t.includes("surveillance drive")) &&
      !isSsdProduct &&
      !isNotebook()
    );
  }

  function is3DPrinter(): boolean {
    return (
      s.includes("3d-drucker") ||
      (t.includes("3d") && (t.includes("drucker") || t.includes("printer"))) ||
      t.includes("resin") ||
      t.includes("filament") ||
      t.includes("anycubic") ||
      t.includes("elegoo") ||
      t.includes("creality")
    );
  }

  function isPrinter(): boolean {
    if (isTablet() || isNotebook() || is3DPrinter()) return false;
    // Explicit exclusions for Tablet features that sound like printers
    if (t.includes("lidar scanner")) return false;
    return (
      /\b(drucker|scanner|kopierer|multifunktion|pixma|ecotank|laserjet|officejet)\b/i.test(
        t,
      ) ||
      s.includes("drucker") ||
      s.includes("scanner")
    );
  }

  function isTablet(): boolean {
    if (isAccessory()) return false;
    const tabletModels =
      /\b(ipad|galaxy tab|surface go|fire hd|tab s\d|tab a\d|mediapad|mi pad|pixel tablet)\b/i;
    return tabletModels.test(t) || s.includes("tablets");
  }

  function isSmartphone(): boolean {
    if (isNotebook() || isTablet() || isAccessory()) return false;
    const isStorage =
      t.includes("ssd") ||
      t.includes("festplatte") ||
      t.includes("flash") ||
      t.includes("memory");
    const isAudio =
      t.includes("headset") ||
      t.includes("kopfhörer") ||
      t.includes("speaker") ||
      t.includes("boxen");
    if (isStorage || isAudio) return false;
    return (
      /\b(iphone|galaxy s\d+|pixel|oneplus|xiaomi|smartphone|handy)\b/i.test(
        t,
      ) || s.includes("handy")
    );
  }

  function isPsu(): boolean {
    if (isNotebook() || isMainboard() || isMiniPc()) return false;
    const wattMatch = t.match(/\b(\d{3,4})\s*w\b/i);
    const hasEnoughWatt = !!(wattMatch && parseInt(wattMatch[1]) >= 300);
    return (
      (/\b(netzteil|psu|power supply|80 plus)\b/i.test(t) ||
        (hasEnoughWatt && t.includes("watt"))) &&
      !t.includes("adapter")
    );
  }

  function isPcCase(): boolean {
    return (
      (t.includes("gehäuse") || t.includes("case")) &&
      (t.includes("tower") ||
        t.includes("atx") ||
        t.includes("itx") ||
        t.includes("matx")) &&
      !t.includes("ssd") &&
      !isNotebook() &&
      !isMiniPc()
    );
  }

  function isGpu(): boolean {
    if (isNotebook() || isMiniPc()) return false;
    return (
      /\b(geforce|radeon rx|grafikkarte|video card)\b/i.test(t) ||
      s.includes("grafikkarten")
    );
  }

  function isCpu(): boolean {
    if (isNotebook() || isMiniPc() || t.includes("motherboard")) return false;
    return (
      /\b(ryzen|intel core|xeon|threadripper)\b.*\b(cpu|prozessor|processor)\b/i.test(
        t,
      ) || s.includes("prozessoren")
    );
  }

  function isMemoryCard(): boolean {
    return (
      /\b(microsd|sdxc|sdhc|memoria|speicherkarte|cfexpress|cfast|compactflash|xqd)\b/i.test(
        t,
      ) || s.includes("speicherkarten")
    );
  }

  function isCamera(): boolean {
    if (
      isSsd() ||
      isHardDrive() ||
      isMemoryCard() ||
      t.includes("ssd") ||
      t.includes("hdd")
    )
      return false;
    return (
      /\b(spiegellos|vollformat|mirrorless|dslr|bridgekamera|kompaktkamera|camcorder)\b/i.test(
        t,
      ) ||
      s.includes("digitalkameras") ||
      s.includes("systemkameras") ||
      s.includes("kompaktkameras")
    );
  }

  function isCpuCooler(): boolean {
    return (
      /\b(cpu[- ]kühler|prozessorlüfter|luftkühler|wasserkühler|aio|liquid cooler|cpu cooler)\b/i.test(
        t,
      ) ||
      s.includes("cpu-kühler") ||
      s.includes("prozessorlüfter")
    );
  }

  // ============================================================================
  // 2. DECISION TREE (ORDER MATTERS)
  // ============================================================================

  // --- 0. Pre-Flight Exclusions ---
  if (root.toLowerCase().includes("software") || s.includes("software"))
    return null;

  // STRICT Accessory filtering: If it's just a case/cable/bag, exclude it
  if (isAccessory()) {
    // Exception: If it's a known system/peripheral brand with a "bundle" feel, let it fall through
    if (
      !t.includes("laptop") &&
      !t.includes("notebook") &&
      !t.includes("macbook") &&
      !isMemoryCard() &&
      !is3DPrinter()
    ) {
      return null;
    }
  }

  // --- 1. Precision & High-Confidence Mapping ---
  // We check these first so specific devices don't get caught by generic peripheral/printer keywords.
  if (isNotebook()) return "notebooks";
  if (isTablet()) return "tablets";
  if (is3DPrinter()) return "3d-drucker";
  if (isMiniPc()) return "notebooks";

  const SUB_MAP: Record<string, CategorySlug> = {
    notebooks: "notebooks",
    macbooks: "notebooks",
    laptops: "notebooks",
    "laptop-computer": "notebooks",
    tablets: "tablets",
    "interne ssd": "ssds",
    grafikkarten: "gpu",
    "video cards": "gpu",
    prozessoren: "cpu",
    mainboards: "motherboards",
    motherboards: "motherboards",
    arbeitsspeicher: "ram",
    "ddr-sdram": "ram",
    netzteile: "power-supplies",
    gehäuse: "pc-cases",
    smartphones: "smartphones",
    handy: "smartphones",
    smartwatch: "smartwatches",
    fernseher: "tvs",
    tvs: "tvs",
    router: "routers",
    systemkameras: "systemkameras",
    digitalkameras: "cameras",
    kompaktkameras: "kompaktkameras",
    "3d-drucker": "3d-drucker",
    laserdrucker: "laserdrucker",
    multifunktionsdrucker: "multifunktionsdrucker",
    tintenstrahldrucker: "multifunktionsdrucker",
    drucker: "multifunktionsdrucker",
    "externe festplatten": "external-storage",
    "festplatten - intern": "hard-drives",
    "cpu-kühler": "cpu-coolers",
    prozessorlüfter: "cpu-coolers",
  };

  for (const [key, slug] of Object.entries(SUB_MAP)) {
    if (s.includes(key)) {
      if (slug === "notebooks" && !isNotebook()) continue;
      if (slug === "ssds" && !isSsd()) continue;
      if (slug === "ram" && !isRam()) continue;
      if (slug === "motherboards" && !isMainboard()) continue;
      if (slug === "gpu" && !isGpu()) continue;
      if (slug === "cpu" && !isCpu()) continue;
      if (slug === "power-supplies" && !isPsu()) continue;
      if (slug === "pc-cases" && !isPcCase()) continue;
      return slug;
    }
  }

  // --- 2. Peripherals & Audio ---
  if (
    s.includes("monitore") ||
    (t.includes("monitor") && !isNotebook() && !isMiniPc())
  )
    return "monitors";
  if (s.includes("tastaturen") || (t.includes("tastatur") && !isNotebook())) {
    return "keyboards";
  }
  if (s.includes("mäuse") || (t.includes("maus") && !isNotebook()))
    return "mice";
  if (
    t.includes("headset") ||
    t.includes("kopfhörer") ||
    s.includes("kopfhörer")
  )
    return "headphones";
  if (
    t.includes("boxen") ||
    t.includes("lautsprecher") ||
    s.includes("lautsprecher")
  )
    return "speakers";

  // --- 2. Storage Media & Enclosures ---
  if (isMemoryCard()) {
    if (!t.includes("slot") && !t.includes("adapter für")) {
      return "speicherkarten";
    }
  }
  if (isEnclosure()) return "external-storage";

  // --- 3. Printers & Scanners (Medium Priority, after Enclosures) ---
  if (isPrinter()) {
    // Check SUB_MAP first for specific types like Laserdrucker
    if (s.includes("laserdrucker")) return "laserdrucker";
    return "multifunktionsdrucker";
  }

  // --- 4. Gaming & Consoles ---
  if (
    root.toLowerCase().includes("game") ||
    s.includes("spiele") ||
    s.includes("videospiel") ||
    t.includes("playstation") ||
    t.includes(" nintendo ") ||
    t.includes(" xbox ")
  ) {
    if (
      t.includes("konsole") ||
      t.includes("playstation 5") ||
      t.includes("xbox series") ||
      t.includes("nintendo switch")
    )
      return "consoles";
    return t.includes("guthaben") || t.includes("card") || t.includes("code")
      ? null
      : "consoles";
  }

  // --- 5. Precision Helpers (Remaining) ---
  if (isRam()) return "ram";
  if (isSsd()) return "ssds";
  if (isMainboard()) return "motherboards";
  if (isCpuCooler()) return "cpu-coolers";
  if (isSmartphone()) return "smartphones";
  if (isPsu()) return "power-supplies";
  if (isPcCase()) return "pc-cases";
  if (isGpu()) return "gpu";
  if (isCpu()) return "cpu";

  // --- 6. Bulk Fallbacks ---
  if (isAccessory()) return null;
  if (t.includes("smartwatch") || s.includes("smartwatch"))
    return "smartwatches";
  if (t.includes("tv") || t.includes("fernseher")) return "tvs";
  if (isCamera() || t.includes("kamera") || s.includes("kamera")) {
    if (isHardDrive()) return "hard-drives";
    if (
      t.includes("ssd") ||
      t.includes("portable drive") ||
      t.includes("external drive")
    ) {
      return "external-storage";
    }
    if (s.includes("systemkameras") || t.includes("systemkamera"))
      return "systemkameras";
    return "cameras";
  }
  if (isHardDrive()) return "hard-drives";

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
