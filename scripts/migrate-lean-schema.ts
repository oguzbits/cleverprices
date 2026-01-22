#!/usr/bin/env bun
/**
 * Database Schema Migration: Lean Idealo-Style Architecture
 *
 * This script migrates from the bloated 567MB structure to a lean ~60MB architecture:
 * 1. Consolidates amazon_price, new_price, buy_box_price → single "price" column
 * 2. Converts 2.8M price_history rows → JSON blob per product
 * 3. Removes redundant columns and tables
 *
 * Usage:
 *   bun run scripts/migrate-lean-schema.ts [--dry-run]
 */

import { Database } from "bun:sqlite";
import { copyFileSync, existsSync } from "fs";

const DB_PATH = "data/cleverprices.db";
const BACKUP_PATH = "data/cleverprices-backup-pre-migration.db";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  console.log("🚀 CleverPrices Database Migration: Lean Schema");
  console.log(`📁 Database: ${DB_PATH}`);
  console.log(`🧪 Mode: ${isDryRun ? "DRY RUN (no changes)" : "LIVE"}\n`);

  if (!existsSync(DB_PATH)) {
    console.error("❌ Database not found!");
    process.exit(1);
  }

  // Step 1: Backup
  if (!isDryRun) {
    console.log("📦 Creating backup...");
    copyFileSync(DB_PATH, BACKUP_PATH);
    console.log(`   Backup saved to: ${BACKUP_PATH}\n`);
  }

  const db = new Database(DB_PATH);

  // Enable foreign keys and WAL mode for performance
  db.run("PRAGMA foreign_keys = OFF");
  db.run("PRAGMA journal_mode = WAL");

  try {
    // Step 2: Get current stats
    const tableList = db
      .query("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    const hasHistoryTable = tableList.some((t) => t.name === "price_history");

    const productCount = db
      .query("SELECT COUNT(*) as c FROM products")
      .get() as { c: number };
    const priceCount = db.query("SELECT COUNT(*) as c FROM prices").get() as {
      c: number;
    };

    let historyCountValue = 0;
    if (hasHistoryTable) {
      const res = db.query("SELECT COUNT(*) as c FROM price_history").get() as {
        c: number;
      };
      historyCountValue = res.c;
    }

    console.log("📊 Current State:");
    console.log(`   Products: ${productCount.c}`);
    console.log(`   Prices: ${priceCount.c}`);
    console.log(`   History rows: ${historyCountValue}\n`);

    // Step 3: Add new columns to prices table
    console.log("🔧 Phase 1: Adding new columns...");

    const pricesColumns = db.query("PRAGMA table_info(prices)").all() as {
      name: string;
    }[];
    const hasPrice = pricesColumns.some((c) => c.name === "price");
    const hasHistoryJson = pricesColumns.some((c) => c.name === "history_json");

    if (!hasPrice) {
      if (!isDryRun) {
        db.run("ALTER TABLE prices ADD COLUMN price REAL");
      }
      console.log("   ✅ Added 'price' column");
    } else {
      console.log("   ⏭️ 'price' column already exists");
    }

    if (!hasHistoryJson) {
      if (!isDryRun) {
        db.run("ALTER TABLE prices ADD COLUMN history_json TEXT");
      }
      console.log("   ✅ Added 'history_json' column");
    } else {
      console.log("   ⏭️ 'history_json' column already exists");
    }

    // Step 4: Backfill 'price' column with clever logic
    console.log("\n🔧 Phase 2: Backfilling 'price' column...");

    const hasAmazonPrice = pricesColumns.some(
      (c) => c.name === "amazon_price" || c.name === "amazonPrice",
    );
    const hasNewPrice = pricesColumns.some(
      (c) => c.name === "new_price" || c.name === "newPrice",
    );
    const hasBuyBoxPrice = pricesColumns.some(
      (c) => c.name === "buy_box_price" || c.name === "buyBoxPrice",
    );

    if (!isDryRun && (hasAmazonPrice || hasNewPrice || hasBuyBoxPrice)) {
      // Use COALESCE with NULLIF to ignore zero prices
      // Robustly handle both snake_case and camelCase
      const amz = hasAmazonPrice
        ? pricesColumns.some((c) => c.name === "amazon_price")
          ? "amazon_price"
          : "amazonPrice"
        : "NULL";
      const mkt = hasNewPrice
        ? pricesColumns.some((c) => c.name === "new_price")
          ? "new_price"
          : "newPrice"
        : "NULL";
      const bBox = hasBuyBoxPrice
        ? pricesColumns.some((c) => c.name === "buy_box_price")
          ? "buy_box_price"
          : "buyBoxPrice"
        : "NULL";

      db.run(`
        UPDATE prices SET price = COALESCE(
          NULLIF(${bBox}, 0),
          CASE 
            WHEN NULLIF(${amz}, 0) IS NOT NULL AND NULLIF(${mkt}, 0) IS NOT NULL 
            THEN MIN(${amz}, ${mkt})
            ELSE COALESCE(NULLIF(${amz}, 0), NULLIF(${mkt}, 0))
          END
        )
        WHERE price IS NULL
      `);

      const filledPrices = db
        .query("SELECT COUNT(*) as c FROM prices WHERE price IS NOT NULL")
        .get() as { c: number };
      console.log(`   ✅ Backfilled ${filledPrices.c} prices`);
    } else {
      console.log("   ⏭️ Skipped (dry run or source columns missing)");
    }

    // Step 5: Backfill history_json from price_history table
    console.log("\n🔧 Phase 3: Converting price_history to JSON blobs...");

    if (!isDryRun && hasHistoryTable && historyCountValue > 0) {
      // Get all unique product_id/country combinations
      const priceRows = db
        .query("SELECT id, product_id, country FROM prices")
        .all() as {
        id: number;
        product_id: number;
        country: string;
      }[];

      let converted = 0;
      const batchSize = 100;

      for (let i = 0; i < priceRows.length; i += batchSize) {
        const batch = priceRows.slice(i, i + batchSize);

        for (const row of batch) {
          // Get all history for this product/country, grouped by day (daily lows)
          const history = db
            .query(
              `
            SELECT 
              DATE(recorded_at / 1000, 'unixepoch') as d,
              MIN(price) as p
            FROM price_history 
            WHERE product_id = ? AND country = ?
            GROUP BY DATE(recorded_at / 1000, 'unixepoch')
            ORDER BY d DESC
            LIMIT 365
          `,
            )
            .all(row.product_id, row.country) as { d: string; p: number }[];

          if (history.length > 0) {
            // Store as compact JSON array: [{"d":"2025-01-22","p":43213}, ...]
            // Store price in cents to match Idealo approach
            const historyJson = JSON.stringify(
              history.map((h) => ({
                d: h.d,
                p: Math.round(h.p * 100), // Convert to cents
              })),
            );

            db.run("UPDATE prices SET history_json = ? WHERE id = ?", [
              historyJson,
              row.id,
            ]);
            converted++;
          }
        }

        if ((i + batchSize) % 500 === 0 || i + batchSize >= priceRows.length) {
          console.log(
            `   Progress: ${Math.min(i + batchSize, priceRows.length)}/${priceRows.length}`,
          );
        }
      }

      console.log(`   ✅ Converted history for ${converted} price records`);
    } else if (!hasHistoryTable || historyCountValue === 0) {
      console.log("   ⏭️ No history to convert");
    } else {
      console.log("   ⏭️ Skipped (dry run)");
    }

    // Step 6: Drop price_history table
    console.log("\n🔧 Phase 4: Dropping price_history table...");

    if (!isDryRun) {
      db.run("DROP TABLE IF EXISTS price_history");
    }
    console.log("   ✅ Dropped price_history table");

    // Step 7: Drop unused tables
    console.log("\n🔧 Phase 5: Dropping unused tables...");

    const tablesToDrop = [
      "affiliate_links",
      "product_identifiers",
      "product_offers",
    ];
    for (const table of tablesToDrop) {
      if (!isDryRun) {
        db.run(`DROP TABLE IF EXISTS ${table}`);
      }
      console.log(`   ✅ Dropped ${table}`);
    }

    // Step 8: Create new lean prices table (rebuild to drop columns)
    console.log("\n🔧 Phase 6: Rebuilding prices table with lean schema...");

    if (!isDryRun) {
      // Recreate prices table with final schema
      db.run(`
        CREATE TABLE prices_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          country TEXT NOT NULL,
          price REAL,
          used_price REAL,
          list_price REAL,
          price_avg_90 REAL,
          price_per_unit REAL,
          history_json TEXT,
          currency TEXT NOT NULL,
          source TEXT NOT NULL,
          last_updated INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
          UNIQUE(product_id, country)
        )
      `);

      // Copy data mapping camelCase/snake_case sources to final schema
      const col = (name: string) =>
        pricesColumns.some((c) => c.name === name)
          ? name
          : pricesColumns.some(
                (c) =>
                  c.name.toLowerCase() === name.replace("_", "").toLowerCase(),
              )
            ? pricesColumns.find(
                (c) =>
                  c.name.toLowerCase() === name.replace("_", "").toLowerCase(),
              )?.name
            : "NULL";

      db.run(`
        INSERT INTO prices_new (
          product_id, country, price, used_price, list_price,
          price_avg_90, price_per_unit, history_json, currency, source, last_updated
        )
        SELECT 
          ${col("product_id")}, ${col("country")}, ${col("price")}, ${col("used_price")}, ${col("list_price")},
          ${col("price_avg_90")}, ${col("price_per_unit")}, ${col("history_json")}, ${col("currency")}, ${col("source")}, ${col("last_updated")}
        FROM prices
      `);

      db.run("DROP TABLE prices");
      db.run("ALTER TABLE prices_new RENAME TO prices");

      // Recreate indexes
      db.run(
        "CREATE UNIQUE INDEX unique_price_product_country ON prices(product_id, country)",
      );
      db.run("CREATE INDEX idx_prices_product_id ON prices(product_id)");
      db.run("CREATE INDEX idx_prices_last_updated ON prices(last_updated)");
    }
    console.log("   ✅ Rebuilt prices table with lean schema");

    // Step 9: Clean up products table (remove unused columns)
    console.log("\n🔧 Phase 7: Rebuilding products table with lean schema...");

    if (!isDryRun) {
      // Recreate products table with final schema
      db.run(`
        CREATE TABLE products_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          asin TEXT NOT NULL UNIQUE,
          gtin TEXT,
          mpn TEXT,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          brand TEXT,
          manufacturer TEXT,
          category TEXT NOT NULL,
          image_url TEXT,
          capacity REAL,
          capacity_unit TEXT,
          normalized_capacity REAL,
          form_factor TEXT,
          technology TEXT,
          condition TEXT DEFAULT 'New',
          rating REAL,
          review_count INTEGER,
          sales_rank INTEGER,
          monthly_sold INTEGER,
          parent_asin TEXT,
          variation_attributes TEXT,
          specifications TEXT,
          energy_label TEXT,
          history_seeded INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )
      `);

      const productColumns = db.query("PRAGMA table_info(products)").all() as {
        name: string;
      }[];
      const pcol = (name: string) =>
        productColumns.some((c) => c.name === name)
          ? name
          : productColumns.some((c) => c.name === name.replace("_", ""))
            ? name.replace("_", "")
            : productColumns.some(
                  (c) => c.name === "imageUrl" && name === "image_url",
                )
              ? "imageUrl"
              : "NULL";

      db.run(`
        INSERT INTO products_new (
          asin, gtin, mpn, slug, title, brand, manufacturer, category, image_url,
          capacity, capacity_unit, normalized_capacity, form_factor, technology, condition,
          rating, review_count, sales_rank, monthly_sold, parent_asin, variation_attributes,
          specifications, energy_label, history_seeded, created_at, updated_at
        )
        SELECT 
          asin, gtin, mpn, slug, title, brand, manufacturer, category, ${pcol("image_url")},
          capacity, ${pcol("capacity_unit")}, ${pcol("normalized_capacity")}, ${pcol("form_factor")}, ${pcol("technology")}, condition,
          rating, ${pcol("review_count")}, ${pcol("sales_rank")}, ${pcol("monthly_sold")}, ${pcol("parent_asin")}, ${pcol("variation_attributes")},
          specifications, ${pcol("energy_label")}, ${pcol("history_seeded")}, ${pcol("created_at")}, ${pcol("updated_at")}
        FROM products
      `);

      db.run("DROP TABLE products");
      db.run("ALTER TABLE products_new RENAME TO products");

      // Recreate indexes
      db.run("CREATE UNIQUE INDEX products_asin_unique ON products(asin)");
      db.run("CREATE UNIQUE INDEX products_slug_unique ON products(slug)");
      db.run("CREATE INDEX idx_products_category ON products(category)");
      db.run("CREATE INDEX idx_products_brand ON products(brand)");
      db.run("CREATE INDEX idx_products_sales_rank ON products(sales_rank)");

      // Recreate FTS triggers
      db.run(`
        CREATE TRIGGER ai_products_search AFTER INSERT ON products BEGIN
          INSERT INTO products_search(id, title, brand, category)
          VALUES (new.id, new.title, new.brand, new.category);
        END
      `);
      db.run(`
        CREATE TRIGGER au_products_search AFTER UPDATE ON products BEGIN
          UPDATE products_search 
          SET title = new.title, brand = new.brand, category = new.category
          WHERE id = old.id;
        END
      `);
      db.run(`
        CREATE TRIGGER ad_products_search AFTER DELETE ON products BEGIN
          DELETE FROM products_search WHERE id = old.id;
        END
      `);
    }
    console.log("   ✅ Rebuilt products table with lean schema");

    // Step 10: Vacuum
    console.log("\n🔧 Phase 8: Vacuuming database...");

    if (!isDryRun) {
      db.run("VACUUM");
    }
    console.log("   ✅ Database vacuumed");

    // Step 11: Final stats
    console.log("\n📊 Migration Complete!");

    if (!isDryRun) {
      const newProductCount = db
        .query("SELECT COUNT(*) as c FROM products")
        .get() as { c: number };
      const newPriceCount = db
        .query("SELECT COUNT(*) as c FROM prices")
        .get() as { c: number };
      const tablesLeft = db
        .query(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'products_search%'",
        )
        .all() as { name: string }[];

      console.log(`   Products: ${newProductCount.c}`);
      console.log(`   Prices: ${newPriceCount.c}`);
      console.log(`   Tables: ${tablesLeft.map((t) => t.name).join(", ")}`);
    }

    console.log("\n✅ Migration successful!");
    console.log(`   Backup available at: ${BACKUP_PATH}`);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.log(`   Restore from backup: cp ${BACKUP_PATH} ${DB_PATH}`);
    process.exit(1);
  } finally {
    db.close();
  }
}

main().catch(console.error);
