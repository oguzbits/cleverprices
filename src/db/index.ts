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

// Determine database URL
function getDatabaseUrl(): string {
  // 1. Force local file if requested (useful for scripts)
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
    return `file:${process.cwd()}/data/cleverprices-lite.db`;
  }

  // 4. Local Development Fallback
  return "file:./data/cleverprices.db";
}

// Create libSQL client
function createDbClient(): Client {
  const url = getDatabaseUrl();
  const isRemote = url.startsWith("libsql://") || url.startsWith("https://");

  // Production (Vercel) with bundled file: Use plain local SQLite (READ-ONLY)
  if (isVercelProduction && url.startsWith("file:")) {
    console.log("[DB] Using bundled LITE database (quota-safe)");
    return createClient({ url });
  }

  // Remote connection to Turso (Cloud)
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

  // Local development: Plain local SQLite
  console.log("[DB] Using local SQLite:", url);
  const client = createClient({ url });

  // Set performance PRAGMAs for local SQLite
  if (url.startsWith("file:")) {
    try {
      client.execute("PRAGMA journal_mode = WAL");
      client.execute("PRAGMA synchronous = NORMAL");
      client.execute("PRAGMA busy_timeout = 5000");
      client.execute("PRAGMA cache_size = -10000"); // 10MB cache
    } catch (e: any) {
      console.warn("[DB] Failed to set performance PRAGMAs:", e.message);
    }
  }

  return client;
}

// Create client and Drizzle instance
const client = createDbClient();
export const db: LibSQLDatabase<typeof schema> = drizzle(client, { schema });

// Debug log (Development only)
if (process.env.NODE_ENV === "development") {
  (async () => {
    try {
      const url = getDatabaseUrl();
      console.log(`[DB DEBUG] Initialized with URL: ${url}`);
      const result = await client.execute("SELECT count(*) as C FROM products");
      console.log(`[DB DEBUG] Products count on startup: ${result.rows[0].C}`);
    } catch (e) {
      console.error("[DB DEBUG] Failed to check DB:", e);
    }
  })();
}

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
