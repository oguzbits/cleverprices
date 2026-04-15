import { and, eq, isNotNull } from "drizzle-orm";
import { db, products } from "../../src/db";
import { getCategorySchema } from "../../src/lib/data-quality/schemas";
import { calculateProductHealth } from "../../src/lib/utils/data-quality";
import {
  calculateSiblingConsensus,
  getProductIdentity,
} from "../../src/lib/utils/product-identity";

async function runAudit(category: string) {
  console.log(`🔍 Starting Data Quality Audit for: ${category.toUpperCase()}`);

  const schema = getCategorySchema(category);
  if (!schema) {
    console.error(`❌ No schema found for category: ${category}`);
    process.exit(1);
  }

  const allProducts = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.category, category),
        isNotNull(products.officialSpecifications),
      ),
    );

  console.log(`📋 Auditing ${allProducts.length} enriched products...`);

  // Build sibling index for consensus
  const families = new Map<string, any[]>();
  for (const p of allProducts) {
    const identity = getProductIdentity(p as any);
    const key = `${p.brand}-${identity.model}`.toLowerCase();
    if (!families.has(key)) families.set(key, []);
    families.get(key)!.push(p);
  }

  let totalHealth = 0;
  const anomalies: any[] = [];
  let passing = 0;

  for (const p of allProducts) {
    const identity = getProductIdentity(p as any);
    const key = `${p.brand}-${identity.model}`.toLowerCase();
    const consensus = calculateSiblingConsensus(families.get(key) || []);

    const health = calculateProductHealth(p as any, consensus);
    totalHealth += health.healthScore;

    if (health.healthScore < schema.minRequiredScore) {
      anomalies.push({
        id: p.id,
        title: p.title,
        score: health.healthScore,
        metrics: health,
      });
    } else {
      passing++;
    }
  }

  const avgHealth =
    allProducts.length > 0 ? (totalHealth / allProducts.length).toFixed(1) : 0;

  console.log("\n📊 AUDIT REPORT");
  console.log("====================");
  console.log(`Category: ${category}`);
  console.log(`Total Products: ${allProducts.length}`);
  console.log(`Avg Health Score: ${avgHealth}/100`);
  console.log(`Passing: ${passing}`);
  console.log(`Anomalies Found: ${anomalies.length}`);
  console.log("====================\n");

  if (anomalies.length > 0) {
    console.log("🛑 TOP ANOMALIES (Review Recommended):");
    anomalies
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .forEach((a) => {
        console.log(
          `- [Score: ${a.score}] ID ${a.id}: ${a.title.substring(0, 70)}...`,
        );
        console.log(
          `  (C: ${a.metrics.completeness} V: ${a.metrics.validity} Cons: ${a.metrics.consistency})`,
        );
      });
  }

  console.log("\n✅ Audit complete.");
}

const targetCategory = process.argv[2] || "smartphones";
runAudit(targetCategory).catch(console.error);
