import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit Configuration for Local SQLite
 *
 * Supports:
 * - Production: Persistent local SQLite file (via Docker volume)
 * - Development: Local SQLite file (./data/cleverprices.db)
 *
 * Usage:
 * - `bun run db:push` - Push schema to configured database
 * - `bun run db:studio` - Open Drizzle Studio
 * - `bun run db:generate` - Generate migration files
 */

const url = process.env.DATABASE_PATH || "file:./data/cleverprices.db";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url,
  },
});
