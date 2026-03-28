#!/usr/bin/env bun
/**
 * 🕵️ URL Fingerprint Regression Test
 * Ensures that changes to the codebase don't accidentally break canonical URL structures.
 */

import { join } from "node:path";
import { getProductPath } from "../../src/lib/utils/url";

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

async function runTest() {
  console.log(
    `${COLORS.cyan}🔍 Starting URL Fingerprint Test...${COLORS.reset}\n`,
  );

  const baselinePath = join(import.meta.dir, "url-baseline.json");
  const baseline = await Bun.file(baselinePath).json();

  let failures = 0;

  for (const record of baseline.records) {
    let actualPath = "";

    if (record.type === "product") {
      actualPath = getProductPath(record.id, record.slug);
    } else if (record.type === "category") {
      // Categories currently use the slug directly as path
      actualPath = `/${record.slug}`;
    } else if (record.type === "static") {
      // Static routes use the slug as the core path
      actualPath = `/${record.slug}`;
    }

    if (actualPath === record.expectedPath) {
      console.log(
        `${COLORS.green}✅ Match:${COLORS.reset} ${record.type} [${record.slug}] -> ${actualPath}`,
      );
    } else {
      console.log(
        `${COLORS.red}❌ MISMATCH:${COLORS.reset} ${record.type} [${record.slug}]`,
      );
      console.log(`   Expected: ${record.expectedPath}`);
      console.log(`   Actual:   ${actualPath}`);
      failures++;
    }
  }

  console.log("\n" + "=".repeat(40));
  if (failures === 0) {
    console.log(
      `\n${COLORS.green}✨ URL FINGERPRINT PASSED: No regressions detected.${COLORS.reset}\n`,
    );
    process.exit(0);
  } else {
    console.log(
      `\n${COLORS.red}🚨 URL FINGERPRINT FAILED: ${failures} regression(s) found!${COLORS.reset}`,
    );
    console.log(
      `${COLORS.yellow}If this change was intentional, update scripts/tests/url-baseline.json${COLORS.reset}\n`,
    );
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
