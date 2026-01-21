#!/usr/bin/env bun
/**
 * Category Validation Script
 * Detects miscategorized products by checking for cross-category keyword violations
 */

import { sql } from "drizzle-orm";
import { db } from "../src/db";

// Keywords that should NOT appear in each category (refined to reduce false positives)
const VIOLATIONS: Record<string, string[]> = {
  // Headphones should not have storage products
  headphones: [
    "SSD",
    "NVMe",
    "Festplatte HDD",
    "Grafikkarte",
    "Mainboard",
    "Prozessor Intel",
    "Prozessor AMD",
  ],
  // SSDs should not have peripherals
  ssds: [
    "Kopfhörer",
    "Headset Mikrofon",
    "Gaming Maus",
    "Mechanische Tastatur",
  ],
  // Notebooks is clean - gaming laptops can have RTX GPUs
  notebooks: ["Desktop Tower ATX"],
  // CPU: "ohne Kühler" is fine (means without cooler), only catch actual coolers
  cpu: ["CPU-Kühler", "Wasserkühler AIO", "Tower Kühler"],
  // GPU: Cable in product name is normal for GPU accessories, but GPU itself shouldn't be in this category
  gpu: ["Halterung Ständer", "GPU Bracket"],
  // RAM should not have storage
  ram: ["Interne SSD", "Externe Festplatte", "USB Stick"],
  // Monitors: "Laptop Monitor" or "für MacBook Pro/Air" means portable monitor, not MacBook
  // Only catch actual laptops being miscategorized
  monitors: ["Notebook Intel i7", "MacBook Air M4"],
  // Hard drives: strict - no SSDs
  "hard-drives": ["NVMe SSD", "M.2 SSD", "Interne SSD"],
  // External storage: "Desktop kompatibel" is fine for portables
  "external-storage": ["Ratchet", "Spider-Man"],
  // Power supplies: no Raspberry Pi kits
  "power-supplies": ["Raspberry Pi Starter", "Raspberry Pi 4 Kit"],
};

async function validate() {
  console.log("🔍 Category Validation Report\n");

  let totalViolations = 0;

  for (const [category, keywords] of Object.entries(VIOLATIONS)) {
    const conditions = keywords
      .map((kw) => `title LIKE '%${kw}%'`)
      .join(" OR ");
    const query = sql.raw(`
      SELECT asin, title FROM products 
      WHERE category = '${category}' AND (${conditions})
      LIMIT 10
    `);

    const violations = await db.all(query);

    if (violations.length > 0) {
      console.log(`❌ ${category}: ${violations.length} violation(s)`);
      for (const v of violations as any[]) {
        console.log(`   - ${v.asin}: ${v.title.substring(0, 60)}...`);
      }
      totalViolations += violations.length;
    } else {
      console.log(`✅ ${category}: Clean`);
    }
  }

  console.log(`\n📊 Total violations: ${totalViolations}`);

  if (totalViolations > 0) {
    process.exit(1);
  }
}

validate().catch(console.error);
