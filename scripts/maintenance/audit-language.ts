import { and, eq, isNotNull } from "drizzle-orm";

import { db, products } from "../../src/db";

async function auditLanguage() {
  console.log("🔍 Starting Language Audit...");

  const allProcessed = await db
    .select({
      id: products.id,
      title: products.title,
      specs: products.officialSpecifications,
      source: products.specificationsSource,
    })
    .from(products)
    .where(
      and(
        eq(products.enrichmentStatus, "processed"),
        isNotNull(products.officialSpecifications),
      ),
    );

  let germanCount = 0;
  let englishCount = 0;
  let mixedCount = 0;

  // Keywords that strongly suggest English vs German
  const enKeywords = [
    "Warranty",
    "Color",
    "Weight",
    "Width",
    "Height",
    "Depth",
    "Memory",
    "Processor",
  ];
  const deKeywords = [
    "Garantie",
    "Farbe",
    "Gewicht",
    "Breite",
    "Höhe",
    "Tiefe",
    "Speicher",
    "Prozessor",
  ];

  console.log(`📋 Analyzing ${allProcessed.length} enriched products...`);

  for (const p of allProcessed) {
    const specsStr = p.specs as string;
    let isEn = false;
    let isDe = false;

    // Naive check: does it contain shared keys?
    for (const kw of enKeywords) {
      if (specsStr.includes(`"${kw}"`)) isEn = true;
    }
    for (const kw of deKeywords) {
      if (specsStr.includes(`"${kw}"`)) isDe = true;
    }

    if (isDe && !isEn) {
      germanCount++;
    } else if (isEn && !isDe) {
      englishCount++;
      // console.log(`   🇬🇧 EN Detected (${p.source}): ${p.title.substring(0, 50)}...`);
    } else if (isDe && isEn) {
      mixedCount++;
      console.log(
        `   ⚠️ Mixed Detected (${p.source}): ${p.title.substring(0, 50)}...`,
      );
    } else {
      // Neutral / undetected (e.g. only numbers or technical terms like "HDMI")
      germanCount++; // Assume OK if no obvious English
    }
  }

  console.log("\n📊 Audit Results:");
  console.log(`   🇩🇪 German (Clean): ${germanCount}`);
  console.log(`   🇬🇧 English (To Fix): ${englishCount}`);
  console.log(`   ⚠️ Mixed / Ambiguous: ${mixedCount}`);

  const total = germanCount + englishCount + mixedCount;
  const health = ((germanCount / total) * 100).toFixed(1);
  console.log(`   ✅ German Health Score: ${health}%`);
}

auditLanguage().catch(console.error);
