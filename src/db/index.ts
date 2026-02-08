import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import path from "path";
import * as schema from "./schema";

// Environment detection
const isProductionEnvironment = process.env.NODE_ENV === "production";

/**
 * Database Configuration
 *
 * This project uses a local-first SQLite architecture.
 * In Production (Dokploy), it uses a persistent Docker volume at /app/data.
 * In Development, it defaults to ./data/cleverprices.db.
 */

// Determine database URL
function getDatabaseUrl(): string {
  // Check if we are in a build phase
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";

  if (isBuild) {
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
    client.execute("PRAGMA busy_timeout = 5000").catch(() => {});
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
    const isBuild =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.BUILD_PHASE === "1";

    if (isBuild) {
      console.log("[DB] Build phase detected. Skipping live diagnostics.");
      return;
    }

    // Run migrations AUTOMATICALLY in production
    if (isProductionEnvironment) {
      console.log("[DB] 🏁 Migration sequence started...");
      const migrationsDir = path.resolve(process.cwd(), "drizzle");
      console.log(`[DB] Looking for migrations in: ${migrationsDir}`);

      try {
        await migrate(db, {
          migrationsFolder: migrationsDir,
        });
        console.log("[DB] ✅ Migration sequence completed successfully.");
      } catch (migrateError) {
        console.warn(
          "[DB] Standard migration failed, attempting robust fallback...",
          migrateError instanceof Error
            ? migrateError.message
            : String(migrateError),
        );

        try {
          await robustMigrate(client, migrationsDir);
          console.log("[DB] ✅ Robust migration sequence completed.");
        } catch (robustError) {
          console.error(
            "[DB ERROR] Robust migration also failed:",
            robustError,
          );
          throw robustError;
        }
      }
    }
  } catch (e) {
    console.error(
      "[DB ERROR] Client initialization failure:",
      e instanceof Error ? e.message : String(e),
    );
    throw e; // Re-throw to ensure dbReady rejects
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
        await client.execute(statement);
      } catch (err: any) {
        const msg = err?.message || String(err);
        // Ignore "already exists" variations
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate column name") ||
          msg.includes("already a column")
        ) {
          // Log as debug, but don't fail
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
