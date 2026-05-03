import { Database } from "bun:sqlite";
import { eq, isNull } from "drizzle-orm";
import levenshtein from "fast-levenshtein";

import { db, products } from "../../src/db";

// Connect to Icecat Local Index
const icecatDb = new Database("data/icecat-index.db");

// Helper to clean titles
const clean = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function run() {
  console.log("🧠 Loading Icecat Index into Memory...");
  // Assuming 'products' or 'index' table in icecat-index.db.
  // Let's first check valid table names if this fails, but typically it is 'icecat_products' or similar based on previous context.
  // Actually, I'll inspect the schema first if this fails, but commonly in this project it's `icecat_index`.
  const icecatItems = icecatDb
    .query("SELECT icecat_id, title, brand FROM icecat_index")
    .all() as { icecat_id: number; title: string; brand: string }[];
  console.log(`📚 Loaded ${icecatItems.length} Icecat items.`);

  // Get Unenriched Products
  const targets = await db.query.products.findMany({
    where: isNull(products.officialSpecifications),
    columns: { id: true, title: true, brand: true },
  });
  console.log(`🎯 Targeting ${targets.length} unenriched products.`);

  let matches = 0;

  for (const p of targets) {
    if (!p.title) continue;

    const pTitleClean = clean(p.title);
    const pBrandClean = clean(p.brand || "");

    // 1. Filter by Brand first (Huge optimization)
    // If brand is known, only search icecat items with same brand
    let candidates = icecatItems;
    if (pBrandClean.length > 2) {
      candidates = icecatItems.filter(
        (i) =>
          clean(i.brand).includes(pBrandClean) ||
          pBrandClean.includes(clean(i.brand)),
      );
    }

    if (candidates.length === 0) continue;

    // 2. Find best Levenshtein match
    let bestMatch = null;
    let minDist = Infinity;

    // limit scan to avoid N^2 blowout if many candidates
    // actually standard loop is fine for <5000 candidates
    for (const cand of candidates) {
      if (!cand.title) continue;
      const cTitleClean = clean(cand.title);

      // Optimization: Must share at least one significant word (e.g. model number)
      // skip this complex check for now for speed, just simple dist

      // Calculate normalized distance (0-100 score)
      const dist = levenshtein.get(pTitleClean, cTitleClean);

      // Heuristic: Distance must be small relative to string length
      if (dist < minDist) {
        minDist = dist;
        bestMatch = cand;
      }
    }

    // Threshold: Match if < 20% difference or remarkably close
    // For "Ryzen 7 5800X" (12 chars), dist of 2 is okay.
    const threshold = Math.max(5, pTitleClean.length * 0.3);

    if (bestMatch && minDist <= threshold) {
      console.log(
        `✅ MATCH: "${p.title}" -> "${bestMatch.title}" (Dist: ${minDist})`,
      );

      // Update DB
      // Fetch full specs for bestMatch.icecat_id if needed, or just link IDs.
      // For efficiency, we just link the icecat_id first, then hyper-enrich script can hydrate specs.
      // Actually, let's just mark it.
      await db
        .update(products)
        .set({
          icecatId: bestMatch.icecat_id,
          enrichmentStatus: "pending_hydration", // Signal for next script
        })
        .where(eq(products.id, p.id));

      matches++;
    }
  }

  console.log(`🎉 Total Matches Found: ${matches}`);
}

run();
