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

    // Storage check (Database size)
    let storage: any = { status: "unknown" };
    try {
      const fs = await import("fs");
      const path = await import("path");

      const dataDir = path.join(process.cwd(), "data");
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir);
        const stats = files.map((file) => {
          const filePath = path.join(dataDir, file);
          const s = fs.statSync(filePath);
          return { name: file, sizeMb: (s.size / (1024 * 1024)).toFixed(2) };
        });

        const totalSizeMb = stats
          .reduce((acc, f) => acc + parseFloat(f.sizeMb), 0)
          .toFixed(2);

        storage = {
          status: "available",
          totalSizeMb,
          files: stats
            .sort((a, b) => parseFloat(b.sizeMb) - parseFloat(a.sizeMb))
            .slice(0, 5), // Top 5 largest files
        };
      }
    } catch (e) {
      storage = { status: "error", error: String(e) };
    }

    return NextResponse.json(
      {
        status: "healthy",
        db: "connected",
        redis: redisStatus,
        storage,
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
