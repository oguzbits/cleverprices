import { client } from "./src/db/index";

async function optimizeDatabase() {
  console.log("🚀 Optimizing database indexes for performance...");

  try {
    // 1. Sales Rank Index (Primary for popular section)
    await client.execute(
      "CREATE INDEX IF NOT EXISTS idx_products_sales_rank ON products (sales_rank)",
    );

    // 2. Review Count & Rating Index
    await client.execute(
      "CREATE INDEX IF NOT EXISTS idx_products_reviews ON products (review_count, rating)",
    );

    // 3. Created At Index (For new arrivals)
    await client.execute(
      "CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at)",
    );

    // 4. Condition Index
    await client.execute(
      "CREATE INDEX IF NOT EXISTS idx_products_condition ON products (condition)",
    );

    console.log("✅ Database indexes optimized successfully!");

    // Run ANALYZE to ensure the query planner uses the new indexes
    await client.execute("ANALYZE");
    console.log("✅ Database statistics updated.");
  } catch (error) {
    console.error("❌ Optimization failed:", error);
  }
}

optimizeDatabase();
