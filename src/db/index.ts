import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import * as schema from "./schema";

// Environment detection
// Treat any Vercel environment (production or preview) as production-like for DB connection
const isVercelProduction = process.env.VERCEL === "1";

/**
 * Database Configuration
 *
 * This module supports three modes:
 * 1. Production (Vercel): Connects to Turso cloud database
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
  // Triggered by setting DB_REMOTE=1 in Vercel/Local env
  if (process.env.DB_REMOTE === "1" && process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }

  // 3. Production (Vercel): Default to bundled LITE database
  // This saves Turso quota and avoids read-only filesystem errors.
  if (isVercelProduction) {
    // robust path resolution for Vercel
    const dbPath = path.join(process.cwd(), "data", "cleverprices-lite.db");
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

  // 1. ADVANCED: Autonomous Hybrid Mode (Embedded Replica)
  // Activated only when DB_SYNC=1 is set.
  // Uses bundled lite.db as base, syncs to /tmp, and reads are free/instant.
  if (
    isVercelProduction &&
    process.env.DB_SYNC === "1" &&
    process.env.TURSO_DATABASE_URL &&
    process.env.TURSO_AUTH_TOKEN
  ) {
    console.log(
      "[DB] 🚀 INITIALIZING AUTONOMOUS HYBRID MODE (Embedded Replica)",
    );

    const dbPath = path.join(process.cwd(), "data", "cleverprices-lite.db");
    const replicaPath = path.join("/tmp", "cleverprices-replica.db");

    // Copy base if it doesn't exist in tmp to avoid full sync
    if (!fs.existsSync(replicaPath) && fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(dbPath, replicaPath);
        console.log("[DB] Seeded replica from bundled lite.db");
      } catch (e) {
        console.warn(
          "[DB] Failed to seed replica:",
          e instanceof Error ? e.message : String(e),
        );
      }
    }

    return createClient({
      url: `file:${replicaPath}`,
      syncUrl: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  // 2. Production (Vercel) with bundled file: Use plain local SQLite (READ-ONLY)
  if (isVercelProduction && url.startsWith("file:")) {
    console.log("[DB] Using bundled LITE database (quota-safe)");
    return createClient({ url });
  }

  // 3. Remote connection to Turso (Cloud)
  // Enabled if URL is remote OR explicitly requested via TURSO_AUTH_TOKEN with non-file URL
  if (isRemote || (process.env.TURSO_AUTH_TOKEN && !url.startsWith("file:"))) {
    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error("TURSO_AUTH_TOKEN is required for remote connection");
    }
    console.log("[DB] Connecting to Turso Cloud:", url.split("@")[0]); // Log URL without token
    return createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  // 4. Local development & Production-File: Plain local SQLite
  console.log("[DB] Using local SQLite:", url);
  const client = createClient({ url });

  // 🚀 PERFORMANCE BOOSTERS (In-Memory Speed)
  // For local files, we force SQLite to cache as much as possible in RAM.
  if (url.startsWith("file:")) {
    try {
      // Shared Boosters
      client.execute("PRAGMA busy_timeout = 5000").catch(() => {});
      client.execute("PRAGMA cache_size = -20000").catch(() => {}); // 20MB cache (entire DB fits!)

      if (!isVercelProduction) {
        // Dev-only: WAL mode is safe for local disk
        client.execute("PRAGMA journal_mode = WAL").catch(() => {});
        client.execute("PRAGMA synchronous = NORMAL").catch(() => {});
      } else {
        // Production-only: MMap allows the OS to treat the file like RAM
        client.execute("PRAGMA mmap_size = 20000000").catch(() => {});
      }
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
    const isSync = isVercelProduction && process.env.DB_SYNC === "1";

    if (isSync) {
      console.log("[DB] Initializing autonomous sync (500ms cutoff)...");

      // 🛡️ Web Vitals Guard:
      // We race the sync against a 500ms timer. If sync takes longer than 500ms,
      // we resolve anyway and use the bundled Lite DB to avoid killing LCP/TTFB.
      const syncPromise = client.sync();
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 500));

      await Promise.race([syncPromise, timeoutPromise]);
      console.log("[DB] Ready (Fresh or Fallback-to-Lite reached)");
    }

    if (process.env.NODE_ENV === "development") {
      const result = await client.execute("SELECT count(*) as C FROM products");
      console.log(`[DB DEBUG] Products count on startup: ${result.rows[0].C}`);
    }
  } catch (e) {
    if (isVercelProduction) {
      console.error(
        "[DB ERROR] Client initialization failure:",
        e instanceof Error ? e.message : String(e),
      );
    }
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
  if (!isVercelProduction && process.env.TURSO_DATABASE_URL) {
    await client.sync();
    console.log("[DB] Synced from Turso cloud");
  }
}
