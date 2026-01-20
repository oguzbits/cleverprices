import { client } from "@/db";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  const dbPath = path.join(process.cwd(), "data", "cleverprices-lite.db");
  const exists = fs.existsSync(dbPath);

  const diagnostics: any = {
    exists,
  };

  try {
    // 1. Count products
    const total = await client.execute("SELECT count(*) as c FROM products");
    diagnostics.total = total.rows[0].c;

    // 2. Count Samsung (LIKE)
    const samsungLike = await client.execute(
      "SELECT count(*) as c FROM products WHERE title LIKE '%Samsung%'",
    );
    diagnostics.samsungLike = samsungLike.rows[0].c;

    // 3. Count Samsung (FTS)
    try {
      const samsungFts = await client.execute(
        "SELECT count(*) as c FROM products_search WHERE products_search MATCH 'Samsung*'",
      );
      diagnostics.samsungFts = samsungFts.rows[0].c;
    } catch (ftsErr: any) {
      diagnostics.ftsError = ftsErr.message;
    }
  } catch (err: any) {
    diagnostics.error = err.message;
  }

  return NextResponse.json(diagnostics);
}
