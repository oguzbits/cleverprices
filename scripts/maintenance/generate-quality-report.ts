import { db } from "../../src/db";
import { CATEGORY_SCHEMAS } from "../import/data-validator";

async function report() {
  console.log("📊 CleverPrices Data Quality & Coverage Report");
  console.log("-------------------------------------------");

  const stats = await db.query.products.findMany({
    columns: {
      category: true,
      asin: true,
      specifications: true,
    },
  });

  const categoryMap: Record<
    string,
    { total: number; withSpecs: number; totalKeys: number }
  > = {};

  for (const p of stats) {
    const cat = p.category || "uncategorized";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { total: 0, withSpecs: 0, totalKeys: 0 };
    }

    categoryMap[cat].total++;

    if (
      p.specifications &&
      p.specifications !== "{}" &&
      p.specifications !== "[]"
    ) {
      try {
        const specs = JSON.parse(p.specifications);
        const keys = Object.keys(specs).length;
        if (keys > 0) {
          categoryMap[cat].withSpecs++;
          categoryMap[cat].totalKeys += keys;
        }
      } catch (e) {}
    }
  }

  const sortedCategories = Object.entries(categoryMap).sort(
    (a, b) => b[1].total - a[1].total,
  );

  console.log(
    "| Category | Products | Enriched % | Avg Keys | Target (Schema) |",
  );
  console.log("| :--- | :--- | :--- | :--- | :--- |");

  for (const [cat, data] of sortedCategories) {
    const enrichedPct = ((data.withSpecs / data.total) * 100).toFixed(1);
    const avgKeys = (
      data.withSpecs > 0 ? data.totalKeys / data.withSpecs : 0
    ).toFixed(1);
    const targetKeys = (CATEGORY_SCHEMAS as any)[cat]?.length || "-";

    console.log(
      `| ${cat} | ${data.total} | ${enrichedPct}% | ${avgKeys} | ${targetKeys} |`,
    );
  }

  console.log("\n✅ Report generated successfully.");
}

report().catch(console.error);
