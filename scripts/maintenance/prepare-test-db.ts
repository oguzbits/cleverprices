import { copyFileSync, existsSync } from "fs";

const SOURCE = "data/cleverprices.db";
const TARGET = "data/cleverprices-test.db";

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Source database not found at ${SOURCE}`);
    process.exit(1);
  }

  console.log(`📋 Cloning ${SOURCE} to ${TARGET}...`);
  copyFileSync(SOURCE, TARGET);

  // Also copy SHM/WAL if they exist to be safe, though copyFileSync on main DB is usually enough
  if (existsSync(`${SOURCE}-shm`))
    copyFileSync(`${SOURCE}-shm`, `${TARGET}-shm`);
  if (existsSync(`${SOURCE}-wal`))
    copyFileSync(`${SOURCE}-wal`, `${TARGET}-wal`);

  console.log("✅ Test database ready at data/cleverprices-test.db");
  console.log(
    `🚀 You can now run: DB_PATH=data/cleverprices-test.db bun run scripts/import/import-all.ts`,
  );
}

main().catch(console.error);
