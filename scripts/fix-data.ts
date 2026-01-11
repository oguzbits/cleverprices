import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

const client = createClient({ url: "file:./data/cleverprices.db" });
const db = drizzle(client);

async function main() {
  console.log("Fixing mismatching category data...");

  // Update Samsung 990 PRO category 'ssd' -> 'hard-drives'
  const result = await db
    .update(products)
    .set({ category: "hard-drives" })
    .where(eq(products.slug, "samsung-990-pro-2tb"))
    .returning();

  if (result.length > 0) {
    console.log(`Updated product ${result[0].slug} category to 'hard-drives'`);
  } else {
    console.log("Product not found or not updated.");
  }
}

main().catch(console.error);
