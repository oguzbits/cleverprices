import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../../src/db/schema";

const DB_PATH = "file:./data/cleverprices-official.db";
const client = createClient({ url: DB_PATH });
const db = drizzle(client, { schema });

async function sanitize() {
  console.log(`🧹 Sanitizing data in ${DB_PATH}...`);

  // Replace "Intel Ark (Puppeteer)" with "Intel Ark"
  const result = await db.run(sql`
    UPDATE products 
    SET official_specifications = REPLACE(official_specifications, 'Intel Ark (Puppeteer)', 'Intel Ark')
    WHERE official_specifications LIKE '%Puppeteer%'
  `);

  console.log(`✅ Sanitize Complete. Rows affected: ${result.rowsAffected}`);
}

sanitize();
