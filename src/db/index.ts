import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";

import * as schema from "./schema";

// Database file location
const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), "data", "cleverprices.db");

// Ensure the data directory exists
import { mkdirSync } from "fs";
mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Create SQLite connection
const sqlite = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export schema for convenience
export * from "./schema";

// Export raw sqlite instance for migrations
export { sqlite };
