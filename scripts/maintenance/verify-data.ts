import { createClient } from "@libsql/client";
import { and, isNotNull, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "../../src/db/schema";

const DB_PATH = "file:./data/cleverprices-official.db";
const client = createClient({ url: DB_PATH });
const db = drizzle(client, { schema });

async function verify() {
  console.log(`🔍 Verifying data in ${DB_PATH}...`);
  const results = await db.query.products.findMany({
    where: and(
      like(schema.products.title, "%i7-14700K%"),
      isNotNull(schema.products.officialSpecifications),
    ),
    limit: 1,
    columns: { title: true, officialSpecifications: true },
  });

  if (results.length > 0) {
    console.log("✅ Data FOUND!");
    console.log("Specs Length:", results[0].officialSpecifications?.length);
    console.log("FULL JSON DUMP:");
    console.log(results[0].officialSpecifications);
  } else {
    console.log("❌ Data NOT FOUND.");
  }
}

verify();
