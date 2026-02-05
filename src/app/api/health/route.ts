import { client } from "@/db";
import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 * Used by external monitors (UptimeRobot, StatusPage, etc.)
 * Returns database connectivity status and basic metrics.
 */
export async function GET() {
  const start = Date.now();

  try {
    // Quick DB connectivity check
    await client.execute("SELECT 1");

    // Quick Redis connectivity check (LENIENT)
    let redisStatus = "connected";
    try {
      const { redis } = await import("@/lib/redis");
      // Use a short timeout for the ping
      await Promise.race([
        redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2000),
        ),
      ]);
    } catch (e) {
      redisStatus = "error";
      console.warn(
        "[Health Check] Redis check failed, but continuing:",
        e instanceof Error ? e.message : String(e),
      );
    }

    return NextResponse.json(
      {
        status: "healthy",
        db: "connected",
        redis: redisStatus,
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
    // Only return 503 if the core DATABASE is down
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
