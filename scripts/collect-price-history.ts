#!/usr/bin/env bun
/**
 * DEPRECATED: This script is no longer needed with the lean schema.
 *
 * Price history is now stored in the `history_json` column of the `prices` table.
 * The `price_history` table has been removed to save space (97% reduction).
 *
 * History is now automatically appended during price updates in:
 * - scripts/update-prices.ts
 * - src/lib/keepa/sync-service.ts
 *
 * History format in historyJson: {"2025-01-15": 4999, "2025-01-16": 5199, ...}
 * (prices stored in cents, keyed by date)
 *
 * @deprecated Use update-prices.ts instead
 */

console.log("⚠️  This script is DEPRECATED.");
console.log("");
console.log(
  "Price history is now stored in the `history_json` column of the `prices` table.",
);
console.log("History is automatically appended during price updates.");
console.log("");
console.log("See: scripts/update-prices.ts");
process.exit(0);
