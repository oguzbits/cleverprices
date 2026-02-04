#!/usr/bin/env bun
/**
 * Keepa Scheduled Worker
 *
 * Periodically syncs products from Keepa while respecting token limits.
 * Handles automatic token refills and category rotation.
 *
 * Usage:
 *   bun run worker:run [country] [--continuous]
 */

import { execSync } from "child_process";
import { sql } from "drizzle-orm";
import { db, products } from "../../src/db";
import type { CountryCode } from "../../src/lib/countries";
import { getTokenStatus } from "../../src/lib/keepa/product-discovery";

import { loadWorkerState, saveWorkerState } from "../../src/lib/worker-state";

async function main() {
  const args = process.argv.slice(2);
  let country: CountryCode = "de";
  let isContinuous = false;
  let shouldSync = true;

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
    console.log(`[Notification] ${message}`);
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
    const WORK_COOLDOWN = 5 * 60 * 1000; // Reduced to 5 minutes for tighter turnover

    let workPerformed = false;

    // Check if we should skip work phase due to recent run
    if (now - state.lastRun < WORK_COOLDOWN) {
      const minsAgo = Math.round((now - state.lastRun) / 60000);
      console.log(`⏳ Recently ran (${minsAgo}m ago). Skipping work phase.`);
    } else {
      let tokensLeft = 0;
      try {
        const status = await getTokenStatus();
        tokensLeft = status.tokensLeft;
      } catch (e) {
        console.warn("⚠️ Could not fetch token status, assuming safe minimum.");
        tokensLeft = 400;
      }

      // Dynamic Token Allocation
      // For a 7k catalog, we can be much more aggressive.
      // We aim to use most of our burst capacity for prices.
      const priceLimit = Math.max(500, Math.min(tokensLeft - 100, 2000));
      const enrichmentLimit = Math.min(tokensLeft - priceLimit, 200);

      const runCompliancePhase = async () => {
        console.log(
          `\n⚖️ Phase 1: Compliance Sync (Daily Price Updates - Target: ${priceLimit})`,
        );
        execSync(
          `bun run update-prices ${country} --stale --limit=${priceLimit}`,
          {
            stdio: "inherit",
            env: { ...process.env, DB_LOCAL: "1" },
          },
        );
      };

      const runEnrichmentPhase = async () => {
        if (enrichmentLimit > 0) {
          console.log(
            `\n🧪 Phase 2: Metadata Enrichment (Target: ${enrichmentLimit} products)`,
          );
          try {
            execSync(
              `bun run worker:enrich ${country} --limit=${enrichmentLimit}`,
              {
                stdio: "inherit",
                env: { ...process.env, DB_LOCAL: "1" },
              },
            );
          } catch (e) {
            console.error("❌ Enrichment failed:", e);
          }
        } else {
          console.log(
            `\n⏭️ Skipping enrichment (Tokens: ${tokensLeft}, Price Limit: ${priceLimit})`,
          );
        }
      };

      // Execute phases
      try {
        await runCompliancePhase();
        await runEnrichmentPhase();

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

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// We need to wrap the whole thing to share scope properly or just duplicate logic.
// Simplest is to just put the runner logic in the main function.
main().catch(async (err) => {
  console.error(err);
  Sentry.captureException(err);

  const isSilent =
    process.argv.includes("--silent") || process.argv.includes("-s");
  if (!isSilent) {
    console.error(`[Fatal Error] ${err}`);
  }

  // Ensure Sentry flushes before exiting
  await Sentry.flush(2000);
  process.exit(1);
});
