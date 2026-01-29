import { createClient } from "@libsql/client";

async function test() {
  try {
    const client = createClient({ url: "file:data/cleverprices.db" });
    const res = await client.execute("SELECT count(*) FROM products");
    console.log("Success! Count:", res.rows[0]);
  } catch (e) {
    console.error("Failed to open DB via Bun:", e);
  }
}

test();
