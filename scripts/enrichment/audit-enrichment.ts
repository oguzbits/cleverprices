import { desc, eq, isNotNull, sql } from "drizzle-orm";

import { db, products } from "../../src/db";

/**
 * 🕵️‍♂️ ENRICHMENT AUDITOR
 * Compares and audits the quality of enriched data in the local database.
 */
async function audit() {
  console.log("📊 --- ENRICHMENT QUALITY AUDIT ---\n");

  // 1. Overall Status
  const stats = await db
    .select({
      category: products.category,
      source: products.specificationsSource,
      status: products.enrichmentStatus,
      count: sql<number>`count(*)`,
    })
    .from(products)
    .where(isNotNull(products.lastEnrichedAt))
    .groupBy(
      products.category,
      products.specificationsSource,
      products.enrichmentStatus,
    );

  console.log("💹 Recent Activity Summary:");
  const summaryData = stats.map((s) => ({
    Category: s.category,
    Source: s.source || "N/A",
    Status: s.status,
    Count: Number(s.count),
  }));
  console.table(summaryData);

  // 2. Sample 'Wins' (Scavenged)
  console.log("\n💎 Latest 'Wins' (Scavenged Technical Data):");
  const wins = await db
    .select()
    .from(products)
    .where(eq(products.enrichmentStatus, "scavenged"))
    .orderBy(desc(products.lastEnrichedAt))
    .limit(10);

  for (const win of wins) {
    console.log(`\n--- [ID: ${win.id}] ${win.title.substring(0, 80)}... ---`);
    console.log(`📍 Source: ${win.specificationsSource}`);
    try {
      const specs = JSON.parse(win.officialSpecifications || "{}");
      const keys = Object.keys(specs).filter((k) => k !== "_meta_source");
      console.log(`📋 Fields Found (${keys.length}):`);
      keys.forEach((k) => {
        const val = String(specs[k]);
        console.log(
          `   🔸 ${k.padEnd(25)}: ${val.length > 50 ? val.substring(0, 47) + "..." : val}`,
        );
      });
    } catch (e) {
      console.log("   ❌ Error parsing specs.");
    }
  }

  // 3. Category Specification Health (Calculated safely via Drizzle)
  console.log("\n📈 Category health:");
  const health = await db
    .select({
      category: products.category,
      wins: sql<number>`SUM(CASE WHEN enrichment_status = 'scavenged' THEN 1 ELSE 0 END)`,
      misses: sql<number>`SUM(CASE WHEN enrichment_status = 'not_found' THEN 1 ELSE 0 END)`,
      avgSpecs: sql<number>`AVG(CASE WHEN enrichment_status = 'scavenged' THEN (length(official_specifications) - length(replace(official_specifications, ':', ''))) / 1 ELSE 0 END)`,
    })
    .from(products)
    .where(isNotNull(products.lastEnrichedAt))
    .groupBy(products.category);

  const healthTable = health.map((h) => ({
    Category: h.category,
    Wins: Number(h.wins),
    Misses: Number(h.misses),
    "Avg Spec Density": Math.round(Number(h.avgSpecs) || 0),
  }));
  console.table(healthTable);
}

audit().catch(console.error);
