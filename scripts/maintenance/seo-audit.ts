#!/usr/bin/env bun
/**
 * SEO Audit & Hygiene Script
 * Verifies that robots.txt, sitemap.xml, and metadata standards are maintained.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

async function audit() {
  console.log(
    `${COLORS.cyan}🔍 CleverPrices SEO Audit Report${COLORS.reset}\n`,
  );

  let failures = 0;

  // 1. Robots.txt Analysis
  console.log(`${COLORS.yellow}--- 📄 robots.txt Analysis ---${COLORS.reset}`);
  const robotsPath = join(process.cwd(), "src/app/robots.ts");
  if (existsSync(robotsPath)) {
    const content = readFileSync(robotsPath, "utf-8");
    const hasMonitoring = content.includes("/monitoring/");
    const hasRsc = content.includes("/*?_rsc=");

    if (hasMonitoring && hasRsc) {
      console.log(
        `✅ robots.txt: Crawl waste filters active (/monitoring/, _rsc)`,
      );
    } else {
      console.log(`❌ robots.txt: Missing critical disallow rules!`);
      if (!hasMonitoring) console.log(`   - Missing: /monitoring/`);
      if (!hasRsc) console.log(`   - Missing: /*?_rsc=`);
      failures++;
    }
  } else {
    console.log(`❌ robots.ts not found at ${robotsPath}`);
    failures++;
  }

  // 2. Sitemap Logic Analysis
  console.log(
    `\n${COLORS.yellow}--- 🗺️ sitemap.xml Analysis ---${COLORS.reset}`,
  );
  const sitemapPath = join(process.cwd(), "src/app/sitemap.ts");
  if (existsSync(sitemapPath)) {
    const content = readFileSync(sitemapPath, "utf-8");
    const excludesScavenged = !content.includes(
      'p.enrichmentStatus === "scavenged"',
    );

    if (excludesScavenged) {
      console.log(
        `✅ sitemap.ts: Quality filter active (Excludes scavenged products)`,
      );
    } else {
      console.log(`❌ sitemap.ts: "scavenged" products are being indexed!`);
      failures++;
    }
  }

  // 3. Metadata Standards
  console.log(`\n${COLORS.yellow}--- 🏷️ Metadata Standards ---${COLORS.reset}`);
  const metadataPath = join(process.cwd(), "src/lib/metadata.ts");
  if (existsSync(metadataPath)) {
    const content = readFileSync(metadataPath, "utf-8");
    const hasTruncate = content.includes("export function truncateTitle");
    const simplifiedHreflang = !content.includes('"de-DE"');

    if (hasTruncate) {
      console.log(`✅ metadata.ts: truncateTitle helper present`);
    } else {
      console.log(`❌ metadata.ts: truncateTitle helper missing!`);
      failures++;
    }

    if (simplifiedHreflang) {
      console.log(`✅ metadata.ts: Hreflang simplified (No de-DE)`);
    } else {
      console.log(`❌ metadata.ts: Redundant de-DE hreflang tags detected!`);
      failures++;
    }
  }

  // 4. Runtime Connectivity (Optional - checks if dev server is up)
  console.log(
    `\n${COLORS.yellow}--- 🌐 Runtime Checks (localhost:3000) ---${COLORS.reset}`,
  );
  try {
    const res = await fetch("http://localhost:3000/robots.txt", {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const text = await res.text();
      if (
        text.includes("Disallow: /monitoring/") &&
        text.includes("Disallow: /*?_rsc=")
      ) {
        console.log(`✅ Runtime: robots.txt serving correct rules`);
      } else {
        console.log(`❌ Runtime: robots.txt is stale or missing rules!`);
        failures++;
      }
    } else {
      console.log(
        `⚠️ Runtime: Local server not reachable. Skipping deep dive.`,
      );
    }
  } catch (e) {
    console.log(`⚠️ Runtime: Local server not reachable. Skipping deep dive.`);
  }

  console.log("\n" + "=".repeat(40));
  if (failures === 0) {
    console.log(
      `\n${COLORS.green}✨ SEO AUDIT PASSED: Everything is optimal.${COLORS.reset}\n`,
    );
  } else {
    console.log(
      `\n${COLORS.red}🚨 SEO AUDIT FAILED: ${failures} issue(s) found.${COLORS.reset}\n`,
    );
    process.exit(1);
  }
}

audit().catch((err) => {
  console.error(err);
  process.exit(1);
});
