import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit Configuration for Turso/libSQL
 *
 * Supports:
 * - Production: Turso cloud database (TURSO_DATABASE_URL)
 * - Development: Local SQLite file with optional cloud sync
 *
 * Usage:
 * - `bun run db:push` - Push schema to configured database
 * - `bun run db:studio` - Open Drizzle Studio
 * - `bun run db:generate` - Generate migration files
 */

const url =
  process.env.DATABASE_PATH ||
  process.env.TURSO_DATABASE_URL ||
  "file:./data/cleverprices.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const isLocal = url.startsWith("file:");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isLocal ? "sqlite" : "turso",
  dbCredentials: {
    url,
    authToken,
  },
});
