import { and, eq, inArray } from "drizzle-orm";
import fs from "fs";
import https from "https";
import path from "path";
import zlib from "zlib";
import { db } from "../../src/db";
import { products } from "../../src/db/schema";

/**
 * ICECAT ENRICHMENT PIPELINE
 * --------------------------
 * Batch processes products to find and extract specs from Open Icecat.
 * - Strategy: Local Index Cache + Stream-based Scan
 * - Performance: Reduces bottleneck from network (20m) to disk (<1m).
 */

// CONFIG
const BATCH_SIZE = 500;
const ICECAT_USERNAME = process.env.ICECAT_USERNAME;
const ICECAT_PASSWORD = process.env.ICECAT_PASSWORD;
const INDEX_URL =
  "https://data.icecat.biz/export/freexml/EN/files.index.xml.gz";
const BASE_URL = "https://data.icecat.biz/export/freexml/EN/";
const INDEX_CACHE_DIR = path.join(process.cwd(), "data");
const INDEX_CACHE_FILE = path.join(
  INDEX_CACHE_DIR,
  "icecat_index_global.xml.gz",
);

if (!ICECAT_USERNAME || !ICECAT_PASSWORD) {
  console.error(
    "❌ Stats: Missing ICECAT_USERNAME or ICECAT_PASSWORD env vars.",
  );
  process.exit(1);
}

// Ensure data directory exists
if (!fs.existsSync(INDEX_CACHE_DIR)) {
  fs.mkdirSync(INDEX_CACHE_DIR, { recursive: true });
}

// TYPES
type IcecatSpecs = Record<string, string>;

// --- 0. CACHE HANDLER (Download once) ---
async function ensureLocalIndex(): Promise<void> {
  if (fs.existsSync(INDEX_CACHE_FILE)) {
    console.log("� Using local Icecat index cache.");
    return;
  }

  console.log("🌐 Local cache missing. Downloading Icecat Index (500MB+)...");
  console.log("   (This only happens once. Get a coffee ☕)");

  return new Promise((resolve, reject) => {
    const auth =
      "Basic " +
      Buffer.from(`${ICECAT_USERNAME}:${ICECAT_PASSWORD}`).toString("base64");

    const file = fs.createWriteStream(INDEX_CACHE_FILE);
    https
      .get(INDEX_URL, { headers: { Authorization: auth } }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Index download failed: ${response.statusCode}`));
          return;
        }

        let downloaded = 0;
        response.on("data", (chunk) => {
          downloaded += chunk.length;
          if (downloaded % (5 * 1024 * 1024) < chunk.length) {
            process.stdout.write(
              `\r   📥 Downloading... ${(downloaded / 1024 / 1024).toFixed(0)}MB`,
            );
          }
        });

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log("\n✅ Index Downloaded and Cached.");
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(INDEX_CACHE_FILE, () => reject(err));
      });
  });
}

// --- 1. INDEX STREAMER (Read from local file) ---
async function findIdsForBatch(
  gtinSet: Set<string>,
  mpnSet: Set<string>,
): Promise<Map<string, { id: string; path: string }>> {
  console.log(
    `\n🔍 Scanning Local Index for ${gtinSet.size} GTINs and ${mpnSet.size} MPNs...`,
  );
  const foundMetadata = new Map<string, { id: string; path: string }>();
  const totalToFind = gtinSet.size + mpnSet.size;

  const escapedGtins = Array.from(gtinSet)
    .filter(Boolean)
    .map((g) => g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const escapedMpns = Array.from(mpnSet)
    .filter(Boolean)
    .map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  // Regex to catch GTINs (in <EAN_UPC Value="...">) or MPNs (in <file Prod_ID="...">)
  const gtinRegex =
    escapedGtins.length > 0
      ? new RegExp(`Value="0?(${escapedGtins.join("|")})"`)
      : null;
  const mpnRegex =
    escapedMpns.length > 0
      ? new RegExp(`Prod_ID="(${escapedMpns.join("|")})"`, "i")
      : null;

  return new Promise((resolve) => {
    const gunzip = zlib.createGunzip();
    fs.createReadStream(INDEX_CACHE_FILE).pipe(gunzip);

    let buffer = "";
    let processedCount = 0;
    let totalBytes = 0;
    let resolved = false;

    const safeResolve = (ids: Map<string, { id: string; path: string }>) => {
      if (!resolved) {
        resolved = true;
        resolve(ids);
      }
    };

    gunzip.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      totalBytes += chunk.length;

      if (totalBytes % (20 * 1024 * 1024) < chunk.length) {
        process.stdout.write(
          `\r   📡 Scanning... ${(totalBytes / 1024 / 1024).toFixed(0)}MB | Found ${foundMetadata.size} matches...`,
        );
      }

      let fileStart;
      while ((fileStart = buffer.indexOf("<file ")) !== -1) {
        const fileEnd = buffer.indexOf("</file>", fileStart);
        if (fileEnd === -1) break;

        const fileBlock = buffer.substring(fileStart, fileEnd + 7);

        // Check GTIN
        let matchKey: string | null = null;
        if (gtinRegex) {
          const gtinMatch = fileBlock.match(gtinRegex);
          if (gtinMatch) matchKey = gtinMatch[1];
        }

        // Check MPN if GTIN not found
        if (!matchKey && mpnRegex) {
          const mpnMatch = fileBlock.match(mpnRegex);
          if (mpnMatch) matchKey = mpnMatch[1];
        }

        if (matchKey) {
          const idMatch = fileBlock.match(/Product_ID="(\d+)"/);
          const pathMatch = fileBlock.match(/path="([^"]+)"/);

          if (idMatch && pathMatch) {
            foundMetadata.set(matchKey, {
              id: idMatch[1],
              path: pathMatch[1],
            });

            // If we found them all, we can stop
            if (foundMetadata.size >= totalToFind) {
              console.log("\n⚡ Found all matching IDs early!");
              safeResolve(foundMetadata);
              gunzip.destroy();
              return;
            }
          }
        }
        buffer = buffer.substring(fileEnd + 7);
        if (buffer.length > 5000000) buffer = buffer.slice(-1000000);
      }
    });

    gunzip.on("end", () => {
      process.stdout.write(
        `\r ✅ Index Scan Complete. Matched ${foundMetadata.size}/${totalToFind} items.\n`,
      );
      safeResolve(foundMetadata);
    });

    gunzip.on("error", (err: Error) => {
      console.error("\n   ❌ Stream Error:", err.message);
      safeResolve(foundMetadata);
    });
  });
}

// --- 2. XML FETCHER & PARSER (Manual Robust) ---
async function fetchIcecatSpecs(
  id: string,
  relativePath?: string,
): Promise<{ specs: IcecatSpecs; title: string | null } | null> {
  const url = relativePath
    ? `https://data.icecat.biz/${relativePath}`
    : `https://data.icecat.biz/xml_s3/xml_server3.cgi?product_id=${id};lang=de;output=productxml`;
  const auth =
    "Basic " +
    Buffer.from(`${ICECAT_USERNAME}:${ICECAT_PASSWORD}`).toString("base64");

  try {
    const res = await fetch(url, { headers: { Authorization: auth } });
    if (!res.ok) return null;
    const xml = await res.text();

    const specs: IcecatSpecs = {};

    // Extract Title (from <Product ... Name="...">)
    const titleMatch = xml.match(/<Product[^>]+Name="([^"]+)"/);
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, "&") : null;

    // Manual split-based parsing (No DOM dependency)
    const productFeatures = xml.split("<ProductFeature ");

    for (let i = 1; i < productFeatures.length; i++) {
      const block = productFeatures[i];
      const valMatch = block.match(/Presentation_Value="([^"]+)"/);
      if (!valMatch) continue;

      const value = valMatch[1];

      // Name lookup
      const endIdx = block.indexOf("</ProductFeature>");
      const innerContent = block.substring(
        0,
        endIdx !== -1 ? endIdx : block.length,
      );
      const nameMatch = innerContent.match(/<Name[^>]+Value="([^"]+)"/);

      if (nameMatch) {
        // XML Entity Decode
        const decode = (s: string) =>
          s
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ")
            .replace(/&micro;/g, "µ")
            .replace(/&deg;/g, "°");

        const cleanName = decode(nameMatch[1]);
        const cleanValue = decode(value);

        specs[cleanName] = cleanValue;
      }
    }
    return { specs, title };
  } catch (e) {
    console.error(`Error fetching ID ${id}:`, e);
    return null;
  }
}

// --- 3. MAIN PIPELINE ---
async function runPipeline() {
  console.log("🚀 STARTING ENRICHMENT PIPELINE");

  try {
    // 0. Ensure Local Cache
    await ensureLocalIndex();

    // A. Select Batch
    // Note: checking for 'pending' or NULL status. AND must have GTIN.
    // We handle 'pending' status if column exists, else just GTINs if schema not applied (fallback).
    // For robustness, will use raw SQL if drizzle types confuse pending schema interactively.

    const pendingProducts = await db
      .select({
        id: products.id,
        gtin: products.gtin,
        mpn: products.mpn,
        specifications: products.specifications,
      })
      .from(products)
      .where(
        and(
          // Only process items that haven't been successfully enriched yet
          // We include 'not_found' so they get a second chance with the global index/MPN
          inArray(products.enrichmentStatus, ["pending", "not_found"]),
        ),
      )
      .limit(BATCH_SIZE);

    if (pendingProducts.length === 0) {
      console.log("✅ No pending products found.");
      process.exit(0);
    }

    console.log(`📋 Processing Batch: ${pendingProducts.length} items.`);

    // B. Prepare Search Maps
    const gtinMap = new Map<string, number[]>(); // GTIN -> ProductID[]
    const mpnMap = new Map<string, number[]>(); // MPN -> ProductID[]

    pendingProducts.forEach((p) => {
      // 1. Map GTINs
      if (p.gtin) {
        p.gtin
          .split(",")
          .map((s) => s.trim())
          .forEach((part) => {
            const cleanGtin = part.split(".")[0].trim();
            if (cleanGtin) {
              if (!gtinMap.has(cleanGtin)) gtinMap.set(cleanGtin, []);
              gtinMap.get(cleanGtin)!.push(p.id);
            }
          });
      }
      // 2. Map MPNs
      if (p.mpn) {
        let cleanMpn = p.mpn.trim();
        // Remove trailing .0 from MPNs (common CSV/Excel artifact)
        if (cleanMpn.endsWith(".0")) cleanMpn = cleanMpn.slice(0, -2);

        // Skip obvious junk or too-short names
        if (
          cleanMpn &&
          cleanMpn.length > 2 &&
          cleanMpn !== "1.0" &&
          cleanMpn !== "0.0"
        ) {
          if (!mpnMap.has(cleanMpn)) mpnMap.set(cleanMpn, []);
          mpnMap.get(cleanMpn)!.push(p.id);
        }
      }
    });

    // C. Find IDs in Index
    const icecatMatches = await findIdsForBatch(
      new Set(gtinMap.keys()),
      new Set(mpnMap.keys()),
    );

    // D. Fetch Details & Update DB
    let successCount = 0;
    let notFoundCount = 0;

    for (const [matchKey, metadata] of icecatMatches.entries()) {
      // Prioritize GTIN match, then MPN
      const productIds = gtinMap.get(matchKey) || mpnMap.get(matchKey);
      if (!productIds) continue;

      const { id: icecatId, path: relativePath } = metadata;
      console.log(`   ⬇️ Handling ${matchKey} (Icecat ID: ${icecatId})...`);

      const result = await fetchIcecatSpecs(icecatId, relativePath);

      if (result && result.specs && Object.keys(result.specs).length > 0) {
        const { specs: newSpecs, title: officialTitle } = result;

        for (const pid of productIds) {
          const originalP = pendingProducts.find((p) => p.id === pid);
          const currentSpecs = originalP?.specifications
            ? JSON.parse(originalP.specifications)
            : {};

          const mergedSpecs = { ...currentSpecs, ...newSpecs };

          await db
            .update(products)
            .set({
              specifications: JSON.stringify(mergedSpecs),
              officialSpecifications: JSON.stringify(newSpecs),
              officialTitle,
              icecatId: parseInt(icecatId),
              enrichmentStatus: "processed",
              lastEnrichedAt: new Date(),
            })
            .where(eq(products.id, pid));
        }
        successCount += productIds.length;
      } else {
        // Mark as not_found so we don't loop
        for (const pid of productIds) {
          await db
            .update(products)
            .set({
              enrichmentStatus: "not_found",
              lastEnrichedAt: new Date(),
            })
            .where(eq(products.id, pid));
        }
        notFoundCount += productIds.length;
      }
    }

    // E. Handle Remaining Items (Not Found in Index)
    // Products that were in our batch but had no match in icecatMatches
    const matchedPids = new Set<number>();
    for (const matchKey of icecatMatches.keys()) {
      (gtinMap.get(matchKey) || []).forEach((id) => matchedPids.add(id));
      (mpnMap.get(matchKey) || []).forEach((id) => matchedPids.add(id));
    }

    for (const p of pendingProducts) {
      if (!matchedPids.has(p.id)) {
        await db
          .update(products)
          .set({
            enrichmentStatus: "not_found",
            lastEnrichedAt: new Date(),
          })
          .where(eq(products.id, p.id));
        notFoundCount++;
      }
    }

    console.log("\n🎉 BATCH COMPLETE");
    console.log(`   ✅ Enriched: ${successCount}`);
    console.log(`   🔸 Not Found: ${notFoundCount}`);
  } catch (e) {
    console.error("Pipeline Error:", e);
    process.exit(1);
  }
}

runPipeline();
