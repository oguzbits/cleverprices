import { count } from "drizzle-orm";
import { db } from "../../src/db";
import { products } from "../../src/db/schema";

async function main() {
  console.log("Querying database for enriched products...");

  const result = await db
    .select({
      source: products.specificationsSource,
      status: products.enrichmentStatus,
      count: count(),
    })
    .from(products)
    .groupBy(products.specificationsSource, products.enrichmentStatus);

  console.log("\nEnrichment Status Breakdown:");
  console.table(result);

  const processed = result
    .filter((r) => r.status === "processed")
    .reduce((acc, curr) => acc + curr.count, 0);

  console.log(`\nTotal Processed/Enriched: ${processed}`);
}

main().catch(console.error);
