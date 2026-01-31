import { client } from "../../src/db";

/**
 * SURGICAL MIGRATION SCRIPT
 * -------------------------
 * Safely adds Icecat columns to the 'products' table without
 * touching or deleting the FTS search tables.
 */

const COMMANDS = [
  "ALTER TABLE products ADD COLUMN icecat_id INTEGER;",
  "ALTER TABLE products ADD COLUMN enrichment_status TEXT DEFAULT 'pending';",
  "ALTER TABLE products ADD COLUMN last_enriched_at INTEGER;",
];

console.log("🛠️ Starting Surgical Migration...");

(async () => {
  let successCount = 0;

  for (const sql of COMMANDS) {
    try {
      console.log(`   Executing: ${sql}`);
      await client.execute(sql);
      console.log("   ✅ Success");
      successCount++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("duplicate column")) {
        console.log("   ⚠️ Column already exists (Skipping)");
      } else {
        console.error("   ❌ Error:", message);
      }
    }
  }

  console.log("\nMigration Complete.");
  if (successCount === 0) {
    console.log("No changes made (columns likely already exist).");
  } else {
    console.log(`Added ${successCount} columns successfully.`);
  }

  process.exit(0);
})();
