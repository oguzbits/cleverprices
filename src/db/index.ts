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
  // Explicit path override? Use it (e.g. for migrations or scripts)
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  // Production (Vercel): Always use Turso
  if (isVercelProduction) {
    if (!process.env.TURSO_DATABASE_URL) {
      throw new Error("TURSO_DATABASE_URL is required in Vercel production");
    }
    return process.env.TURSO_DATABASE_URL;
  }

  // Development: Default to local SQLite file for speed and isolation
  // Users can still force Turso by setting DATABASE_PATH to the Turso URL
  return "file:./data/cleverprices.db";
}

// Create libSQL client
function createDbClient(): Client {
  const url = getDatabaseUrl();

  // Production (Vercel) or explicit remote URL: Direct connection to Turso
  if (isVercelProduction || !url.startsWith("file:")) {
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
