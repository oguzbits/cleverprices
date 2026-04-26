import { db, dbReady } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 * Used by external monitors (UptimeRobot, StatusPage, etc.)
 * Returns database connectivity status and basic latency.
 */
export async function GET() {
  const start = Date.now();

  try {
    // Ensure database and migrations are fully ready
    await dbReady;
    
    // Quick DB connectivity check via Drizzle
    await db.run(sql`SELECT 1`);

    return NextResponse.json(
      {
        status: "healthy",
        db: "connected",
        buildId: process.env.NEXT_PUBLIC_BUILD_ID || "unknown",
        latency: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: "unhealthy",
        db: "disconnected",
        error: message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
