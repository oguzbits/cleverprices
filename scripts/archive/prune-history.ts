#!/usr/bin/env bun
/**
 * Prune Price History
 *
 * Enforces a configurable day limit on history_json blobs to save space.
 * Default: 365 days (1 year).
 *
 * Now supports both legacy TEXT and compressed BLOB formats.
 */

import { Database } from "bun:sqlite";
import {
  compressHistory,
  parseHistoryBlob,
  pruneHistory,
} from "../../src/lib/history-compression";

const DB_PATH = "data/cleverprices.db";

// Parse --days argument (default: 365)
const daysArg = process.argv.find((a) => a.startsWith("--days="));
const maxDays = daysArg ? parseInt(daysArg.split("=")[1]) : 365;

const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - maxDays);
const dateCutoff = cutoff.toISOString().split("T")[0];

async function main() {
  console.log(
    `🧹 Pruning Price History to ${maxDays} Days (Cutoff: ${dateCutoff})`,
  );
  const db = new Database(DB_PATH);

  const prices = db
    .query("SELECT id, history_json FROM prices WHERE history_json IS NOT NULL")
    .all() as { id: number; history_json: Buffer | string }[];

  let totalPruned = 0;
  let productsUpdated = 0;

  db.run("BEGIN TRANSACTION");
  try {
    for (const row of prices) {
      // Parse history (handles both legacy TEXT and compressed BLOB)
      const historyObj = parseHistoryBlob(row.history_json);
      const initialCount = Object.keys(historyObj).length;

      // Prune old entries
      const prunedObj = pruneHistory(historyObj, maxDays);
      const prunedCount = Object.keys(prunedObj).length;

      if (prunedCount < initialCount) {
        // Compress and save
        const compressed = compressHistory(JSON.stringify(prunedObj));
        db.run("UPDATE prices SET history_json = ? WHERE id = ?", [
          compressed,
          row.id,
        ]);
        totalPruned += initialCount - prunedCount;
        productsUpdated++;
      }
    }
    db.run("COMMIT");
    console.log(
      `✅ Pruned ${totalPruned} old price points across ${productsUpdated} products.`,
    );

    console.log("🗜️ Vacuuming database...");
    db.run("VACUUM");
    console.log("✨ Done!");
  } catch (err) {
    db.run("ROLLBACK");
    console.error("❌ Pruning failed:", err);
  } finally {
    db.close();
  }
}

main().catch(console.error);
