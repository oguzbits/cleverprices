import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/sqlite3";
import { products, prices } from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getChildCategories } from "../src/lib/categories";

// Initialize DB directly for the script
const client = createClient({
  url: "file:./data/cleverprices.db",
});
const db = drizzle(client);

async function main() {
  const parentSlug = "electronics";
  const childCategories = getChildCategories(parentSlug);

  console.log(`Checking parent category: ${parentSlug}`);
  console.log(
    `Found ${childCategories.length} child categories: ${childCategories.map((c) => c.slug).join(", ")}`,
  );

  // Check total products count
  const allProds = await db.select().from(products);
  console.log(`\nTotal products in DB: ${allProds.length}`);

  // Show product distribution by category
  const categoryCounts: Record<string, number> = {};
  allProds.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  console.log("Product counts by category:");
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count}`);
  });

  console.log("\nChecking specific child categories...");
  for (const child of childCategories.slice(0, 5)) {
    // Check first 5 to avoid spam
    const catProds = await db
      .select()
      .from(products)
      .where(eq(products.category, child.slug));
    console.log(`Category ${child.slug}: ${catProds.length} products found`);
    if (catProds.length > 0) {
      console.log(`  Sample: ${catProds[0].title} (Price: Checking...)`);

      // Check price for sample
      const price = await db
        .select()
        .from(prices)
        .where(eq(prices.productId, catProds[0].id));
      console.log(
        `  Price entries: ${price.length} (${price.map((p) => `${p.country}: ${p.amazonPrice}`).join(", ")})`,
      );
    }
  }
}

main().catch(console.error);
