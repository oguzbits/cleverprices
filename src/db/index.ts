import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import * as schema from "./schema";

// Environment detection
// Treat standard NODE_ENV=production as signal to use production assets
const isProductionEnvironment = process.env.NODE_ENV === "production";

/**
 * Database Configuration
 *
 * This module supports three modes:
 * 1. Production (Cloud): Connects to Turso cloud database
 * 2. Development with Turso: Uses embedded replica that syncs from cloud
 * 3. Development/Build local-only: Uses local SQLite file (fallback)
 *
 * To use Turso in development, set:
 * - TURSO_DATABASE_URL: Your Turso database URL
 * - TURSO_AUTH_TOKEN: Your Turso auth token
 *
 * Without these, it falls back to local SQLite file.
 */

import fs from "fs";
import path from "path";

// Determine database URL
function getDatabaseUrl(): string {
  // 1. Force local file if requested (useful for scripts/testing)
  if (process.env.DB_PATH) {
    return `file:${process.env.DB_PATH}`;
  }
  // Support standard Turso environment variable for local files
  if (process.env.TURSO_DATABASE_URL?.startsWith("file:")) {
    return process.env.TURSO_DATABASE_URL;
  }
  if (process.env.DB_LOCAL === "1") {
    return "file:./data/cleverprices.db";
  }

  // 2. Explicit Remote Request: Use Turso cloud
  // Triggered by setting DB_REMOTE=1 in production/Local env
  if (process.env.DB_REMOTE === "1" && process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }

  // 3. Production: Default to the persistent volume database
  if (isProductionEnvironment) {
    const dbPath = path.join(process.cwd(), "data", "cleverprices.db");
    const exists = fs.existsSync(dbPath);
    console.log(`[DB Check] Path: ${dbPath}, Exists: ${exists}`);
    return `file:${dbPath}`;
  }

  // 4. Local Development Fallback
  return "file:./data/cleverprices.db";
}

// Create libSQL client
function createDbClient(): Client {
  const url = getDatabaseUrl();
  const isRemote = url.startsWith("libsql://") || url.startsWith("https://");
  let client: Client;

  // 1. ADVANCED: Autonomous Hybrid Mode (Embedded Replica)
  if (
    isProductionEnvironment &&
    process.env.DB_SYNC === "1" &&
    process.env.TURSO_DATABASE_URL &&
    process.env.TURSO_AUTH_TOKEN
  ) {
    console.log(
      "[DB] 🚀 INITIALIZING AUTONOMOUS HYBRID MODE (Embedded Replica)",
    );

    const dbPath = path.join(process.cwd(), "data", "cleverprices.db");
    const replicaPath = path.join("/tmp", "cleverprices-replica.db");

    if (!fs.existsSync(replicaPath) && fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(dbPath, replicaPath);
        console.log("[DB] Seeded replica from persistent cleverprices.db");
      } catch (e) {
        console.warn(
          "[DB] Failed to seed replica:",
          e instanceof Error ? e.message : String(e),
        );
      }
    }

    client = createClient({
      url: `file:${replicaPath}`,
      syncUrl: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  // 2. Production with local file: Use the persistent volume SQLite
  else if (isProductionEnvironment && url.startsWith("file:")) {
    console.log("[DB] Using persistent volume database: cleverprices.db");
    client = createClient({ url });
  }
  // 3. Remote connection to Turso (Cloud)
  else if (
    isRemote ||
    (process.env.TURSO_AUTH_TOKEN && !url.startsWith("file:"))
  ) {
    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error("TURSO_AUTH_TOKEN is required for remote connection");
    }
    console.log("[DB] Connecting to Turso Cloud:", url.split("@")[0]);
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  // 4. Local development Fallback
  else {
    console.log("[DB] Using local SQLite:", url);
    client = createClient({ url });
  }

  // 🚀 PERFORMANCE BOOSTERS (In-Memory Speed)
  // For local files, we force SQLite to cache as much as possible in RAM.
  if (url.startsWith("file:")) {
    try {
      // Shared Boosters
      client.execute("PRAGMA busy_timeout = 5000").catch(() => {});
      client.execute("PRAGMA cache_size = -200000").catch(() => {});
      client.execute("PRAGMA journal_mode = WAL").catch(() => {});
      client.execute("PRAGMA synchronous = NORMAL").catch(() => {});
      client.execute("PRAGMA mmap_size = 268435456").catch(() => {});
    } catch (e) {
      console.warn(
        "[DB] Failed to set performance PRAGMAs:",
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  return client;
}

// Create client and Drizzle instance
const client = createDbClient();
export const db: LibSQLDatabase<typeof schema> = drizzle(client, { schema });

/**
 * dbReady Promise
 *
 * In Autonomous/Sync mode, this promise resolves once the initial background sync
 * is complete. Use this in Server Components or Actions to ensure data freshness
 * while allowing the rest of the page layout to stream immediately.
 *
 * Usage: await dbReady;
 */
export const dbReady: Promise<void> = (async () => {
  try {
    const isSync = isProductionEnvironment && process.env.DB_SYNC === "1";
    const isBuild =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.BUILD_PHASE === "1";

    if (isSync && !isBuild) {
      console.log("[DB] Initializing autonomous sync (3000ms cutoff)...");

      // 🛡️ Web Vitals Guard:
      // We race the sync against a 3000ms timer. If sync takes longer,
      // we resolve anyway and use the bundled Lite DB to avoid killing TTFB.
      // 3s is a safe compromise for cold starts.
      const syncPromise = client.sync();
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(resolve, 3000),
      );

      await Promise.race([syncPromise, timeoutPromise]);
    }

    if (isBuild) {
      console.log("[DB] Build phase detected. Skipping live diagnostics.");
      return;
    }

    // Diagnostics in all environments (useful for Dokploy logs)
    const result = await client.execute("SELECT count(*) as C FROM products");
    const count = Number(result.rows[0].C);
    console.log(`[DB] Initialization complete. Products count: ${count}`);

    if (count === 0 && isProductionEnvironment) {
      console.warn(
        "[DB WARNING] Database is empty! Site will show empty state.",
      );
    }
  } catch (e) {
    console.error(
      "[DB ERROR] Client initialization failure:",
      e instanceof Error ? e.message : String(e),
    );
  }
})();

// Export schema for convenience
export * from "./schema";

// Export client for direct access if needed
export { client };

/**
 * Sync embedded replica from Turso cloud
 * Call this periodically or on-demand in development
 */
export async function syncFromCloud(): Promise<void> {
  if (!isProductionEnvironment && process.env.TURSO_DATABASE_URL) {
    await client.sync();
    console.log("[DB] Synced from Turso cloud");
  }
}
