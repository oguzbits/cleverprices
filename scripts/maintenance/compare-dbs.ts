import { createClient } from "@libsql/client";

const LIVE_DB = "file:data/cleverprices.db";
const TEST_DB = "file:data/cleverprices-test.db";

async function getStats(url: string) {
  const client = createClient({ url });
  const eans = await client.execute(
    "SELECT count(*) as count FROM products WHERE gtin IS NOT NULL",
  );
  const mpns = await client.execute(
    "SELECT count(*) as count FROM products WHERE mpn IS NOT NULL",
  );
  const specs = await client.execute(
    "SELECT count(*) as count FROM products WHERE specifications != '{}'",
  );
  const total = await client.execute("SELECT count(*) as count FROM products");

  // Enrichment Depth Check
  const samples = await client.execute(
    "SELECT specifications FROM products LIMIT 1000",
  );
  let totalKeys = 0;
  let sampleCount = 0;
  samples.rows.forEach((r) => {
    try {
      const obj = JSON.parse(r.specifications as string);
      totalKeys += Object.keys(obj).length;
      sampleCount++;
    } catch (e) {}
  });
  const avgKeys = sampleCount > 0 ? (totalKeys / sampleCount).toFixed(2) : "0";

  return {
    total: Number(total.rows[0].count),
    eans: Number(eans.rows[0].count),
    mpns: Number(mpns.rows[0].count),
    specs: Number(specs.rows[0].count),
    avgKeys,
  };
}

async function main() {
  console.log("📊 Comparing Databases...");

  const live = await getStats(LIVE_DB);
  const test = await getStats(TEST_DB);

  console.log("\n--- LIVE DATABASE ---");
  console.log(`Total Products: ${live.total}`);
  console.log(`Products with EANs: ${live.eans}`);
  console.log(`Products with MPNs: ${live.mpns}`);
  console.log(
    `Products with Specs: ${live.specs} (Avg: ${live.avgKeys} per item)`,
  );

  console.log("\n--- TEST DATABASE (After Import) ---");
  console.log(`Total Products: ${test.total}`);
  console.log(`Products with EANs: ${test.eans}`);
  console.log(`Products with MPNs: ${test.mpns}`);
  console.log(
    `Products with Specs: ${test.specs} (Avg: ${test.avgKeys} per item)`,
  );

  console.log("\n--- DELTA (Improvement) ---");
  console.log(`New EANs Added: ${test.eans - live.eans}`);
  console.log(`New MPNs Added: ${test.mpns - live.mpns}`);
  console.log(`Specs Populated: ${test.specs - live.specs}`);
  console.log(
    `Average Spec Keys Increase: ${(Number(test.avgKeys) - Number(live.avgKeys)).toFixed(2)}`,
  );

  if (
    test.eans > live.eans ||
    test.specs > live.specs ||
    Number(test.avgKeys) > Number(live.avgKeys)
  ) {
    console.log("\n✅ SUCCESS: The import successfully enriched the data!");
    console.log(
      "If you are happy with these results, you can overwrite the live DB or run the import on live.",
    );
  } else {
    console.warn(
      "\n⚠️ WARNING: No enrichment detected. Check your CSV headers or regex patterns.",
    );
  }
}

main().catch(console.error);
