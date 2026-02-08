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

    console.log(
      `[DB DIAGNOSTIC] Starting dbReady. NODE_ENV: ${process.env.NODE_ENV}, isBuild: ${isBuild}`,
    );

    if (isBuild) {
      console.log("[DB] Build phase detected. Skipping live diagnostics.");
      return;
    }

    const dbUrl = getDatabaseUrl();
    console.log(`[DB DIAGNOSTIC] Resolved DB URL: ${dbUrl}`);
    console.log(`[DB DIAGNOSTIC] Current working directory: ${process.cwd()}`);

    // Check if migrations folder exists
    const migrationsDir = path.resolve(process.cwd(), "drizzle");
    const exists = (await import("fs")).existsSync(migrationsDir);
    console.log(
      `[DB DIAGNOSTIC] Migrations dir exists at ${migrationsDir}: ${exists}`,
    );
    if (exists) {
      console.log(
        `[DB DIAGNOSTIC] Migration files: ${JSON.stringify((await import("fs")).readdirSync(migrationsDir))}`,
      );
    }

    // Run migrations AUTOMATICALLY in production
    if (isProductionEnvironment) {
      console.log("[DB] 🏁 Migration sequence started...");

      // DEFENSIVE: Auto-repair for "warehouse_price" which was accidentally dropped in some 0005 versions
      try {
        console.log(
          "[DB] Checking for warehouse_price column on prices table...",
        );
        await client.execute(
          "ALTER TABLE prices ADD COLUMN warehouse_price REAL;",
        );
        console.log(
          "[DB] ✅ Manually added missing 'warehouse_price' column to 'prices' table.",
        );
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (
          msg.includes("duplicate column name") ||
          msg.includes("already exists")
        ) {
          console.log(
            "[DB] 'warehouse_price' already exists, no repair needed.",
          );
        } else if (msg.includes("no such table")) {
          console.log(
            "[DB] 'prices' table doesn't exist yet, standard migration will handle it.",
          );
        } else {
          console.warn(
            "[DB] Non-critical error during warehouse_price check:",
            msg,
          );
        }
      }

      // Manual Check: If __drizzle_migrations has data, SKIP migrate() to avoid conflicts
      try {
        const migCount = await client.execute(
          "SELECT count(*) as c FROM __drizzle_migrations",
        );
        if (Number(migCount.rows[0]?.c) > 0) {
          console.log(
            `[DB] Found ${migCount.rows[0]?.c} existing migrations. Skipping migrate() to prevent conflicts.`,
          );
          return;
        }
      } catch (e) {
        // Table likely missing, proceed with migration
        console.log(
          "[DB] No existing migration table found, proceeding with migration...",
        );
      }

      try {
        await migrate(db, {
          migrationsFolder: migrationsDir,
        });
        console.log("[DB] ✅ Migration sequence completed successfully.");
      } catch (migrateError) {
        console.warn(
          "[DB] Standard migration failed. Fallback DISABLED to protect data.",
          migrateError instanceof Error
            ? migrateError.message
            : String(migrateError),
        );
        // THROW to prevent robustMigrate from running and wiping data
        throw migrateError;

        /*
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
        */
      }
    } else {
      console.log(
        "[DB DIAGNOSTIC] Not in production, skipping automatic migrations.",
      );
    }

    // Final check: table count
    try {
      const prodCount = await client.execute(
        "SELECT count(*) as count FROM products",
      );
      const priceCount = await client.execute(
        "SELECT count(*) as count FROM prices",
      );
      console.log(
        `[DB DIAGNOSTIC] Row counts: products=${prodCount.rows[0]?.count}, prices=${priceCount.rows[0]?.count}`,
      );

      // Check a sample price
      const priceSample = await client.execute("SELECT * FROM prices LIMIT 1");
      if (priceSample.rows.length > 0) {
        console.log(
          `[DB DIAGNOSTIC] Sample price record: ${JSON.stringify(priceSample.rows[0])}`,
        );
      } else {
        console.warn("[DB DIAGNOSTIC] Prices table is EMPTY!");
      }
    } catch (e) {
      console.warn(
        `[DB DIAGNOSTIC] Failed to count rows (schema might not be ready): ${e}`,
      );
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
