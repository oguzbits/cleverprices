import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  const cwd = process.cwd();
  const results: any = {
    cwd,
    now: new Date().toISOString(),
    env: {
      NETLIFY: process.env.NETLIFY,
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
    },
    scans: [] as any[],
  };

  const pathsToScan = [
    cwd,
    path.join(cwd, ".next", "server"),
    path.join(cwd, "data"),
    "/var/task", // Common lambda path
    "/var/task/data",
    path.join(cwd, ".."),
  ];

  for (const p of pathsToScan) {
    try {
      if (fs.existsSync(p)) {
        const stats = fs.statSync(p);
        if (stats.isDirectory()) {
          const files = fs.readdirSync(p);
          results.scans.push({
            path: p,
            exists: true,
            type: "directory",
            files: files.slice(0, 20), // limit to avoid huge response
            count: files.length,
          });
        } else {
          results.scans.push({
            path: p,
            exists: true,
            type: "file",
            size: stats.size,
          });
        }
      } else {
        results.scans.push({ path: p, exists: false });
      }
    } catch (e: any) {
      results.scans.push({ path: p, error: e.message });
    }
  }

  // Try to find the DB specifically
  const possibleDbPaths = [
    path.join(cwd, "data", "cleverprices-lite.db"),
    path.join(cwd, "cleverprices-lite.db"),
    "/var/task/data/cleverprices-lite.db",
    "/var/task/cleverprices-lite.db",
  ];

  results.dbSearch = possibleDbPaths.map((p) => ({
    path: p,
    exists: fs.existsSync(p),
    size: fs.existsSync(p) ? fs.statSync(p).size : 0,
  }));

  // Attempt DB init separately to avoid crashing the whole response
  try {
    const { db } = await import("@/db");
    // @ts-ignore
    const dbResult = await db.run("SELECT 1 as val");
    results.dbQuery = { success: true, result: dbResult };
  } catch (e: any) {
    results.dbQuery = { success: false, error: e.message };
  }

  return NextResponse.json(results);
}