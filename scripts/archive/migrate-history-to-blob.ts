import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { prices } from "../src/db/schema";
import {
  compressHistory,
  parseHistoryBlob,
  pruneHistory,
} from "../src/lib/history-compression";

async function migrate() {
  console.log("🚀 Starting Price History Compression Migration...");

  // 1. Fetch all prices
  const allPrices = await db
    .select({
      id: prices.id,
      historyJson: prices.historyJson,
    })
    .from(prices);

  console.log(`📊 Found ${allPrices.length} records to process.`);

  let updatedCount = 0;
  let errorCount = 0;

  // 2. Process in chunks to avoid overwhelming the connection/memory
  const chunkSize = 100;
  for (let i = 0; i < allPrices.length; i += chunkSize) {
    const chunk = allPrices.slice(i, i + chunkSize);

    await Promise.all(
      chunk.map(async (row) => {
        try {
          // parseHistoryBlob handles both legacy TEXT and new BLOB
          const historyObj = parseHistoryBlob(row.historyJson);

          // Prune to 365 days
          const prunedHistory = pruneHistory(historyObj);

          // Compress
          const compressed = compressHistory(JSON.stringify(prunedHistory));

          // Update record
          await db
            .update(prices)
            .set({ historyJson: compressed })
            .where(sql`${prices.id} = ${row.id}`);

          updatedCount++;
        } catch (error) {
          console.error(`❌ Error processing row ${row.id}:`, error);
          errorCount++;
        }
      }),
    );

    if (updatedCount % 500 === 0 || updatedCount === allPrices.length) {
      console.log(
        `✅ Processed ${updatedCount}/${allPrices.length} records...`,
      );
    }
  }

  console.log(`\n✨ Migration complete!`);
  console.log(`📈 Updated: ${updatedCount}`);
  console.log(`⚠️ Errors: ${errorCount}`);

  // 3. Vacuum to reclaim space
  console.log("🧹 Running VACUUM to reclaim space...");
  try {
    await db.run(sql`VACUUM`);
    console.log("💎 VACUUM complete.");
  } catch (e) {
    console.warn("⚠️ VACUUM failed (this is non-critical if DB is busy):", e);
  }

  process.exit(0);
}

migrate().catch((err) => {
  console.error("💥 Critical migration error:", err);
  process.exit(1);
});
