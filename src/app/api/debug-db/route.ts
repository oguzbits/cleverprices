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
    dbPath,
    exists,
  };

  if (exists) {
    try {
      const stats = fs.statSync(dbPath);
      diagnostics.size = stats.size;

      const fd = fs.openSync(dbPath, "r");
      const buffer = Buffer.alloc(16);
      fs.readSync(fd, buffer, 0, 16, 0);
      diagnostics.header = buffer.toString("ascii");
      fs.closeSync(fd);
    } catch (fsErr: any) {
      diagnostics.fsError = fsErr.message;
    }
  }

  try {
    // 1. Raw Client Test
    const raw = await client.execute("SELECT 1 as test");
    diagnostics.clientTest = raw.rows[0].test;

    // 2. Select from products (Raw)
    try {
      const rawProducts = await client.execute(
        "SELECT id, title FROM products LIMIT 1",
      );
      diagnostics.rawResults = rawProducts.rows.length;
    } catch (rawErr: any) {
      diagnostics.rawError = rawErr.message;
    }

    // 3. Drizzle Test
    try {
      const drizzleResult = await db
        .select({ id: products.id })
        .from(products)
        .limit(1);
      diagnostics.drizzleResults = drizzleResult.length;
    } catch (drizzleErr: any) {
      diagnostics.drizzleError = drizzleErr.message;
    }
  } catch (err: any) {
    diagnostics.globalError = err.message;
  }

  return NextResponse.json(diagnostics);
}
