import { createClient } from "@libsql/client";

const TEST_DB = "file:data/cleverprices-test.db";

async function main() {
  const client = createClient({ url: TEST_DB });

  console.log("🔍 Inspecting enriched products in Sandbox...");

  // Notebooks
  const laptops = await client.execute(
    "SELECT title, specifications FROM products WHERE category = 'notebooks' LIMIT 3",
  );
  console.log("\n💻 NOTEBOOKS:");
  laptops.rows.forEach((r) => {
    console.log(`Title: ${r.title}`);
    console.log(`Specs: ${r.specifications}\n`);
  });

  // CPUs
  const cpus = await client.execute(
    "SELECT title, specifications FROM products WHERE category = 'prozessoren' OR category = 'cpu' LIMIT 3",
  );
  console.log("\n⚙️ CPUs:");
  cpus.rows.forEach((r) => {
    console.log(`Title: ${r.title}`);
    console.log(`Specs: ${r.specifications}\n`);
  });
}

main().catch(console.error);
