#!/usr/bin/env bun
import { eq } from "drizzle-orm";
import { db, products } from "../../src/db";
import { normalizeVariantAttributes } from "../../src/lib/utils/variants";

/**
 * Variant Attribute Fixer
 *
 * Permanently fix mislabeled and messy variation attributes in the database.
 * This moves the "logic as a bandage" from the frontend to the data layer.
 */
async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("🛠️  CleverPrices Variant Attribute Guard");
  console.log("Searching for products with variation attributes...");

  const candidates = await db.query.products.findMany();

  console.log(`📋 Found ${candidates.length} products to evaluate.`);

  let fixCount = 0;
  let errorCount = 0;

  for (const p of candidates) {
    try {
      const original = p.variationAttributes || "";
      const normalized = normalizeVariantAttributes({
        title: p.title,
        variationAttributes: original,
        category: p.category,
      });

      if (normalized && normalized !== original) {
        if (!isDryRun) {
          await db
            .update(products)
            .set({
              variationAttributes: normalized,
              updatedAt: new Date(),
            })
            .where(eq(products.asin, p.asin));
        } else {
          console.log(`[DRY RUN] Would fix ${p.asin}:`);
          console.log(`  OLD: ${original}`);
          console.log(`  NEW: ${normalized}`);
        }
        fixCount++;
      }
    } catch (e: any) {
      console.error(`❌ Error fixing ${p.asin}:`, e.message);
      errorCount++;
    }

    if ((fixCount + errorCount) % 100 === 0 && fixCount > 0) {
      console.log(`⏳ Progress: Evaluated ${fixCount + errorCount}...`);
    }
  }

  console.log("\n✨ Fix Complete!");
  console.log(`------------------------------`);
  console.log(`✅ Fixed/Normalized: ${fixCount}`);
  console.log(`❌ Errors:           ${errorCount}`);
  console.log(`------------------------------`);

  if (isDryRun) {
    console.log("🧪 Dry run complete. No changes were made to the database.");
  } else {
    console.log("🚀 Database has been updated with clean variant labels.");
  }
}

main().catch(console.error);
