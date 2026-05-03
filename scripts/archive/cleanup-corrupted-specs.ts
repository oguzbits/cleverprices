import { eq, like, or } from "drizzle-orm";

import { db, products } from "../../src/db";

async function cleanup() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log("🧹 CleverPrices Emergency Spec Cleanup");

  // Confirmed marketing junk keywords
  const junkKeywords = ["hast", "haben", "gespeichert", "exklusiv"];

  // 1. Find candidates (products with likely corrupted specs)
  const conditions = junkKeywords.map((k) =>
    like(products.specifications, `%${k}%`),
  );
  const candidates = await db.query.products.findMany({
    where: or(...conditions),
  });

  console.log(
    `🔍 Found ${candidates.length} products with potential corruption.`,
  );

  let totalRemoved = 0;
  let productsAffected = 0;

  for (const product of candidates) {
    if (!product.specifications) continue;

    try {
      const specs = JSON.parse(product.specifications);
      const cleanSpecs: Record<string, any> = {};
      let removedFromThisProduct = 0;

      for (const [key, val] of Object.entries(specs)) {
        const stringVal = String(val).toLowerCase();
        const isJunk =
          junkKeywords.some((junk) => stringVal.includes(junk)) ||
          stringVal.length > 50;

        if (isJunk) {
          console.log(
            `  🗑️ Removing junk: [${key}: ${val}] from ASIN ${product.asin}`,
          );
          removedFromThisProduct++;
        } else {
          cleanSpecs[key] = val;
        }
      }

      if (removedFromThisProduct > 0) {
        totalRemoved += removedFromThisProduct;
        productsAffected++;

        if (!isDryRun) {
          await db
            .update(products)
            .set({
              specifications: JSON.stringify(cleanSpecs),
              updatedAt: new Date(),
            })
            .where(eq(products.id, product.id));
        }
      }
    } catch (e) {
      console.error(`  ❌ Failed to parse specs for ${product.asin}`);
    }
  }

  console.log("\n📊 Cleanup Summary:");
  console.log(`------------------------------`);
  console.log(`Products Cleaned:  ${productsAffected}`);
  console.log(`Total Keys Removed: ${totalRemoved}`);
  console.log(`Mode:            ${isDryRun ? "🧪 DRY RUN" : "🚀 LIVE"}`);
  console.log(`------------------------------`);
}

cleanup().catch(console.error);
