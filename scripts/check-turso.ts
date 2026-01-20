import { createClient } from "@libsql/client";

async function main() {
  const dbUrl =
    process.env.TURSO_DATABASE_URL?.replace("libsql://", "https://") || "";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !authToken) {
    console.error("Missing TURSO credentials");
    process.exit(1);
  }

  const client = createClient({ url: dbUrl, authToken });

  console.log("Checking Turso for products_search table...");
  try {
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='products_search'",
    );
    if (result.rows.length > 0) {
      console.log("✅ products_search EXISTS on Turso");

      const count = await client.execute(
        "SELECT count(*) as c FROM products_search",
      );
      console.log(`📊 products_search count: ${count.rows[0].c}`);
    } else {
      console.log("❌ products_search DOES NOT EXIST on Turso");
    }
  } catch (e: any) {
    console.error("Error checking Turso:", e.message);
  }
}

main();
