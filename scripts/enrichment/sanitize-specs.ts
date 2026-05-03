import { and, eq, isNotNull, not } from "drizzle-orm";

import { db, products } from "../../src/db/index";

async function sanitizeSpecs() {
  console.log("🧼 Sanitizing Official Specifications...");

  const targets = await db.query.products.findMany({
    where: and(
      isNotNull(products.officialSpecifications),
      not(eq(products.officialSpecifications, "{}")),
    ),
  });

  console.log(`📋 Found ${targets.length} candidates for sanitization.`);

  let updatedCount = 0;

  for (const p of targets) {
    let specs: any;
    try {
      specs =
        typeof p.officialSpecifications === "string"
          ? JSON.parse(p.officialSpecifications)
          : p.officialSpecifications;
    } catch (e) {
      console.error(`❌ Could not parse specs for ID ${p.id}. Resetting.`);
      await db
        .update(products)
        .set({ officialSpecifications: null, enrichmentStatus: "pending" })
        .where(eq(products.id, p.id));
      continue;
    }

    const originalLength = JSON.stringify(specs).length;
    const cleaned = cleanObject(specs);

    if (JSON.stringify(cleaned).length !== originalLength) {
      await db
        .update(products)
        .set({
          officialSpecifications: JSON.stringify(cleaned),
        })
        .where(eq(products.id, p.id));
      updatedCount++;
    }
  }

  console.log(`✅ Sanitized ${updatedCount} products.`);
  process.exit(0);
}

function cleanObject(obj: any): any {
  if (Array.isArray(obj)) {
    const cleanedArr = obj
      .map((item) => cleanObject(item))
      .filter((item) => {
        if (item === null || item === undefined) return false;
        if (typeof item === "string" && isJunkValue(item)) return false;
        if (typeof item === "object" && Object.keys(item).length === 0)
          return false;
        return true;
      });
    return cleanedArr.length > 0 ? cleanedArr : null;
  }

  if (typeof obj === "object" && obj !== null) {
    const cleanedObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanObject(value);

      // Keep if not junk
      if (
        cleanedValue !== null &&
        cleanedValue !== undefined &&
        !(typeof cleanedValue === "string" && isJunkValue(cleanedValue)) &&
        !(Array.isArray(cleanedValue) && cleanedValue.length === 0) &&
        !(
          typeof cleanedValue === "object" &&
          Object.keys(cleanedValue).length === 0
        )
      ) {
        cleanedObj[key] = cleanedValue;
      }
    }

    // Special Case: "Allgemein" and "Technische Details" redundancy
    if (cleanedObj["Allgemein"] && cleanedObj["Technische Details"]) {
      // If one is a subset of the other, or they are very similar, we could merge.
      // For now, let's just make sure we don't have empty groups.
    }

    return Object.keys(cleanedObj).length > 0 ? cleanedObj : null;
  }

  return obj;
}

function isJunkValue(val: string): boolean {
  const junkTerms = [
    "nicht",
    "n/a",
    "unavailable",
    "empty",
    "specified",
    "angegeben",
    "spezifiziert",
    "explizit",
    "keine",
    "none",
    "n.a.",
    "null",
    "undefined",
  ];
  const lowVal = val.toLowerCase().trim();

  if (!lowVal || lowVal === "" || lowVal === "-" || lowVal === "?") return true;

  // Matches "nicht angegeben", "nicht spezifiziert", "n/a", etc.
  return junkTerms.some((term) => lowVal.includes(term)) && lowVal.length < 30;
}

sanitizeSpecs();
