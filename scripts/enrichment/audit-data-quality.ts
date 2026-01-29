import { and, eq, isNotNull, not } from "drizzle-orm";
import { db, products } from "../../src/db";
import { FIELD_DEFINITIONS } from "./field-definitions";

async function auditDataQuality() {
  console.log("🔍 Auditing Data Quality...");

  const allProducts = await db
    .select({
      id: products.id,
      title: products.title,
      specs: products.officialSpecifications,
      icecatId: products.icecatId,
    })
    .from(products)
    .where(
      and(
        isNotNull(products.officialSpecifications),
        not(eq(products.officialSpecifications, "{}")),
      ),
    )
    .limit(2000); // Audit sample

  console.log(`📊 Analyzing ${allProducts.length} products...`);

  const fieldStats: Record<
    string,
    {
      units: Record<string, number>;
      values: Record<string, number>;
      count: number;
      numericButString: number;
    }
  > = {};

  const icecatStats: Record<
    string,
    { units: Record<string, number>; count: number }
  > = {};

  for (const p of allProducts) {
    let specs: any;
    try {
      specs = typeof p.specs === "string" ? JSON.parse(p.specs) : p.specs;
    } catch {
      continue;
    }

    const isIcecat = p.icecatId !== null;

    for (const [key, val] of Object.entries(specs)) {
      if (key.includes("_original_") || key.includes("Name der")) continue;

      if (!fieldStats[key]) {
        fieldStats[key] = {
          units: {},
          values: {},
          count: 0,
          numericButString: 0,
        };
      }
      fieldStats[key].count++;

      // Value & Unit Extraction
      const valStr = String(val).trim();
      const match = valStr.match(/^([\d.,]+)\s*([a-zA-Z"%°]+)?$/);

      let unit = "RAW_STRING";
      let numericVal = null;

      if (match) {
        numericVal = parseFloat(match[1].replace(",", "."));
        if (!isNaN(numericVal)) {
          unit = match[2] ? match[2].trim() : "NO_UNIT";
        }
      }

      // Track Units
      if (fieldStats[key].units[unit]) {
        fieldStats[key].units[unit]++;
      } else {
        fieldStats[key].units[unit] = 1;
      }

      // Track Icecat Separation
      if (isIcecat) {
        if (!icecatStats[key]) icecatStats[key] = { units: {}, count: 0 };
        icecatStats[key].count++;
        icecatStats[key].units[unit] = (icecatStats[key].units[unit] || 0) + 1;
      }

      // Track Categorical Values (Top 10)
      if (unit === "RAW_STRING" && valStr.length < 50) {
        const v = valStr.toLowerCase();
        fieldStats[key].values[v] = (fieldStats[key].values[v] || 0) + 1;
      }
    }
  }

  console.log("\n⚠️  NON-NORMALIZED FIELDS REPORT ⚠️");
  console.log("===================================");

  for (const [field, stats] of Object.entries(fieldStats)) {
    const units = Object.keys(stats.units);
    // Filter out low noise
    const significantUnits = units.filter((u) => stats.units[u] > 2);

    if (significantUnits.length > 1) {
      console.log(`\n🚩 ${field} (${stats.count} records):`);
      console.log(
        `   Mixed Units: ${significantUnits.map((u) => `${u} (${stats.units[u]})`).join(", ")}`,
      );

      if (FIELD_DEFINITIONS[field]?.baseUnit) {
        console.log(`   Expected Base: ${FIELD_DEFINITIONS[field].baseUnit}`);
      } else {
        console.log(`   No Base Unit Defined`);
      }

      if (icecatStats[field]) {
        const iceUnits = Object.keys(icecatStats[field].units).filter(
          (u) => icecatStats[field].units[u] > 0,
        );
        if (iceUnits.length > 1) {
          console.log(`   ❄️ Icecat also mixed: ${iceUnits.join(", ")}`);
        }
      }
    }
  }

  console.log("\n🎨 TOP CATEGORICAL INCONSISTENCIES");
  const catFields = ["Produktfarbe", "Betriebssystem", "Gehäusefarbe"];
  for (const f of catFields) {
    if (fieldStats[f]) {
      console.log(`\n${f}:`);
      const sorted = Object.entries(fieldStats[f].values)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      sorted.forEach(([v, c]) => console.log(`   - "${v}": ${c}`));
    }
  }

  process.exit(0);
}

auditDataQuality().catch(console.error);
