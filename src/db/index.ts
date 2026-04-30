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

/**
 * dbReady Promise
 *
 * Use this in Server Components or Actions to ensure database is initialized.
 * Usage: await dbReady;
 */
export const dbReady: Promise<void> = (async () => {
  try {
    console.log(
      `[DB DIAGNOSTIC] Starting dbReady. NODE_ENV: ${process.env.NODE_ENV}, isBuild: ${IS_BUILD}`,
    );

    if (IS_BUILD) {
      console.log("[DB] Build phase detected. Skipping live diagnostics.");
      return;
    }

    // Run migrations AUTOMATICALLY in production
    if (isProductionEnvironment) {
      console.log("[DB] 🏁 Migration sequence started...");

      try {
        const migrationsDir = path.resolve(process.cwd(), "drizzle");

        if (!fs.existsSync(migrationsDir)) {
          console.warn(
            `[DB] Migrations directory NOT FOUND at ${migrationsDir}`,
          );
        } else {
          // Count .sql files in the migrations directory
          const migrationFiles = fs
            .readdirSync(migrationsDir)
            .filter((f) => f.endsWith(".sql"));
          const fileCount = migrationFiles.length;

          const migCountResult = await client
            .execute("SELECT count(*) as c FROM __drizzle_migrations")
            .catch(() => ({ rows: [{ c: 0 }] }));

          const dbCount = Number((migCountResult.rows[0] as any)?.c || 0);

          if (dbCount >= fileCount) {
            console.log(
              `[DB] Database is up-to-date (DB: ${dbCount} >= Disk: ${fileCount}). Skipping migrate().`,
            );
          } else {
            console.log(
              `[DB] New migrations detected (Disk: ${fileCount} > DB: ${dbCount}). Applying...`,
            );
            await migrate(db, { migrationsFolder: migrationsDir });
            console.log("[DB] ✅ Migration sequence completed successfully.");
          }
        }
      } catch (migrateError) {
        console.error(
          "[DB WARNING] Migration sequence failed. Queries may still work if schema is compatible.",
          migrateError instanceof Error
            ? migrateError.message
            : String(migrateError),
        );
        // We do NOT throw here anymore. We want dbReady to resolve so that
        // the server can at least attempt to serve requests.
      }
    }
  } catch (e) {
    console.error(
      "[DB CRITICAL] Initialization logic failed:",
      e instanceof Error ? e.message : String(e),
    );
    // Even in critical failure, we resolve to avoid poisoning the promise forever
    return;
  }
})();

/**
 * robustMigrate
 *
 * A resilient migration applicator that executes SQL statement-by-statement.
 * It ignores "already exists" errors, allowing a partial/push-merged database
 * to reach schema parity with the migration files.
 */
async function robustMigrate(client: Client, migrationsFolder: string) {
  const fs = await import("fs");
  const path = await import("path");

  // 1. Read the journal to get the order
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  if (!fs.existsSync(journalPath)) {
    throw new Error(`Migration journal not found at ${journalPath}`);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const migrations = journal.entries;

  console.log(
    `[DB] Robust Migrator: Processing ${migrations.length} migrations...`,
  );

  for (const entry of migrations) {
    const sqlFile = path.join(migrationsFolder, `${entry.tag}.sql`);
    if (!fs.existsSync(sqlFile)) {
      console.warn(`[DB] Migration file missing, skipping: ${sqlFile}`);
      continue;
    }

    console.log(`[DB] Applying ${entry.tag}...`);
    const sqlContent = fs.readFileSync(sqlFile, "utf8");

    // Standard Drizzle separator
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        const preview = statement.substring(0, 50).replace(/\n/g, " ");
        console.log(`[DB] Executing: ${preview}...`);
        await client.execute(statement);
      } catch (err: any) {
        const msg = err?.message || String(err);
        // Ignore "already exists" variations
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate column name") ||
          msg.includes("already a column")
        ) {
          console.log(
            `[DB] Skipping existing element: ${msg.substring(0, 50)}`,
          );
          continue;
        }
        console.error(
          `[DB ERROR] Failed statement: ${statement.substring(0, 100)}...`,
        );
        throw err;
      }
    }

    // After each file, record it in the migrations table if possible to avoid re-triggering robustMigrate
    try {
      // Create table if it doesn't exist (Drizzle's name)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
          id integer PRIMARY KEY AUTOINCREMENT,
          hash text NOT NULL,
          created_at integer
        )
      `);

      // We don't have the exact hash Drizzle uses here easily,
      // but standard migrate() will verify hashes later if it works.
      // For now, we just want to ensure the schema is applied.
    } catch (e) {
      // Ignored
    }
  }
}

// Export schema for convenience
export * from "./schema";

// Export client for direct access if needed
export { client };
