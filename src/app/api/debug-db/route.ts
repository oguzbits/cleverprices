import { client, db } from "@/db";
import { products } from "@/db/schema";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  const dbPath = path.join(process.cwd(), "data", "cleverprices-lite.db");
  const exists = fs.existsSync(dbPath);

  const diagnostics: any = {
    cwd: process.cwd(),
    dbPath,
    dbFileExists: exists,
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Simple Test: Get 1 product
    const oneProduct = await db.select().from(products).limit(1);
    diagnostics.oneProduct = oneProduct[0]?.title || "NONE FOUND";

    // 2. FTS Test: Manual execution
    try {
      const ftsTest = await client.execute({
        sql: "SELECT id FROM products_search WHERE products_search MATCH ? LIMIT 5",
        args: ["Samsung*"],
      });
      diagnostics.ftsResults = ftsTest.rows.length;
      diagnostics.ftsFirstId = ftsTest.rows[0]?.id;
    } catch (ftsErr: any) {
      diagnostics.ftsError = ftsErr.message;
    }

    // 3. Simple SQL Test
    try {
      const sqliteCount = await client.execute(
        "SELECT count(*) as c FROM products",
      );
      diagnostics.sqliteProductCount = sqliteCount.rows[0].c;
    } catch (sqlErr: any) {
      diagnostics.sqliteError = sqlErr.message;
    }
  } catch (err: any) {
    diagnostics.mainError = err.message;
  }

  return NextResponse.json(diagnostics);
}
