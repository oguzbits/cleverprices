#!/usr/bin/env bun
/**
 * Add Missing Indexes
 *
 * Adds performance indexes to local and cloud databases.
 * Safe to run multiple times (CREATE INDEX IF NOT EXISTS).
 */

import { Database } from "bun:sqlite";

const INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_products_sales_rank ON products(sales_rank)",
  "CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at)",
  "CREATE INDEX IF NOT EXISTS idx_prices_country ON prices(country)",
  "CREATE INDEX IF NOT EXISTS idx_prices_product_id ON prices(product_id)",
  "CREATE INDEX IF NOT EXISTS idx_prices_last_updated ON prices(last_updated)",
];

async function main() {
  const target = process.argv[2] || "local";

  if (target === "local" || target === "all") {
    console.log("📂 Applying indexes to local database...");
    const localDb = new Database("./data/cleverprices.db");

    for (const sql of INDEXES) {
      try {
        localDb.exec(sql);
        console.log(`  ✓ ${sql.split(" ON ")[0].replace("CREATE ", "")}`);
      } catch (e: any) {
        if (e.message.includes("already exists")) {
          console.log(`  ⏭️  Index already exists`);
        } else {
          console.error(`  ❌ ${e.message}`);
        }
      }
    }
    localDb.close();
    console.log("✅ Local indexes applied.\n");
  }
  console.log("🏁 Index migration complete.");
}

main().catch(console.error);
