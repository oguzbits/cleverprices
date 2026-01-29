#!/usr/bin/env bun
import { and, eq } from "drizzle-orm";
import { existsSync, readFileSync } from "fs";
import Papa from "papaparse";
import { db, NewPrice, NewProduct, prices, products } from "../../src/db";
import type { CategorySlug } from "../../src/lib/categories";
import { generateProductSlug } from "../../src/lib/utils/slug";
import { normalizeVariantAttributes } from "../../src/lib/utils/variants";
import { guardIntegrity } from "./data-validator";

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

        // Store raw features for future scavenging
        const keepaFeatures = JSON.stringify({
          description: row["Description & Features: Description"] || "",
          features: features,
        });

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
          "Dimensions", // Normalized key
          "Weight", // Normalized key
          "Material",
          "Style",
          "Pattern",
          "Department", // Added
          "Item: Dimension (cm³)",
          "Item: Weight (g)",
          "Package: Dimension (cm³)",
          "Package: Weight (g)",
          "Release Date",
          "Operating System",
          "Hardware Interface",
          // Keepa specific
          "Part Number",
          "Manufacturer",
        ];

        for (const key of specKeys) {
          // Check standard and CSV-specific variations
          if (row[key]) specs[key] = row[key];

          // Fallback legacy mapping if needed (Keepa CSVs sometimes change headers)
          if (!specs["Model"] && row["Product Group"])
            specs["Category"] = row["Product Group"];
        }

        // --- UNIVERSAL SPEC EXTRACTOR (Global High-Accuracy Mapping) ---
        // Crucial: We prioritize specific "Feature" bullets which often contain the dense tech specs.
        const featureContext = features.join(" | ");
        const deepContext = [title, description, featureContext].join(" | ");
        const lowerContext = deepContext.toLowerCase();

        // 0. Initial Spec Collection (Raw Columns from CSV)
        const commonKeys = [
          "Weight",
          "Dimensions",
          "Material",
          "Style",
          "Release Date",
          "Manufacturer",
          "Model",
          "Color",
          "Size",
          "Department",
        ];
        for (const key of commonKeys) {
          if (row[key] && !specs[key]) specs[key] = row[key];
        }
        // Specific Keepa Mappings
        if (row["Item: Weight (g)"])
          specs.Weight = `${row["Item: Weight (g)"]}g`;
        if (row["Item: Dimension (cm³)"])
          specs.Dimensions = row["Item: Dimension (cm³)"];

        // 1. Storage & RAM (Global Core Specs)
        if (!specs["Size"]) {
          // Negative lookahead: Ensure we don't catch RAM strings (DDR, RAM, VRAM)
          const match = deepContext.match(
            /\b(\d+(?:[\.,]\d+)?)\s*(GB|TB|MB)(?!\s*(?:DDR|RAM|VRAM|Graphic|Arbeitsspeicher))\b/i,
          );
          if (match) specs.Storage = match[0];
          else if (row["Size"]) specs.Storage = row["Size"];
        }
        if (!specs["RAM"]) {
          const match = deepContext.match(
            /\b(\d+)\s*(GB|MB)\s*(RAM|Arbeitsspeicher|Memory|Gemeinsamer Arbeitsspeicher)\b/i,
          );
          if (match) specs.RAM = match[0];
        }

        // --- GLOBAL TECH DETECTOR (Super-Enrichment Phase) ---
        // This block extracts high-value data for EVERY product category.

        // Connectivity (Standard Tech)
        const bt = deepContext.match(/Bluetooth\s*(\d+[\.,]?\d*)/i);
        if (bt) specs.Bluetooth = bt[0];
        const wifi = deepContext.match(/(WiFi|WLAN)\s*([67]E?)/i);
        if (wifi) specs.WiFi = wifi[0];
        const conn = deepContext.match(/\b(GPS|LTE|4G|5G|NFC|Cellular)\b/i);
        if (conn) specs.Connectivity = conn[0];

        // Operating System (OS)
        const os = deepContext.match(
          /\b(Windows\s*(10|11)|macOS|Android\s*(\d+)?|iOS\s*(\d+)?|Linux|HarmonyOS|ChromeOS)\b/i,
        );
        if (os) specs.Operating_System = os[0];

        // Physical & Eco (Aggressive Extraction)
        const energyClass =
          deepContext.match(/\bEnergy Class\s*([A-G](\+\+\+)?)\b/i) ||
          deepContext.match(/\b([A-G])\b/);
        if (energyClass)
          specs.Energy_Class = (energyClass[1] || energyClass[0]).trim();

        if (!specs.Weight) {
          const weight = deepContext.match(
            /\b(\d+[\.,]?\d*)\s*(g|kg|Gramm|Kilogramm)\b/i,
          );
          if (weight) specs.Weight = weight[0];
        }

        const dims = deepContext.match(
          /(\d+[\.,]?\d*)\s*x\s*(\d+[\.,]?\d*)\s*(x\s*(\d+[\.,]?\d*))?\s*(mm|cm|Zoll|Inch)/i,
        );
        if (dims && !specs.Dimensions) specs.Dimensions = dims[0];

        // Multimedia (Webcam / Sound)
        const webcamFull = deepContext.match(
          /(\d+)\s*(MP|Megapixel)\s*(Webcam|Center Stage|Kamera|Frontkamera)/i,
        );
        if (webcamFull) specs.Webcam = webcamFull[0];

        const audio = deepContext.match(
          /\b(Stereo|Dolby\s*Atmos|Harman\s*Kardon|Bose|JBL|Spatial\s*Audio)\b/i,
        );
        if (audio) specs.Audio_Tech = audio[0];

        // --- TECHNICAL DICTIONARY SCAVENGER (Extreme Data Recovery Phase) ---
        // This block hunts for high-value technical keywords that don't always follow a direct "Value + Unit" pattern.
        const dictionary: Record<string, string[]> = {
          Display: [
            "Retina",
            "Liquid Retina",
            "Super Retina",
            "Dynamic AMOLED",
            "LTPO",
            "IPS-Level",
            "Nano-Cell",
            "QLED",
            "OLED",
            "HDR10",
            "HDR10+",
            "Dolby Vision",
          ],
          Connectivity: [
            "5G",
            "4G LTE",
            "LTE",
            "NFC",
            "UWB",
            "eSIM",
            "Dual-SIM",
            "WiFi 6E",
            "WiFi 7",
            "Thunderbolt 4",
            "Thunderbolt 3",
            "USB4",
            "HDMI 2.1",
          ],
          Audio: [
            "Stereo Speaker",
            "Dolby Atmos",
            "Spatial Audio",
            "Beats",
            "Harman Kardon",
            "DTS:X",
            "Hi-Res Audio",
          ],
          Security: [
            "Face ID",
            "Touch ID",
            "Fingerprint",
            "Kensington Lock",
            "TPM 2.0",
          ],
          Build: [
            "Aluminium",
            "Titanium",
            "Gorilla Glass",
            "Magnesium",
            "IP68",
            "IP67",
            "MIL-STD-810G",
          ],
        };

        for (const [key, terms] of Object.entries(dictionary)) {
          terms.forEach((term) => {
            if (lowerContext.includes(term.toLowerCase())) {
              const current = specs[key] ? specs[key] + ", " : "";
              if (!current.includes(term)) specs[key] = current + term;
            }
          });
        }

        // --- QUANTITY HARVESTER (Extracting counts from descriptions) ---
        const speakerCount = deepContext.match(
          /(\d+)\s*(Lautsprecher|Speakers|Speaker)/i,
        );
        if (speakerCount) specs.Speakers_Count = speakerCount[1];
        const micCount = deepContext.match(
          /(\d+)\s*(Mikrofone|Microphones|Mics)/i,
        );
        if (micCount) specs.Microphones_Count = micCount[1];
        const fanCount = deepContext.match(/(\d+)\s*(Lüfter|Fans)/i);
        if (fanCount) specs.Fan_Count = fanCount[1];
        const mahMatch = deepContext.match(/(\d+)\s*(mAh)/i);
        if (mahMatch) specs.Battery_mAh = mahMatch[1];
        const cache = deepContext.match(
          /(\d+)\s*(MB|KB)\s*(L[23]\s*Cache|Cache)/i,
        );
        if (cache) specs.L3_Cache = cache[0];
        const igpu = deepContext.match(
          /\b(Integrated|Onboard|Intel\s*UHD|Intel\s*Iris|Radeon\s*Graphics)\b/i,
        );
        if (igpu) specs.Integrated_Graphics = igpu[0];

        // --- RECURSIVE PATTERN SEARCH (Generic Key-Value Harvester) ---
        // This hunts for "Key: Value" or "Value [Unit] Key" patterns commonly used in tech specs
        const genericPatterns = [
          /(\b[A-Za-z\s]{3,15}):\s*([A-Za-z0-9\s\.,]{1,30})\b/g, // Key: Value
          /(\b[A-Za-z0-9\s\.,]{1,30})\s*:\s*(\b[A-Za-z\s]{3,15})\b/g, // Value : Key (Alternative)
        ];

        for (const pattern of genericPatterns) {
          let m;
          while ((m = pattern.exec(deepContext)) !== null) {
            const key = m[1].trim();
            const val = m[2].trim();
            // Only keep if the key looks like a tech spec we recognize or want
            const techKeys = [
              "Betriebssystem",
              "Lautsprecher",
              "Mikrofone",
              "Anschlüsse",
              "Gewicht",
              "Abmessungen",
              "Garantie",
              "Display",
            ];
            if (
              techKeys.some((tk) =>
                key.toLowerCase().includes(tk.toLowerCase()),
              ) &&
              !specs[key] &&
              val.length < 30 && // Reject overly long values (likely marketing text)
              !val.toLowerCase().includes("hast") && // Emergency blocker
              !val.toLowerCase().includes("haben")
            ) {
              specs[key] = val;
            }
          }
        }

        // 2. Category-Specific Differentiators
        switch (categorySlug) {
          case "gpu":
            const gpuChip = deepContext.match(
              /\b(RTX|GTX|RX|Arc)\s*\d+[a-z]*\s*(Ti|Super|XT|XTX)?\b/i,
            );
            if (gpuChip)
              specs.Chipset =
                "NVIDIA GeForce " + gpuChip[0].replace(/GeForce\s*/i, ""); // Normalize
            if (deepContext.match(/Radeon/i) && gpuChip)
              specs.Chipset =
                "AMD Radeon " + gpuChip[0].replace(/Radeon\s*/i, "");

            const vram = deepContext.match(
              /(\d+)\s*(GB|TB)\s*(GDDR\d[X]?|DDR\d)/i,
            );
            if (vram) {
              specs.VRAM = vram[1] + " " + vram[2];
              specs.VRAM_Type = vram[3];
            } else {
              // Fallback separate
              const vramOnly = deepContext.match(/(\d+)\s*(GB|TB)/i);
              if (vramOnly && !specs.VRAM) specs.VRAM = vramOnly[0];
              const typeOnly = deepContext.match(/(GDDR\d[X]?)/i);
              if (typeOnly) specs.VRAM_Type = typeOnly[0];
            }

            const gpuClock = deepContext.match(
              /(Boost-Taktrate|Spieletakt|Boost Clock|Core Clock).*?(\d+)\s*MHz/i,
            );
            if (gpuClock) specs.Clock_Speed = gpuClock[2] + " MHz";

            const bus = deepContext.match(/(\d+)\s*(bit|Bit)/i);
            if (bus) specs.Bus_Width = bus[1] + "-Bit";

            const cooling = deepContext.match(/(\d+)\s*(Fans|Lüfter)/i);
            if (cooling) specs.Cooling = cooling[0];

            const gpuLen = deepContext.match(/(\d+)\s*mm\s*(Länge|Length)/i);
            if (gpuLen) specs.Length = gpuLen[0];
            break;
          case "cpu":
          case "prozessoren":
            const socket = deepContext.match(
              /(AM\d+|LGA\s*\d+|sTR\d+|Socket\s*\S+|Sockel\s*\S+)/i,
            );
            if (socket) specs.Socket = socket[0];
            const cores = deepContext.match(
              /(\d+)\s*(Kerne|Cores|Threads|C)\b/i,
            );
            if (cores) specs.Cores = cores[1]; // Just the number
            const tdp = deepContext.match(/(\d+)\s*W\b/i);
            if (tdp) specs.TDP = tdp[1] + "W";
            const clock = deepContext.match(/(\d+[\.,]?\d*)\s*GHz/i);
            if (clock) specs.Clock_Speed = clock[0];
            const cpuSeries = deepContext.match(
              /(Ryzen\s*\d|Core\s*[i\d]|Ultra\s*\d|Threadripper|Xeon|Apple\s*M[1-4]|M[1-4]\s*Chip|M[1-4]\s*Max|M[1-4]\s*Pro)/i,
            );
            if (cpuSeries) specs.Series = cpuSeries[0];
            const cpuGen = deepContext.match(/(\d+)\.\s*(Gen|Generation)/i);
            if (cpuGen) specs.Generation = cpuGen[0];
            break;
          case "ram":
          case "arbeitsspeicher":
            const ddr = deepContext.match(/(DDR\d|LPDDR\d)/i);
            if (ddr) specs.Memory_Type = ddr[0];
            const ramClock = deepContext.match(/(\d+)\s*MHz/i);
            if (ramClock) specs.Clock_Speed = ramClock[1] + "MHz";
            const kit = deepContext.match(/(\d+)\s*x\s*(\d+)\s*(GB|MB)/i);
            if (kit) specs.Kit_Size = kit[0];
            const lat = deepContext.match(/(CL\d+|C\d+)/i);
            if (lat) specs.Latency = lat[0];
            break;
          case "motherboards":
          case "mainboards":
            const mbSocket = deepContext.match(
              /(AM\d+|LGA\s*\d+|sTR\d+|Socket\s*\S+|Sockel\s*\S+)/i,
            );
            if (mbSocket) specs.Socket = mbSocket[0];
            const chipset = deepContext.match(/\b([ABZ]\d{2,3}|X\d{2,3})\b/i);
            if (chipset) specs.Chipset = chipset[0];
            break;
          case "monitore":
          case "tvs":
            const monScreen = deepContext.match(
              /(\d+[\.,]?\d*)\s*(Zoll|Inch|")/i,
            );
            if (monScreen) specs.Screen_Size = monScreen[0];
            const monRefresh = deepContext.match(/(\d+)\s*Hz/i);
            if (monRefresh) specs.Refresh_Rate = monRefresh[1] + " Hz";
            const monPanel = deepContext.match(
              /(OLED|QLED|IPS|VA|TN|Nano\s*IPS|Mini-LED|Retina|Liquid\s*Retina)/i,
            );
            if (monPanel) specs.Panel_Type = monPanel[0];
            const res = deepContext.match(
              /(\d{3,4}\s*x\s*\d{3,4}|4K|UHD|WQHD|Full\s*HD|FHD|5K|8K|Resolution|Auflösung)/i,
            );
            if (res) specs.Resolution = res[0];
            const hdr = deepContext.match(
              /\b(HDR10|HDR10\+|Dolby\s*Vision|DisplayHDR)\b/i,
            );
            if (hdr) specs.HDR_Support = hdr[0]; // Updated key to match schema
            const sync = deepContext.match(
              /(FreeSync|G-Sync|Adaptive\s*Sync)/i,
            );
            if (sync) specs.Sync_Tech = sync[0];
            const hdmiPorts = deepContext.match(/(\d+)\s*x?\s*HDMI/i);
            if (hdmiPorts) specs.HDMI_Ports = hdmiPorts[1];
            break;

          case "haushaltselektronik":
          case "waschmaschinen":
          case "waeschetrockner":
          case "kuehlschraenke":
          case "geschirrspueler":
          case "backoefen":
            const capKg = deepContext.match(/(\d+)\s*kg/i);
            if (capKg) specs.Capacity_KG = capKg[1] + " kg";
            const capL = deepContext.match(/(\d+)\s*(Litres|l|Liter)/i);
            if (capL) specs.Total_Capacity_L = capL[1] + " L";
            const energy =
              deepContext.match(/\b([A-G])\b(?:\s*Klasse|class)/i) ||
              deepContext.match(/Energieeffizienzklasse\s*([A-G])/i);
            if (energy) specs.Energy_Class = energy[1];
            const noise = deepContext.match(/(\d+)\s*dB/i);
            if (noise) specs.Noise_Level_dB = noise[0];
            // New strict keys
            const programs = deepContext.match(/(\d+)\s*Programme/i);
            if (programs) specs.Programs = programs[1];
            const water = deepContext.match(/(\d+)\s*L(?:\/| pro )Zyklus/i);
            if (water) specs.Water_Consumption = water[1] + " L";
            break;
            break;
          case "espressomaschinen":
          case "kuechenmaschinen":
            const pressure = deepContext.match(/(\d+)\s*bar/i);
            if (pressure) specs.Pressure_Bar = pressure[0];
            const watts = deepContext.match(/(\d+)\s*W(att)?\b/i);
            if (watts) specs.Wattage = watts[1] + "W";
            break;
          case "elektrische-zahnbuersten":
          case "bartschneider-haarschneider":
            const brushTech = deepContext.match(
              /(Schall|Oszillierend|Sonic|Rotating)/i,
            );
            if (brushTech) specs.Cleaning_Tech = brushTech[0];
            const len = deepContext.match(/(\d+(?:[\.,]\d+)?)\s*mm/i);
            if (len) specs.Min_Cutting_Length = len[0];
            break;
          case "fotografie":
          case "cameras":
          case "systemkameras":
          case "kompaktkameras":
            const mp = deepContext.match(
              /\b(\d+(?:[\.,]\d+)?)\s*(MP|Megapixel)\b/i,
            );
            if (mp) specs.Sensor_Resolution_MP = mp[1];
            const sensor = deepContext.match(
              /\b(Vollformat|APS-C|MFT|Full Frame|1\s*Zoll|1\s*Inch|Medium\s*Format)\b/i,
            );
            if (sensor) specs.Sensor_Size = sensor[0];
            const video = deepContext.match(/\b(4K|8K|Full\s*HD|FHD|1080p)\b/i);
            if (video) specs.Video_Resolution = video[0];
            const iso = deepContext.match(/ISO\s*(\d+)-(\d+)/i);
            if (iso) specs.ISO_Range = iso[0];
            break;
          case "drones":
            const flight = deepContext.match(/(\d+)\s*(min|Minuten|Minutes)/i);
            if (flight) specs.Flight_Time_Min = flight[1];
            const dVideo = deepContext.match(/\b(4K|5\.4K|2\.7K|8K)\b/i);
            if (dVideo) specs.Video_Resolution = dVideo[0];
            const range = deepContext.match(/(\d+)\s*(km|Kilometer)/i);
            if (range) specs.Range_KM = range[1];
            break;
          case "smartwatches":
            const watchSize = deepContext.match(/\b(\d+)\s*(mm)\b/i);
            if (watchSize) specs.Size = watchSize[0];
            const conn = deepContext.match(/\b(GPS|LTE|Cellular)\b/i);
            if (conn) specs.Connectivity = conn[0];
            break;
        }

        // --- Normalization & Storage ---
        const capacityValue =
          parseFloat(row["Unit Details: Unit Value"]) || null;
        const capacityUnit = row["Unit Details: Unit Type"] || null;

        // Ensure Specs contains normalization data for fallback
        if (!specs.Size && capacityValue)
          specs.Size = `${capacityValue}${capacityUnit}`;

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
          variationAttributes: normalizeVariantAttributes({
            title,
            variationAttributes: row["Variation Attributes"] || null,
            category: categorySlug,
          }),
          keepaFeatures,
          // Validate and Score
          specifications: (function () {
            const validation = validateProductSpecs(
              specs,
              categorySlug as CategorySlug,
            );
            // Log low quality items if needed
            if (validation.score < 50 && categorySlug !== "uncategorized") {
              console.log(
                `⚠️ Low Quality Data (${validation.score}%): ${asin} - Missing: ${validation.missing.join(", ")}`,
              );
            }
            // For now we just store the clean specs.
            // Once DB schema is updated, we would also store validation.score and validation.missing
            return JSON.stringify(validation.specs);
          })(),
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
          condition: (function () {
            const t = title.toLowerCase();
            if (
              t.includes("(generalüberholt)") ||
              t.includes("generalüberholt") ||
              t.includes("erneuert") ||
              t.includes("renewed") ||
              t.includes("refurbished") ||
              t.includes("b-ware")
            ) {
              return "Renewed";
            }
            if (t.includes("gebraucht") || t.includes("used")) {
              return "Used";
            }
            return "New";
          })(),
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
/**
 * Specification Guard: Validates and standardizes extracted technical attributes.
 * Prevents misclassification (e.g. DDR5 in Storage) and ensures clean keys.
 */
function validateProductSpecs(
  specs: Record<string, any>,
  category: CategorySlug,
): Record<string, any> {
  return guardIntegrity(specs, category);
}

main().catch(console.error);
