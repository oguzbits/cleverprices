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
  // QUOTA FALLBACK: Force specific local file usage if DB_LOCAL=1 or not on Vercel
  if (process.env.DB_LOCAL === "1") {
    return "file:./data/cleverprices.db";
  }

  // Production (Vercel): Use the LITE database (no history) to stay under 250MB limit
  if (isVercelProduction) {
    // robust path resolution for Vercel
    return `file:${process.cwd()}/data/cleverprices-lite.db`;
  }

  // Development: Use the FULL database (with history) for local work
  return "file:./data/cleverprices.db";
}

// Create libSQL client
function createDbClient(): Client {
  const url = getDatabaseUrl();

  // Production (Vercel) or explicit remote URL: Direct connection to Turso
  if (
    (isVercelProduction || !url.startsWith("file:")) &&
    process.env.DB_LOCAL !== "1"
  ) {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error(
        "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required for remote connection",
      );
    }
    return createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  // Local development: Plain local SQLite (no sync)
  console.log("[DB] Using plain local SQLite (no Turso sync)");
  const client = createClient({ url });

  // Set busy timeout for local SQLite to reduce locking issues
  if (url.startsWith("file:")) {
    client.execute("PRAGMA busy_timeout = 5000").catch((e) => {
      console.warn("[DB] Failed to set busy_timeout:", e.message);
    });
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
