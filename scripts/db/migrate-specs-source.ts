import { sql } from "drizzle-orm";
import { db } from "../../src/db";

async function run() {
  console.log("🏁 Starting migration: adding specifications_source column...");

  try {
    // 1. Add Column (Safe-ish check)
    try {
      await db.run(
        sql`ALTER TABLE products ADD COLUMN specifications_source text DEFAULT NULL`,
      );
      console.log("✅ Column 'specifications_source' added.");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("duplicate column")) {
        console.log("ℹ️ Column 'specifications_source' already exists.");
      } else {
        console.error("⚠️ Error adding column:", message);
      }
    }

    // 2. Backfill Data
    console.log("🔄 Backfilling data...");

    // Set 'icecat'
    const icecatResult = await db.run(sql`
        UPDATE products 
        SET specifications_source = 'icecat' 
        WHERE icecat_id IS NOT NULL 
        AND specifications_source IS NULL
    `);
    console.log(`✅ Marked Icecat sources.`);

    // Set 'keepa_ai'
    const aiResult = await db.run(sql`
        UPDATE products 
        SET specifications_source = 'keepa_ai' 
        WHERE official_specifications IS NOT NULL 
        AND official_specifications != '{}'
        AND icecat_id IS NULL
        AND specifications_source IS NULL
    `);
    console.log(`✅ Marked AI sources.`);

    console.log("🎉 Migration complete.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
}

run();
