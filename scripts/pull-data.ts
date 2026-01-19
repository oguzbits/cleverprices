import { createClient } from "@libsql/client";
import { Database } from "bun:sqlite";

/**
 * CleverPrices "db:pull" script
 * downloads all data from the Turso Cloud database to the local SQLite file.
 * This keeps the local development environment in sync with the automated GitHub Action updates.
 */

async function pullData() {
  console.log("🚀 Starting data pull from Turso Cloud to Local SQLite...");

  const dbUrl =
    process.env.TURSO_DATABASE_URL?.replace("libsql://", "https://") || "";
  const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !dbAuthToken) {
    console.error("❌ Missing TURSO credentials in environment.");
    process.exit(1);
  }

  const cloudClient = createClient({ url: dbUrl, authToken: dbAuthToken });

  console.log("📂 Opening local database: ./data/cleverprices.db");
  // Ensure directory exists
  const localDb = new Database("./data/cleverprices.db", { create: true });

  // 1. Prepare Local Schema (Simple approach: we assume schema matches)
  // We disable foreign keys temporarily for faster bulk inserts
  localDb.run("PRAGMA foreign_keys = OFF;");

  const tables = ["products", "prices", "product_offers", "price_history"];

  for (const table of tables) {
    console.log(`\n📦 Processing table: ${table}...`);

    // Clear local table
    localDb.run(`DELETE FROM ${table}`);

    // Get local columns to avoid "column doesn't exist" errors
    const localInfo = localDb
      .prepare(`PRAGMA table_info(${table})`)
      .all() as any[];
    const localCols = localInfo.map((c) => c.name.toLowerCase());

    // Fetch from cloud in batches using Keyset Pagination (Seek Method)
    // This prevents N^2 reads caused by OFFSET on large tables (like price_history with 900k+ rows)
    let lastId = 0;
    const limit = 1000;
    let hasMore = true;
    let totalPulled = 0;

    while (hasMore) {
      const result = await cloudClient.execute({
        sql: `SELECT * FROM ${table} WHERE id > ? ORDER BY id ASC LIMIT ?`,
        args: [lastId, limit],
      });

      if (result.rows.length === 0) {
        hasMore = false;
        break;
      }

      // Intersection of columns: only pull what exists locally
      const cloudCols = result.columns;
      const localColsSet = new Set(
        localCols.map((c) => c.trim().toLowerCase()),
      );

      const validCols = cloudCols.filter((col) =>
        localColsSet.has(col.trim().toLowerCase()),
      );

      if (totalPulled === 0) {
        console.log(`🔍 Table ${table}:`);
        console.log(`   - Local columns: ${localCols.length}`);
        console.log(`   - Cloud columns: ${cloudCols.length}`);
        console.log(`   - Valid (intersection): ${validCols.join(", ")}`);
      }

      const placeholders = validCols.map(() => "?").join(",");
      const insertStmt = localDb.prepare(
        `INSERT OR REPLACE INTO ${table} (${validCols.join(",")}) VALUES (${placeholders})`,
      );

      localDb.transaction(() => {
        for (const row of result.rows) {
          try {
            // Basic sanity check: if the table expects product_id, ensure we have it
            if (localColsSet.has("product_id") && !row["product_id"]) {
              // Only skip if it's actually missing from the source data
              continue;
            }

            const values = validCols.map((col) => row[col]);
            // @ts-ignore - Row data types from libsql are compatible with bun:sqlite
            insertStmt.run(...(values as any[]));
          } catch (e: any) {
            console.error(`❌ Insert failed for row:`, JSON.stringify(row));
            console.error(`Valid columns:`, validCols);
            throw e; // Re-throw to abort transaction and script
          }
        }
      })();

      totalPulled += result.rows.length;
      console.log(`   Fetched ${totalPulled} rows...`);

      // Update lastId for the next batch
      const lastRow = result.rows[result.rows.length - 1];
      if (lastRow && typeof lastRow.id === "number") {
        lastId = lastRow.id;
      } else if (lastRow && typeof lastRow.id === "bigint") {
        lastId = Number(lastRow.id);
      }

      if (result.rows.length < limit) {
        hasMore = false;
      }
    }
    console.log(`✅ Finished ${table}: ${totalPulled} rows restored locally.`);
  }

  localDb.run("PRAGMA foreign_keys = ON;");
  localDb.close();

  console.log("\n🏁 Data pull completed successfully!");
  process.exit(0);
}

pullData().catch((err) => {
  console.error("❌ Pull failed:", err);
  process.exit(1);
});
