#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, readdirSync } from "fs";
import { join } from "path";

async function main() {
  const importDir =
    "/Users/oguz/Desktop/Dev/cleverprices/Keepa Import 14-01-26";
  const importerScript =
    "/Users/oguz/Desktop/Dev/cleverprices/scripts/import/import-from-csv.ts";

  if (!existsSync(importDir)) {
    console.error(`Import directory not found: ${importDir}`);
    process.exit(1);
  }

  const files = readdirSync(importDir).filter((f) => f.endsWith(".csv"));
  console.log(`🚀 Found ${files.length} CSV files to process.`);

  for (const file of files) {
    const filePath = join(importDir, file);
    console.log(`\n--- Importing ${file} ---`);

    try {
      // Use bun to run the existing importer script for each file
      await $`bun run ${importerScript} ${filePath}`;
    } catch (err) {
      console.error(`❌ Failed to import ${file}:`, err);
    }
  }

  console.log("\n✨ All imports completed.");
}

main().catch(console.error);
