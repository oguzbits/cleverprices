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

import { execSync } from "child_process";
import { sql } from "drizzle-orm";
import { db, products } from "../src/db";
import type { CountryCode } from "../src/lib/countries";
import { getTokenStatus } from "../src/lib/keepa/product-discovery";

import { loadWorkerState, saveWorkerState } from "../src/lib/worker-state";

async function main() {
  const args = process.argv.slice(2);
  let country: CountryCode = "de";
  let isContinuous = false;

  // Parsing arguments
  let silent = false;
  for (const arg of args) {
    if (arg === "--continuous" || arg === "-c") {
      isContinuous = true;
    } else if (arg === "--silent" || arg === "-s") {
      silent = true;
    } else if (arg !== "-" && !arg.startsWith("--") && /^[a-z]{2}$/.test(arg)) {
      country = arg as CountryCode;
    }
  }

  const notify = (message: string) => {
    if (silent) return;
    try {
      const safeMessage = message.replace(/"/g, '\\"');
      // Synchronous execution ensures it finishes before we exit.
      // Using timeout to prevent hanging if osascript stalls.
      execSync(
        `osascript -e 'display notification "${safeMessage}" with title "CleverPrices Worker" sound name "Glass"'`,
        { stdio: "ignore", timeout: 1000 },
      );
    } catch (e) {
      console.error("Notify failed:", e);
    }
  };

  // Graceful shutdown handlers
  const onShutdown = (signal: string) => {
    // Prevent double execution
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("SIGHUP");

    try {
      console.log(`\n🛑 Worker stopped (${signal}).`);
    } catch {}

    if (!silent) notify("Worker stopped.");
    process.exit(0);
  };
  process.on("SIGINT", () => onShutdown("SIGINT"));
  process.on("SIGTERM", () => onShutdown("SIGTERM"));
  process.on("SIGHUP", () => onShutdown("SIGHUP"));

  console.log("👷 Keepa Maintenance Worker Started");
  console.log(`🌍 Focus Country: ${country.toUpperCase()}`);
  console.log(`🔄 Mode: ${isContinuous ? "Continuous" : "Single Pass"}`);
  console.log(`🔔 Notifications: ${silent ? "Disabled" : "Enabled"}`);
  console.log(
    "💡 Usage: bun run worker [country] [-c|--continuous] [-s|--silent]\n",
  );

  let cycleCount = 1;
  const state = loadWorkerState();

  // Twice-daily target: 12,000 - 14,000 products
  const PRODUCT_TARGET_MAX = 14000;

  while (true) {
    // 0. Database Status Check
    try {
      const productStats = await db
        .select({ count: sql<number>`count(*)` })
        .from(products);
      const count = productStats[0]?.count || 0;

      console.log(`\n--- Starting Maintenance Cycle #${cycleCount} ---`);
      console.log(
        `📊 Current Catalog Size: ${count} / ${PRODUCT_TARGET_MAX} products`,
      );
      if (count > PRODUCT_TARGET_MAX) {
        console.log(
          "⚠️  Warning: Catalog size exceeds twice-daily update budget (14k). Consider pruning.",
        );
      }
    } catch (dbError) {
      console.error("❌ Database Connection Failed:", dbError);
      throw dbError; // Trigger fatal error
    }

    const now = Date.now();
    const WORK_COOLDOWN = 15 * 60 * 1000; // 15 minutes

    let workPerformed = false;

    // Check if we should skip work phase due to recent run
    if (now - state.lastRun < WORK_COOLDOWN) {
      const minsAgo = Math.round((now - state.lastRun) / 60000);
      console.log(`⏳ Recently ran (${minsAgo}m ago). Skipping work phase.`);
    } else {
      const runCompliancePhase = async () => {
        console.log("\n⚖️ Phase 1: Compliance Sync (Daily Price Updates)");
        execSync(`bun run scripts/update-prices.ts ${country} --stale`, {
          stdio: "inherit",
        });
      };

      const runEnrichmentPhase = async () => {
        try {
          const tokens = await getTokenStatus();
          if (tokens.tokensLeft > 400) {
            console.log(
              "\n🧪 Phase 2: Metadata Enrichment (Features & History)",
            );
            try {
              execSync(`bun run scripts/enrich-products.ts`, {
                stdio: "inherit",
              });
            } catch (e) {
              console.error("❌ Enrichment failed:", e);
            }
          } else {
            console.log(
              `\n⏭️ Skipping enrichment (Low tokens: ${tokens.tokensLeft})`,
            );
          }
        } catch (tokenError) {
          console.error("❌ Failed to check tokens:", tokenError);
        }
      };

      const runCloudSyncPhase = async () => {
        console.log("\n☁️  Phase 3: Cloud Sync (Incremental)");
        try {
          // Use --delta for incremental sync
          execSync(`bun run scripts/deploy-data.ts --delta`, {
            stdio: "inherit",
          });
          console.log("✅ Cloud sync successful.");
        } catch (e) {
          console.error("❌ Cloud sync failed:", e);
        }
      };

      // Execute phases
      try {
        await runCompliancePhase();
        await runEnrichmentPhase();
        await runCloudSyncPhase();

        // Update Memory & Persist
        state.lastRun = Date.now();
        state.lastCloudSync = state.lastRun;
        saveWorkerState({
          lastRun: state.lastRun,
          lastCloudSync: state.lastRun,
        });
        workPerformed = true;
      } catch (e) {
        console.error("❌ Phase execution failed:", e);
      }
    }

    if (!isContinuous) {
      console.log("\n✅ Single pass complete.");
      break;
    }

    cycleCount++;

    // Sleep Implementation
    const nowLocal = Date.now();
    const nextWorkTime = state.lastRun + WORK_COOLDOWN;
    const sleepTime = Math.max(10000, nextWorkTime - nowLocal);
    const nextEventTime = new Date(nowLocal + sleepTime).toLocaleTimeString();
    const minsToSleep = Math.round(sleepTime / 60000);

    console.log(`\n📅 Next Cycle: ${nextEventTime}`);
    console.log(`💤 Sleeping ${minsToSleep}m...`);
    await new Promise((r) => setTimeout(r, sleepTime));
  }

  return notify; // Return notify for use in catch block reference if needed, though we can't access it easily outside.
  // Actually due to scoping, we need to handle the catch block inside the scope OR pass the notify function out.
  // Easiest is to move the catch INSIDE main or define notify OUTSIDE.
  // Refactoring to define notify outside or keep simplified structure.

  // Re-structuring slightly to ensure notify is available.
}

// Global notify placeholder
let globalNotify = (msg: string) => {};

// We need to wrap the whole thing to share scope properly or just duplicate logic.
// Simplest is to just put the runner logic in the main function.
main().catch((err) => {
  console.error(err);
  // We can't access 'notify' here because it's local to main.
  // We will re-implement a simple silent check here or rely on the process.argv

  const isSilent =
    process.argv.includes("--silent") || process.argv.includes("-s");
  if (!isSilent) {
    try {
      const errorMessage = String(err).slice(0, 100).replace(/"/g, '\\"');
      execSync(
        `osascript -e 'display notification "Error: ${errorMessage}" with title "CleverPrices Worker Stopped" sound name "Glass"'`,
        { stdio: "ignore" },
      );
    } catch (e) {}
  }

  process.exit(1);
});
