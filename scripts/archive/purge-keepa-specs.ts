import { isNotNull, sql } from "drizzle-orm";
import { db, products } from "../../src/db";

async function purge() {
  console.log("🧹 CleverPrices: Professional Specification Purge");
  console.log("----------------------------------------------");
  console.log(
    "Goal: Remove all non-official (Keepa scavenged) specs to ensure fidelity.",
  );

  // 1. Clear the catch-all 'specifications' column
  // We keep 'official_specifications' (Icecat) and 'keepa_features' (raw text)
  const result = await db.update(products).set({
    specifications: "{}", // Reset to empty JSON
    completenessScore: 0, // Reset score as Keepa specs are gone
    updatedAt: new Date(),
  });

  console.log(
    "✅ Successfully cleared 'specifications' column for all products.",
  );

  // 2. Count remaining official data
  const officialCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(isNotNull(products.officialSpecifications));

  console.log(
    `💎 Preserved ${officialCount[0].count} official (Icecat) spec sheets.`,
  );
  console.log("----------------------------------------------");
  console.log("✨ Catalyst ready for High-Fidelity Manufacturer Scrapers.");
}

purge().catch(console.error);
