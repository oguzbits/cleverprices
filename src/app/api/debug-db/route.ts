export const dynamic = "force-dynamic";
import { client, db } from "@/db";
import { products } from "@/db/schema";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  const dbPath = path.join(process.cwd(), "data", "cleverprices-lite.db");
  const exists = fs.existsSync(dbPath);

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    dbFileExists: exists,
  };

  try {
    // 1. Raw SQL test on products
    const rawResult = await client.execute(
      "SELECT id, title FROM products LIMIT 1",
    );
    diagnostics.rawSqlSuccess = true;
    diagnostics.firstProduct = rawResult.rows[0];

    // 2. Drizzle test on products
    try {
      const drizzleResult = await db
        .select({ id: products.id, title: products.title })
        .from(products)
        .limit(1);
      diagnostics.drizzleSuccess = true;
      diagnostics.drizzleProduct = drizzleResult[0];
    } catch (drizzleErr: any) {
      diagnostics.drizzleError = drizzleErr.message;
      diagnostics.drizzleStack = drizzleErr.stack;
    }

    // 3. FTS test
    const ftsResult = await client.execute(
      "SELECT id FROM products_search WHERE products_search MATCH 'Samsung*' LIMIT 1",
    );
    diagnostics.ftsSuccess = true;
    diagnostics.ftsCount = ftsResult.rows.length;
  } catch (err: any) {
    diagnostics.globalError = err.message;
  }

  return NextResponse.json(diagnostics);
}
