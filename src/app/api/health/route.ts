import { client } from "@/db";
import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 * Used by external monitors (UptimeRobot, Vercel Status, etc.)
 * Returns database connectivity status and basic metrics.
 */
export async function GET() {
  const start = Date.now();

  try {
    // Quick DB connectivity check
    await client.execute("SELECT 1");

    return NextResponse.json(
      {
        status: "healthy",
        db: "connected",
        latency: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        db: "disconnected",
        error: error.message,
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
