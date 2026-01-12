#!/usr/bin/env bun
/**
 * Keepa Scheduled Worker
 *
 * Periodically syncs products from Keepa while respecting token limits.
 * Handles automatic token refills and category rotation.
 *
 * Usage:
 *   bun run scripts/keepa-worker.ts [country] [--continuous]
 */

import { getAllCategories } from "../src/lib/categories";
import {
  getTokenStatus,
  discoverProducts,
} from "../src/lib/keepa/product-discovery";
import type { CountryCode } from "../src/lib/countries";
import { execSync } from "child_process";

// Configuration
const REFILL_WAIT_MS = 60 * 1000; // 1 minute
const TOKEN_SAFE_THRESHOLD = 300; // Minimum tokens before starting a category
const BATCH_IMPORT_TIMEOUT = 1000 * 60 * 10; // 10 minutes max per category

async function main() {
  const args = process.argv.slice(2);
  const country = (args[0] || "de") as CountryCode;
  const isContinuous = process.argv.includes("--continuous");

  console.log("👷 Keepa Worker Started");
  console.log(`🌍 Country: ${country.toUpperCase()}`);
  console.log(`🔄 Mode: ${isContinuous ? "Continuous" : "Single Pass"}\n`);

  const categories = getAllCategories().filter(
    (c) => !c.hidden && c.slug !== "electronics",
  );
  console.log(`📋 Found ${categories.length} active categories to sync.`);

  let cycleCount = 1;

  while (true) {
    console.log(`\n--- Starting Sync Cycle #${cycleCount} ---`);

    for (const category of categories) {
      // 1. Check tokens
      let tokens = await getTokenStatus();
      console.log(
        `[Tokens] Current: ${tokens.tokensLeft} (Need ${TOKEN_SAFE_THRESHOLD} to start ${category.slug})`,
      );

      // 2. Wait for refill if needed
      while (tokens.tokensLeft < TOKEN_SAFE_THRESHOLD) {
        const waitMinutes = Math.ceil(
          (TOKEN_SAFE_THRESHOLD - tokens.tokensLeft) / tokens.refillRate,
        );
        console.log(
          `⏳ Low tokens. Waiting ${waitMinutes} minute(s) for refill...`,
        );
        await new Promise((r) => setTimeout(r, REFILL_WAIT_MS));
        tokens = await getTokenStatus();
      }

      // 3. Execute import for category
      console.log(`🚀 Syncing category: ${category.name} (${category.slug})`);
      try {
        // We use the existing import script to ensure consistent logic
        // Using execSync locally to run it as a separate process
        execSync(
          `bun run scripts/import-products.ts ${category.slug} ${country}`,
          {
            stdio: "inherit",
          },
        );
      } catch (error) {
        console.error(`❌ Error syncing category ${category.slug}:`, error);
      }
    }

    if (!isContinuous) {
      console.log("\n✅ Single pass complete.");
      break;
    }

    cycleCount++;
    console.log(
      "\n💤 Cycle complete. Resting for 30 minutes before next pass...",
    );
    await new Promise((r) => setTimeout(r, 30 * 60 * 1000));
  }
}

main().catch(console.error);
