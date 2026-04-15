import { Database } from "bun:sqlite";
import { auditSourceIntegrity } from "./source-auditor";

const db = new Database("./data/cleverprices.db");

/**
 * Bulk Source Auditor
 * Audits all products in a category and flags those with untrusted raw data.
 */
async function bulkAudit(category: string) {
  console.log(`🛡️  Starting Bulk Source Audit for Category: ${category}...`);

  const products = db
    .prepare("SELECT id FROM products WHERE category = ?")
    .all(category) as { id: number }[];
  console.log(`📋 Found ${products.length} products to audit.`);

  let untrustedCount = 0;
  const violationStats: Record<string, number> = {};

  for (const p of products) {
    const result = await auditSourceIntegrity(p.id);

    if (!result.isTrusted) {
      untrustedCount++;
      // Mark as untrustworthy in DB (We can use enrichment_status = 'untrusted_source')
      db.prepare(
        "UPDATE products SET enrichment_status = 'untrusted_source' WHERE id = ?",
      ).run(p.id);

      result.violations.forEach((v) => {
        const type = v.split(":")[0];
        violationStats[type] = (violationStats[type] || 0) + 1;
      });
    }
  }

  console.log(`\n--- Audit Results ---`);
  console.log(`✅ Total Audited: ${products.length}`);
  console.log(`❌ Untrusted Sources: ${untrustedCount}`);
  console.log(`📊 Violation Stats:`, violationStats);
}

if (import.meta.main) {
  const category = process.argv[2] || "smartphones";
  bulkAudit(category).catch(console.error);
}
