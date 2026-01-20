import { client, db } from "@/db";
import { products } from "@/db/schema";
import { count, like } from "drizzle-orm";
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
    env: {
      isVercel: process.env.VERCEL === "1",
      nodeEnv: process.env.NODE_ENV,
    },
  };

  try {
    // 1. Get DB Info
    const versionInfo = await client.execute("SELECT sqlite_version() as v");
    diagnostics.sqliteVersion = versionInfo.rows[0].v;

    try {
      const compileOptions = await client.execute("PRAGMA compile_options");
      diagnostics.compileOptions = compileOptions.rows.map(
        (r: any) => r.compile_options,
      );
    } catch (e: any) {
      diagnostics.compileOptionsError = e.message;
    }

    // 2. Counts
    const productCountResult = await db
      .select({ value: count() })
      .from(products);
    diagnostics.counts = { products: productCountResult[0].value };

    // 3. Look for Samsung
    const samsungCount = await db
      .select({ value: count() })
      .from(products)
      .where(like(products.title, "%Samsung%"));
    diagnostics.samsungInMainTable = samsungCount[0].value;

    // 4. Look in FTS
    try {
      const ftsCount = await client.execute(
        "SELECT count(*) as C FROM products_search",
      );
      diagnostics.ftsCount = Number(ftsCount.rows[0].C);
    } catch (e: any) {
      diagnostics.ftsError = e.message;
    }

    // 5. Test FTS Match
    try {
      const ftsMatch = await client.execute({
        sql: "SELECT id FROM products_search WHERE products_search MATCH 'title: Samsung*' LIMIT 1",
        args: [],
      });
      diagnostics.samsungInFts = ftsMatch.rows.length > 0;
    } catch (e: any) {
      diagnostics.ftsMatchError = e.message;
    }
  } catch (err: any) {
    diagnostics.error = err.message;
    diagnostics.stack = err.stack;
  }

  return NextResponse.json(diagnostics);
}
