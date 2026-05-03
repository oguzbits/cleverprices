import { createClient } from "@libsql/client";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "../../src/db/schema";

const DB_PATH = "file:./data/cleverprices-official.db";
const client = createClient({ url: DB_PATH });
const db = drizzle(client, { schema });

async function migrate() {
  console.log(`📦 Migrating data format in ${DB_PATH}...`);

  const targets = await db.query.products.findMany({
    where: like(schema.products.officialSpecifications, "%Intel Ark%"),
  });

  console.log(`Found ${targets.length} records to update.`);

  for (const p of targets) {
    if (!p.officialSpecifications) continue;

    try {
      const specs = JSON.parse(p.officialSpecifications);

      // Migration Logic
      if (
        specs.Source === "Intel Ark" ||
        specs.Source === "Intel Ark (Puppeteer)"
      ) {
        specs.Source = "Intel";
        specs.Method = "Scraped";

        // Save back
        await db
          .update(schema.products)
          .set({ officialSpecifications: JSON.stringify(specs) })
          .where(eq(schema.products.id, p.id));

        process.stdout.write(".");
      }
    } catch (e) {
      console.error(`Failed to parse/update product ${p.id}`, e);
    }
  }

  console.log("\n✅ Migration Complete.");
}

migrate();
