import { createClient } from "@libsql/client";
const client = createClient({ url: "file:./data/cleverprices-official.db" });
const result = await client.execute(
  'SELECT count(*) as count FROM products WHERE enrichment_status = "pending"',
);
console.log("Pending products count:", result.rows[0].count);
