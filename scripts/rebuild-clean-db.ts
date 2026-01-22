#!/usr/bin/env bun
/**
 * Total Database Rebuild & Repair
 *
 * This script restores data integrity by:
 * 1. Rebuilding from lite.db (Clean product/price source)
 * 2. Rebuilding history from orphaned_history.backup (Original history source)
 * 3. Preserving original IDs to fix broken relations
 * 4. Fixing timestamp scaling (Seconds vs Milliseconds)
 */

import { Database } from "bun:sqlite";
import { copyFileSync, existsSync } from "fs";

const TARGET_DB = "data/cleverprices.db";
const LITE_DB = "data/cleverprices-lite.db";
const HISTORY_DB = "data/cleverprices.orphaned_history.backup";
const BACKUP_DB = "data/cleverprices-repair-backup.db";

async function main() {
  console.log("🛠️  CleverPrices Total Database Repair");

  if (!existsSync(LITE_DB) || !existsSync(HISTORY_DB)) {
    console.error("❌ Missing source databases!");
    process.exit(1);
  }

  // 1. Final Backup
  console.log("📦 Creating backup of current state...");
  if (existsSync(TARGET_DB)) {
    copyFileSync(TARGET_DB, BACKUP_DB);
  }

  // 2. Open Databases
  const lite = new Database(LITE_DB);
  const hist = new Database(HISTORY_DB);

  // Create fresh target (overwrites existing)
  if (existsSync(TARGET_DB)) {
    // We'll build in a temp file and swap
  }
  const TEMP_DB = "data/cleverprices-repairing.db";
  if (existsSync(TEMP_DB)) {
    const fs = require("fs");
    fs.unlinkSync(TEMP_DB);
  }
  const target = new Database(TEMP_DB);

  target.run("PRAGMA journal_mode = WAL");
  target.run("PRAGMA foreign_keys = OFF");

  try {
    // 3. Setup Schema
    console.log("🔧 Initializing Lean Schema...");
    target.run(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
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

    target.run(`
      CREATE TABLE prices (
        id INTEGER PRIMARY KEY,
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

    // 4. Migrate Products (Preserving IDs)
    console.log("📦 Restoring Products...");
    const productsList = lite.query("SELECT * FROM products").all() as any[];
    const insertProduct = target.prepare(`
      INSERT INTO products (
        id, asin, gtin, mpn, slug, title, brand, manufacturer, category, image_url,
        capacity, capacity_unit, normalized_capacity, form_factor, technology, condition,
        rating, review_count, sales_rank, monthly_sold, specifications, energy_label,
        created_at, updated_at
      ) VALUES (
        $id, $asin, $gtin, $mpn, $slug, $title, $brand, $manufacturer, $category, $image_url,
        $capacity, $capacity_unit, $normalized_capacity, $form_factor, $technology, $condition,
        $rating, $review_count, $sales_rank, $monthly_sold, $specifications, $energy_label,
        $created_at, $updated_at
      )
    `);

    target.transaction(() => {
      for (const p of productsList) {
        insertProduct.run({
          $id: p.id,
          $asin: p.asin,
          $gtin: p.gtin,
          $mpn: p.mpn,
          $slug: p.slug,
          $title: p.title,
          $brand: p.brand,
          $manufacturer: p.manufacturer,
          $category: p.category,
          $image_url: p.image_url || p.imageUrl,
          $capacity: p.capacity,
          $capacity_unit: p.capacity_unit || p.capacityUnit,
          $normalized_capacity: p.normalized_capacity || p.normalizedCapacity,
          $form_factor: p.form_factor || p.formFactor,
          $technology: p.technology,
          $condition: p.condition,
          $rating: p.rating,
          $review_count: p.review_count || p.reviewCount,
          $sales_rank: p.sales_rank || p.salesRank,
          $monthly_sold: p.monthly_sold || p.monthlySold,
          $specifications: p.specifications,
          $energy_label: p.energy_label || p.energyLabel,
          $created_at: p.created_at || Date.now(),
          $updated_at: p.updated_at || Date.now(),
        });
      }
    })();
    console.log(`   ✅ Restored ${productsList.length} products.`);

    // 5. Migrate Prices & Consolidate
    console.log("💰 Restoring Prices & Consolidating...");
    const pricesList = lite.query("SELECT * FROM prices").all() as any[];
    const insertPrice = target.prepare(`
      INSERT INTO prices (
        id, product_id, country, price, used_price, list_price,
        price_avg_90, price_per_unit, currency, source, last_updated
      ) VALUES (
        $id, $product_id, $country, $price, $used_price, $list_price,
        $price_avg_90, $price_per_unit, $currency, $source, $last_updated
      )
    `);

    target.transaction(() => {
      for (const pr of pricesList) {
        // Consolidation logic
        const amz = pr.amazon_price || 0;
        const nxt = pr.new_price || 0;
        const bbox = pr.buy_box_price || 0;

        let cleverPrice = bbox;
        if (cleverPrice <= 0) {
          cleverPrice =
            amz > 0 && nxt > 0 ? Math.min(amz, nxt) : amz || nxt || 0;
        }

        insertPrice.run({
          $id: pr.id,
          $product_id: pr.product_id,
          $country: pr.country,
          $price: cleverPrice > 0 ? cleverPrice : null,
          $used_price: pr.used_price || null,
          $list_price: pr.list_price || null,
          $price_avg_90: pr.price_avg_90 || pr.price_avg_30 || null,
          $price_per_unit: pr.price_per_unit || null,
          $currency: pr.currency || "EUR",
          $source: pr.source || "keepa",
          $last_updated: pr.last_updated || Date.now(),
        });
      }
    })();
    console.log(`   ✅ Restored ${pricesList.length} prices.`);

    // 6. Migrate History from Backup
    console.log("📈 Rebuilding History (O(N) mapping, fixing timestamps)...");

    // Group history by product/country
    // Map of product_id|country -> history rows
    let historyMigrated = 0;
    const allPrices = target
      .query("SELECT id, product_id, country FROM prices")
      .all() as any[];

    for (let i = 0; i < allPrices.length; i += 50) {
      const batch = allPrices.slice(i, i + 50);

      for (const pr of batch) {
        const rows = hist
          .query(
            `
          SELECT recorded_at, price 
          FROM price_history 
          WHERE product_id = ? AND country = ?
          ORDER BY recorded_at DESC
          LIMIT 365
        `,
          )
          .all(pr.product_id, pr.country) as {
          recorded_at: number;
          price: number;
        }[];

        if (rows.length > 0) {
          const historyObj: Record<string, number> = {};

          for (const h of rows) {
            // Timestamp Fix: Detect seconds vs ms
            // 1.7e9 is roughly 2024 in seconds. Anything smaller is definitely seconds.
            const date = new Date(
              h.recorded_at < 5000000000 ? h.recorded_at * 1000 : h.recorded_at,
            );
            const dateStr = date.toISOString().split("T")[0];

            const priceCents = Math.round(h.price * 100);
            // Daily low
            if (!historyObj[dateStr] || priceCents < historyObj[dateStr]) {
              historyObj[dateStr] = priceCents;
            }
          }

          target.run("UPDATE prices SET history_json = ? WHERE id = ?", [
            JSON.stringify(historyObj),
            pr.id,
          ]);
          historyMigrated++;
        }
      }

      if ((i + 50) % 500 === 0 || i + 50 >= allPrices.length) {
        console.log(
          `   Progress: ${Math.min(i + 50, allPrices.length)} / ${allPrices.length}`,
        );
      }
    }
    console.log(`   ✅ Migrated history for ${historyMigrated} price records.`);

    // 7. Cleanup & Finalize
    console.log("🧹 Finalizing search indexes and vacuuming...");

    // FTS Rebuild
    target.run(
      "CREATE VIRTUAL TABLE products_search USING fts5(id UNINDEXED, title, brand, category, content='products', content_rowid='id')",
    );
    target.run(
      "INSERT INTO products_search(id, title, brand, category) SELECT id, title, brand, category FROM products",
    );

    target.run("VACUUM");

    // Swap DBs
    console.log("🔄 Swapping databases...");
    const fs = require("fs");
    if (existsSync(TARGET_DB)) {
      // fs.renameSync(TARGET_DB, TARGET_DB + ".old");
    }
    fs.copyFileSync(TEMP_DB, TARGET_DB);
    console.log("✅ Database repair successful!");
  } catch (error) {
    console.error("❌ Repair failed:", error);
  } finally {
    lite.close();
    hist.close();
    target.close();
  }
}

main().catch(console.error);
