import { db } from "@/db";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

// export const dynamic = "force-dynamic"; // Removed for Next.js 16 cacheComponents compatibility

export async function GET() {
  const cwd = process.cwd();
  const dataPath = path.join(cwd, "data");
  const dbPath = path.join(dataPath, "cleverprices-lite.db");

  const debugInfo = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      NETLIFY: process.env.NETLIFY,
      DB_LOCAL: process.env.DB_LOCAL,
      DB_REMOTE: process.env.DB_REMOTE,
      DB_SYNC: process.env.DB_SYNC,
    },
    paths: {
      cwd,
      dataPath,
      dbPath,
    },
    files: {
      cwd: [] as string[],
      data: [] as string[],
      dbExists: false,
      dbSize: -1,
    },
    dbStatus: "checking",
    error: null as any,
  };

  try {
    // Check FS
    if (fs.existsSync(cwd)) {
      debugInfo.files.cwd = fs.readdirSync(cwd);
    }
    if (fs.existsSync(dataPath)) {
      debugInfo.files.data = fs.readdirSync(dataPath);
    }
    if (fs.existsSync(dbPath)) {
      debugInfo.files.dbExists = true;
      debugInfo.files.dbSize = fs.statSync(dbPath).size;
    }

    // Check DB Query
    const start = performance.now();
    // @ts-ignore - simple query check
    const result = await db.run("SELECT 1 as val");
    const duration = performance.now() - start;

    debugInfo.dbStatus = `Connected! Query took ${duration.toFixed(2)}ms`;
  } catch (e: any) {
    debugInfo.dbStatus = "FAILED";
    debugInfo.error = {
      message: e.message,
      stack: e.stack,
    };
  }

  return NextResponse.json(debugInfo, { status: 200 });
}
