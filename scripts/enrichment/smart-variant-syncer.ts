import { and, eq, isNotNull, sql } from "drizzle-orm";

import { db, products } from "../../src/db";

/**
 * Smart Variant Syncer
 * Spreads "Common Specifications" from a Lead Variant to its siblings.
 * Respects unique attributes (Color, Storage, RAM) to maintain high accuracy.
 */

// Authority Hierarchy
const SOURCE_PRIORITY: Record<string, number> = {
  icecat: 100,
  google: 80,
  ebay: 60,
  "ebay-search": 50,
  "intel-ark": 90,
  "variant-sync": 10, // Lowest authority
};

// Fields that are essentially invariant for a model family (Safe to Propagate)
const GLOBAL_SAFE_FIELDS = [
  "Marke",
  "Modell",
  "Prozessorfamilie",
  "Grafikprozessorenfamilie",
  "Bildschirmtechnologie",
  "Schnittstelle",
  "Formfaktor",
  "Eingebaute Audio-Decoder",
  "Betriebssystem",
  "System",
  "Garantie",
  "Besonderheiten",
];

// Category-specific safely shared fields
const CATEGORY_SAFE_FIELDS: Record<string, string[]> = {
  gpu: ["GPU", "Kühlung", "Anzahl Lüfter", "Besonderheiten", "Produktart"],
  smartphones: [
    "Prozessor",
    "GPU",
    "Bildschirmtechnologie",
    "SIM-Kartensteckplätze",
    "Mobilfunknetzgenerierung",
    "Betriebssystem",
    "Integrierte Sensoren",
    "Kamera-Auflösung",
    "Besonderheiten",
  ],
  notebooks: [
    "Prozessor",
    "Grafikkarte",
    "Bildschirmtechnologie",
    "Tastaturlayout",
    "Besonderheiten",
    "Betriebssystem",
  ],
  ssds: ["Technologie", "Flash Card Typ", "Besonderheiten", "Schnittstelle"],
};

// Forbidden from spreading (Always Global)
const STRICTLY_UNIQUE_FIELDS = [
  "Hersteller-Teilenummer",
  "MPN",
  "EAN",
  "GTIN",
  "ASIN",
  "Modellnummer",
];

// Map of Amazon Variation Keys to our Technical Field Names
const VARIATION_THEME_MAP: Record<string, string[]> = {
  Farbe: ["Produktfarbe", "Farbe"],
  Color: ["Produktfarbe", "Farbe"],
  Speicher: ["Interne Speicherkapazität", "RAM-Kapazität", "Speichergröße"],
  Storage: ["Interne Speicherkapazität", "Storage"],
  Size: ["Größe", "Zoll", "Bildschirmdiagonale"],
  Größe: ["Größe", "Zoll", "Bildschirmdiagonale"],
  Stil: ["Modell", "Besonderheiten"],
  RAM: ["RAM-Kapazität"],
  Kapazität: ["Interne Speicherkapazität", "RAM-Kapazität"],
  Prozessor: ["Prozessor", "Prozessorfamilie"],
};

/**
 * Extracts and maps the keys that define this variation
 */
function getVariationBlockedFields(variationAttr: string | null): string[] {
  if (!variationAttr) return [];
  const blocked: string[] = [];

  // Format: "Farbe: Mitternacht; Speicher: 128 GB"
  const pairs = variationAttr.split(";");
  for (const pair of pairs) {
    const key = pair.split(":")[0].trim();
    if (VARIATION_THEME_MAP[key]) {
      blocked.push(...VARIATION_THEME_MAP[key]);
    }
  }
  return blocked;
}

/**
 * Validates that two titles belong to the same model/generation
 */
function titlesAreCompatible(titleA: string, titleB: string): boolean {
  const clean = (t: string) =>
    t.toLowerCase().replace(/[()]/g, "").split(/\s+/);
  const wordsA = clean(titleA);
  const wordsB = clean(titleB);

  // Critical Mismatch Markers (Generations, Tiers)
  const markers = [
    "pro",
    "max",
    "ultra",
    "plus",
    "mini",
    "air",
    "gen",
    "generation",
    "m1",
    "m2",
    "m3",
    "m4",
    "ti",
    "super",
    "xt",
    "xtx",
    "oled",
    "qled",
  ];

  for (const marker of markers) {
    const hasA = wordsA.includes(marker);
    const hasB = wordsB.includes(marker);
    if (hasA !== hasB) return false;
  }

  // 1. Dynamic Alphanumeric Differentiators (e.g. 9a vs 9, 6s vs 6)
  const getDifferentiators = (words: string[]) =>
    words.filter((w) => /^\d+[a-z]{1,2}$/i.test(w));
  const diffsA = getDifferentiators(wordsA);
  const diffsB = getDifferentiators(wordsB);

  // If one title has "9a" but the other doesn't, they are incompatible
  for (const d of [...new Set([...diffsA, ...diffsB])]) {
    const hasA = diffsA.includes(d);
    const hasB = diffsB.includes(d);
    if (hasA !== hasB) return false;
  }

  // 2. Numeric Version Check
  const getVersions = (words: string[]) => words.filter((w) => /^\d+$/.test(w));
  const versionsA = getVersions(wordsA);
  const versionsB = getVersions(wordsB);

  // If both have numbers but they don't share any, they are likely different generations
  if (versionsA.length > 0 && versionsB.length > 0) {
    const hasOverlap = versionsA.some((v) => versionsB.includes(v));
    if (!hasOverlap) return false;
  }

  // Check shared core model (usually first 2-3 words)
  const sharedWords = wordsA
    .slice(0, 3)
    .filter((w) => wordsB.slice(0, 3).includes(w));
  return sharedWords.length >= 2;
}

async function syncVariants() {
  console.log("🛡️ Starting Variation-Aware Bulletproof Syncer...");

  const enrichedParents = await db
    .select({ parentAsin: products.parentAsin })
    .from(products)
    .where(
      and(
        isNotNull(products.parentAsin),
        sql`${products.parentAsin} != ''`,
        isNotNull(products.officialSpecifications),
      ),
    )
    .groupBy(products.parentAsin);

  console.log(`📋 Analyzing ${enrichedParents.length} variant groups.`);

  let totalUpdated = 0;
  let totalRefusedByGuard = 0;

  for (const group of enrichedParents) {
    const parentAsin = group.parentAsin!;
    const members = await db
      .select()
      .from(products)
      .where(eq(products.parentAsin, parentAsin));

    // Find Best Authority Lead
    let lead = members[0];
    let maxPriority = -1;

    for (const member of members) {
      if (!member.officialSpecifications) continue;
      const source = member.specificationsSource || "unknown";
      const priority = SOURCE_PRIORITY[source] || 0;

      // Select higher priority, or if equal priority, select the one with MORE specs (better completeness)
      if (priority > maxPriority) {
        maxPriority = priority;
        lead = member;
      } else if (priority === maxPriority) {
        const currentLen = lead.officialSpecifications
          ? lead.officialSpecifications.length
          : 0;
        const newLen = member.officialSpecifications.length;
        if (newLen > currentLen) {
          lead = member;
        }
      }
    }

    if (!lead || !lead.officialSpecifications || maxPriority < 40) continue; // Only spread high-quality data
    const leadSpecs = JSON.parse(lead.officialSpecifications);

    for (const sibling of members) {
      if (sibling.id === lead.id) continue;

      // 1. Guard: Keyword Compatibility Check (Relaxed for Family)
      const sameFamily =
        lead.parentAsin &&
        sibling.parentAsin &&
        lead.parentAsin === sibling.parentAsin;
      if (!titlesAreCompatible(lead.title, sibling.title) && !sameFamily) {
        totalRefusedByGuard++;
        continue;
      }

      // 2. Guard: Authority Check
      // Block overwrite only if sibling is strictly BETTER (Higher Authority)
      // Peer-to-Peer (Equal Authority) is now ALLOWED (e.g. eBay -> eBay)
      const siblingSource = sibling.specificationsSource || "none";
      if (SOURCE_PRIORITY[siblingSource] > maxPriority) continue;

      const existingSpecs = sibling.officialSpecifications
        ? JSON.parse(sibling.officialSpecifications)
        : {};

      // 3. DYNAMIC PROTECTION: Block what Amazon says is a variation
      const amazonBlocked = getVariationBlockedFields(
        sibling.variationAttributes,
      );
      const groupStrictUnique = [...STRICTLY_UNIQUE_FIELDS, ...amazonBlocked];

      // 4. Selective Merge
      const newSpecs = { ...existingSpecs };
      const safeFields = [
        ...GLOBAL_SAFE_FIELDS,
        ...(CATEGORY_SAFE_FIELDS[sibling.category] || []),
      ];

      for (const field of safeFields) {
        if (leadSpecs[field] && !groupStrictUnique.includes(field)) {
          // Relaxed: Always fill gaps, or update if the lead has better or equal authority
          const isGap = !newSpecs[field];
          const hasAuthority =
            maxPriority >= (SOURCE_PRIORITY[siblingSource] || 0);

          if (isGap || hasAuthority) {
            newSpecs[field] = leadSpecs[field];
          }
        }
      }

      const specsJson = JSON.stringify(newSpecs);
      if (specsJson !== sibling.officialSpecifications) {
        await db
          .update(products)
          .set({
            officialSpecifications: specsJson,
            specificationsSource: `variant-sync:${lead.specificationsSource || "lead"}`,
            enrichmentStatus: "processed",
            lastEnrichedAt: new Date(),
          })
          .where(eq(products.id, sibling.id));

        totalUpdated++;
      }
    }
  }

  console.log(`✅ Sync Complete.`);
  console.log(`🔹 Updated: ${totalUpdated}`);
  console.log(`🔹 Safety Aborts (Mismatch): ${totalRefusedByGuard}`);
}

syncVariants().catch(console.error);
