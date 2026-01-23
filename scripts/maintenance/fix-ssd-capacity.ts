/**
 * Migration script to fix storage capacity data
 * Parses specifications.Size and updates capacity + capacity_unit
 * Handles: ssds, hard-drives, speicherkarten (sd-cards)
 */

import { Database } from "bun:sqlite";

const db = new Database("./data/cleverprices.db");

const STORAGE_CATEGORIES = ["ssds", "hard-drives", "speicherkarten"];

const updateStmt = db.prepare(`
  UPDATE products 
  SET capacity = ?, capacity_unit = ?, normalized_capacity = ?
  WHERE id = ?
`);

for (const category of STORAGE_CATEGORIES) {
  console.log(`\n========== Processing ${category} ==========`);

  // Get all products with specifications
  const products = db
    .prepare(
      `SELECT id, title, specifications FROM products WHERE category = ? AND specifications IS NOT NULL`,
    )
    .all(category) as { id: number; title: string; specifications: string }[];

  console.log(`Found ${products.length} products with specifications`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    try {
      const specs = JSON.parse(product.specifications);
      const sizeStr = specs.Size as string | undefined;

      if (!sizeStr) {
        skipped++;
        continue;
      }

      // Parse capacity from Size string
      // Patterns: "2 TB", "500GB", "1TB Heatsink", "240GB Retail 10 Pack", "1To", "128Go", "512G"
      // Added negative lookahead (?![a-zA-Z]) to exclude "Gbps", "Gbit" etc.
      const match = sizeStr.match(
        /^(\d+(?:\.\d+)?)\s*(TB|GB|To|Go|G)(?![a-zA-Z])/i,
      );

      if (!match) {
        console.log(
          `Could not parse: "${sizeStr}" for ${product.title.slice(0, 50)}`,
        );
        skipped++;
        continue;
      }

      let capacity = parseFloat(match[1]);
      let unit = match[2].toUpperCase();

      // Normalize unit names (To = TB in French, Go = GB in French, G = GB)
      if (unit === "TO") unit = "TB";
      if (unit === "GO" || unit === "G") unit = "GB";

      // Calculate normalized capacity in GB
      let normalizedCapacity = unit === "TB" ? capacity * 1000 : capacity;

      // Snapping logic: Normalize binary sizes (TiB/GiB equivalent) to decimal standards
      // This fixes redundant options like "1 TB" vs "1.0 TB" (1024 GB)
      if (normalizedCapacity === 1024) normalizedCapacity = 1000; // 1 TB
      if (normalizedCapacity === 2048) normalizedCapacity = 2000; // 2 TB
      if (normalizedCapacity === 4096) normalizedCapacity = 4000; // 4 TB
      if (normalizedCapacity === 8192) normalizedCapacity = 8000; // 8 TB
      if (normalizedCapacity === 16384) normalizedCapacity = 16000; // 16 TB

      // Update the database
      updateStmt.run(capacity, unit, normalizedCapacity, product.id);
      updated++;

      if (updated <= 3) {
        console.log(
          `Updated: ${capacity} ${unit} (${normalizedCapacity} GB) - ${product.title.slice(0, 50)}`,
        );
      }
    } catch (e) {
      console.error(`Error processing ${product.id}: ${e}`);
      skipped++;
    }
  }

  console.log(`✅ Updated ${updated} products`);
  console.log(`⚠️  Skipped ${skipped} products (no Size or unparseable)`);

  // Also update products without specifications by parsing title
  console.log(`--- Parsing titles for ${category} without specifications ---`);

  const productsNoSpecs = db
    .prepare(
      `SELECT id, title FROM products WHERE category = ? AND (specifications IS NULL OR specifications = '')`,
    )
    .all(category) as { id: number; title: string }[];

  console.log(
    `Found ${productsNoSpecs.length} products without specifications`,
  );

  let titleUpdated = 0;

  for (const product of productsNoSpecs) {
    // Parse capacity from title
    // Patterns: "Samsung 990 PRO 2 TB", "SanDisk 500 GB", "Crucial 1TB"
    // Added negative lookahead to exclude Gbps
    const match = product.title.match(/(\d+(?:\.\d+)?)\s*(TB|GB)(?![a-zA-Z])/i);

    if (!match) {
      continue;
    }

    let capacity = parseFloat(match[1]);
    let unit = match[2].toUpperCase();
    let normalizedCapacity = unit === "TB" ? capacity * 1000 : capacity;

    // Snapping logic
    if (normalizedCapacity === 1024) normalizedCapacity = 1000;
    if (normalizedCapacity === 2048) normalizedCapacity = 2000;
    if (normalizedCapacity === 4096) normalizedCapacity = 4000;
    if (normalizedCapacity === 8192) normalizedCapacity = 8000;
    if (normalizedCapacity === 16384) normalizedCapacity = 16000;

    updateStmt.run(capacity, unit, normalizedCapacity, product.id);
    titleUpdated++;
  }

  console.log(`✅ Updated ${titleUpdated} products from title parsing`);
}

db.close();
console.log("\n🎉 Migration complete!");
