import { eq, sql } from "drizzle-orm";
import { db, dbReady } from "../../src/db";
import { products } from "../../src/db/schema";

async function cleanupPollutedData() {
  console.log("🧹 Starting Data Cleanup (Mismatched GTINs)...");
  await dbReady;

  // Find products where any scraped GTIN identifier inside JSON doesn't match the row's GTIN
  const allEnriched = await db
    .select({
      id: products.id,
      title: products.title,
      gtin: products.gtin,
      officialSpecifications: products.officialSpecifications,
    })
    .from(products)
    .where(sql`official_specifications IS NOT NULL`);

  console.log(
    `🔍 Checking ${allEnriched.length} enriched products for mismatches...`,
  );

  let fixCount = 0;
  for (const item of allEnriched) {
    let specs: any = item.officialSpecifications;

    // Parse if it's a string (Drizzle/SQLite behavior)
    if (typeof specs === "string") {
      try {
        specs = JSON.parse(specs);
      } catch (e) {
        continue;
      }
    }

    if (!specs || typeof specs !== "object") continue;

    // Check all possible GTIN keys extracted by the scraper
    const scrapedGtin = String(
      specs.gtin || specs.EAN || specs.ean || "",
    ).trim();
    const dbGtin = String(item.gtin || "").trim();

    // If scraped GTIN exists and doesn't match ANY in our DB GTIN list
    if (
      scrapedGtin &&
      dbGtin &&
      !dbGtin.includes(scrapedGtin) &&
      !scrapedGtin.includes(dbGtin)
    ) {
      console.log(`❌ Mismatch for ID ${item.id}:`);
      console.log(`   DB GTIN: ${dbGtin}`);
      console.log(`   Scraped: ${scrapedGtin}`);
      console.log(`   Title: ${item.title}`);

      // Reset this product
      await db
        .update(products)
        .set({
          officialSpecifications: null,
          specificationsSource: null,
          enrichmentStatus: "pending" as any,
          lastEnrichedAt: null,
        })
        .where(eq(products.id, item.id));

      fixCount++;
    }
  }

  console.log(`\n✅ Cleanup complete. Reset ${fixCount} polluted products.`);
  process.exit(0);
}

cleanupPollutedData();
