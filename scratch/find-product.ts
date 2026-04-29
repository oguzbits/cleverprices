import { db } from "../src/db";
import { products } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  const arg = process.argv[2];
  if (arg === "--count") {
    const category = process.argv[3] || "kabel-adapter";
    const result = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.category, category));
    console.log(JSON.stringify(result, null, 2));
  } else {
    const slug = arg || "samsung-galaxy-s23-smartphone-3-900mah-akku-128gb-gxmt";
    const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    console.log(JSON.stringify(result, null, 2));
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
