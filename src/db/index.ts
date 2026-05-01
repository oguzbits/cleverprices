import { type Client, createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as fs from "fs";
import * as path from "path";

import * as schema from "./schema";

// Environment detection
const isProductionEnvironment = process.env.NODE_ENV === "production";

export const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.BUILD_PHASE === "1";

/**
 * Database Configuration
 *
 * This project uses a local-first SQLite architecture.
 * In Production (Dokploy), it uses a persistent Docker volume at /app/data.
 * In Development, it defaults to ./data/cleverprices.db.
 */

// Determine database URL
function getDatabaseUrl(): string {
  if (IS_BUILD) {
    return "file::memory:?cache=shared";
  }

  // 1. Explicit path (useful for scripts/testing)
  if (process.env.DB_PATH) {
    return `file:${process.env.DB_PATH}`;
  }

  // 2. Production: Default to the persistent volume database
  if (isProductionEnvironment) {
    return `file:${path.resolve(process.cwd(), "data", "cleverprices.db")}`;
  }

  // 3. Local Development Fallback
  return `file:${path.resolve(process.cwd(), "data", "cleverprices.db")}`;
}

// Create libSQL client
function createDbClient(): Client {
  const url = getDatabaseUrl();
  console.log(`[DB] Using local SQLite: ${url}`);

  const client = createClient({ url });

  // 🚀 PERFORMANCE BOOSTERS (In-Memory Speed)
  // We force SQLite to cache as much as possible in RAM via memory-mapped I/O.
  try {
    // Shared Boosters
    client.execute("PRAGMA busy_timeout = 5000").catch(() => {}); // [STABILITY SHIELD] Reverted to 5s to prevent returning empty arrays under load
    client.execute("PRAGMA cache_size = -200000").catch(() => {}); // ~200MB RAM cache
    client.execute("PRAGMA journal_mode = WAL").catch(() => {});
    client.execute("PRAGMA synchronous = NORMAL").catch(() => {});
    client.execute("PRAGMA mmap_size = 268435456").catch(() => {}); // 256MB memory-map
  } catch (e) {
    console.warn(
      "[DB] Failed to set performance PRAGMAs:",
      e instanceof Error ? e.message : String(e),
    );
  }

  return client;
}

// Create client and Drizzle instance
const client = createDbClient();
export const db: LibSQLDatabase<typeof schema> = drizzle(client, { schema });

let isInitialized = false;

/**
 * dbReady Promise
 *
 * Use this in Server Components or Actions to ensure database is initialized.
 * Usage: await dbReady;
 */
export const dbReady: Promise<void> = (async () => {
  if (isInitialized) return;

  const start = Date.now();
  try {
    console.log(
      `[DB DIAGNOSTIC] Starting dbReady. NODE_ENV: ${process.env.NODE_ENV}, isBuild: ${IS_BUILD}`,
    );

    if (IS_BUILD) {
      console.log("[DB] Build phase detected. Skipping live diagnostics.");
      isInitialized = true;
      return;
    }

    // Run migrations AUTOMATICALLY in production
    if (isProductionEnvironment) {
      console.log("[DB] 🏁 Migration sequence started...");

      // Set a strict timeout for the entire migration check to prevent 500 errors on cold starts
      const migrationCheck = (async () => {
        try {
          const migrationsDir = path.resolve(process.cwd(), "drizzle");

          if (!fs.existsSync(migrationsDir)) {
            console.warn(
              `[DB] Migrations directory NOT FOUND at ${migrationsDir}`,
            );
            return;
          }

          // [STABILITY OVERHAUL] Attempt a very fast lock check first
          // If we can't even count migrations, the DB is likely locked by another container
          // In that case, we BAIL on migration and just start the server.
          const migCountResult = await Promise.race([
            client.execute("SELECT count(*) as c FROM __drizzle_migrations"),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 2000),
            ),
          ]).catch(() => {
            console.warn(
              "[DB] Migration check skipped (Database busy or timeout). Proceeding with current schema.",
            );
            return null;
          });

          if (!migCountResult) return;

          const migrationFiles = fs
            .readdirSync(migrationsDir)
            .filter((f) => f.endsWith(".sql"));
          const fileCount = migrationFiles.length;
          const dbCount = migCountResult
            ? Number(
                (
                  (migCountResult as { rows: { c: number | string }[] })
                    .rows[0] || {}
                ).c || 0,
              )
            : 0;

          if (dbCount >= fileCount) {
            console.log(
              `[DB] Database is up-to-date (DB: ${dbCount} >= Disk: ${fileCount}). Skipping migrate().`,
            );
          } else {
            console.log(
              `[DB] New migrations detected (Disk: ${fileCount} > DB: ${dbCount}). Applying...`,
            );
            // We use a shorter timeout for the actual migrate() to prevent request hanging
            await migrate(db, { migrationsFolder: migrationsDir });
            console.log("[DB] ✅ Migration sequence completed successfully.");
          }
        } catch (migrateError) {
          console.error(
            "[DB WARNING] Migration check failed:",
            migrateError instanceof Error
              ? migrateError.message
              : String(migrateError),
          );
        }
      })();

      // Wait at most 3 seconds for migration check during cold start.
      // If it takes longer, we assume the DB is "mostly" ready and proceed to avoid timing out the whole request.
      await Promise.race([
        migrationCheck,
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }

    isInitialized = true;
    console.log(`[DB] dbReady completed in ${Date.now() - start}ms`);
  } catch (e) {
    console.error(
      "[DB CRITICAL] Initialization logic failed:",
      e instanceof Error ? e.message : String(e),
    );
    // Even in critical failure, we resolve to avoid poisoning the promise forever
    isInitialized = true;
    return;
  }
})();

// Export schema for convenience
export * from "./schema";

// Export client for direct access if needed
export { client };
