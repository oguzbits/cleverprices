import { Database } from "bun:sqlite";

const DB_PATH = "data/cleverprices.db";

async function main() {
  const db = new Database(DB_PATH);

  console.log("📊 CLEVERPRICES SPECIFICATION DENSITY REPORT\n");
  console.log(
    `${"Category".padEnd(25)} | ${"Avg Specs".padEnd(10)} | ${"Total Products"}`,
  );
  console.log("-".repeat(55));

  const report = db
    .query(
      `
        SELECT 
            category, 
            COUNT(*) as count,
            AVG(json_array_length(json_keys(specifications))) as avg_specs
        FROM products 
        WHERE specifications IS NOT NULL AND specifications != '{}'
        GROUP BY category
        ORDER BY avg_specs DESC
    `,
    )
    .all() as any[];

  report.forEach((row) => {
    console.log(
      `${row.category.padEnd(25)} | ${row.avg_specs.toFixed(2).padEnd(10)} | ${row.count}`,
    );
  });

  const totalAvg = db
    .query(
      "SELECT AVG(json_array_length(json_keys(specifications))) as total_avg FROM products WHERE specifications != '{}'",
    )
    .get() as any;
  console.log("-".repeat(55));
  console.log(
    `${"TOTAL AVERAGE".padEnd(25)} | ${totalAvg.total_avg.toFixed(2).padEnd(10)}`,
  );
}

main().catch(console.error);
