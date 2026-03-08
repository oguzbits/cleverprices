#!/usr/bin/env bun
/**
 * 🤖 Robots.txt Validator
 * Verifies that the rules in robots.txt align with SEO best practices and current site architecture.
 */

const RB_COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const TEST_SCENARIOS = [
  // 1. Critical Assets (Must be ALLOWED for rendering)
  {
    path: "/_next/static/css/main.css",
    expected: "allow",
    label: "Next.js Static CSS",
  },
  {
    path: "/_next/static/chunks/main.js",
    expected: "allow",
    label: "Next.js Static JS",
  },
  {
    path: "/static/images/logo.png",
    expected: "allow",
    label: "Public Assets",
  },

  // 2. Crawl Traps (Must be DISALLOWED)
  { path: "/handy?brand=Samsung", expected: "disallow", label: "Brand Filter" },
  {
    path: "/handy?capacity=128GB",
    expected: "disallow",
    label: "Capacity Filter",
  },
  {
    path: "/handy?minPrice=100",
    expected: "disallow",
    label: "Price Range Filter",
  },
  {
    path: "/handy?maxPrice=500",
    expected: "disallow",
    label: "Price Range Filter",
  },
  {
    path: "/handy?minCapacity=64",
    expected: "disallow",
    label: "Capacity Range Filter",
  },
  {
    path: "/handy?maxCapacity=512",
    expected: "disallow",
    label: "Capacity Range Filter",
  },
  {
    path: "/handy?sort=popular",
    expected: "disallow",
    label: "Sort Parameter",
  },
  { path: "/handy?view=list", expected: "disallow", label: "View Switcher" },
  {
    path: "/handy?search=pixel",
    expected: "disallow",
    label: "Search Results",
  },

  // 3. Internal Paths (Must be DISALLOWED)
  { path: "/api/products", expected: "disallow", label: "Internal API" },
  {
    path: "/monitoring/telemetry",
    expected: "disallow",
    label: "Sentry/Monitoring",
  },
  {
    path: "/_next/data/random-hash.json",
    expected: "disallow",
    label: "Next.js Internal Data",
  },
  {
    path: "/handy?_rsc=123",
    expected: "disallow",
    label: "Next.js RSC Payload",
  },
];

function robotsMatcher(
  rules: { allow: string[]; disallow: string[] },
  path: string,
): "allow" | "disallow" {
  // Simple Robots.txt matching logic (longest match wins, Allow overrides Disallow of same length)
  let longestMatch = { type: "allow" as "allow" | "disallow", length: 0 };

  // Check Disallows
  for (const pattern of rules.disallow) {
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex chars
      .replace(/\*/g, ".*")
      .replace(/\?/g, "\\?");

    const regex = new RegExp("^" + regexPattern);
    if (regex.test(path) && pattern.length > longestMatch.length) {
      longestMatch = { type: "disallow", length: pattern.length };
    }
  }

  // Check Allows
  for (const pattern of rules.allow) {
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, "\\?");

    const regex = new RegExp("^" + regexPattern);
    // In robots.txt spec, Allow usually takes precedence or the most specific rule wins.
    // We treat same length as Allow (typical Google/Bing behavior)
    if (regex.test(path) && pattern.length >= longestMatch.length) {
      longestMatch = { type: "allow", length: pattern.length };
    }
  }

  return longestMatch.type;
}

export async function validateRobots() {
  console.log(
    `${RB_COLORS.cyan}🔍 Running Robots.txt Safety Audit...${RB_COLORS.reset}\n`,
  );

  try {
    const isProd = process.argv.includes("--prod");
    const target = isProd
      ? "https://cleverprices.com"
      : "http://localhost:3000";

    console.log(`${RB_COLORS.yellow}Targeting: ${RB_COLORS.reset}${target}\n`);

    let text = "";
    try {
      const res = await fetch(`${target}/robots.txt`, {
        headers: { "User-Agent": "CleverPrices-Robots-Audit/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
    } catch (e) {
      console.log(
        `${RB_COLORS.yellow}⚠️  Could not reach ${target}/robots.txt.${RB_COLORS.reset}`,
      );
      console.log(
        `${RB_COLORS.cyan}Fallback: Analyzing local src/app/robots.ts defaults...${RB_COLORS.reset}\n`,
      );

      console.log(
        `${RB_COLORS.red}ERROR: Please start your dev server (npm run dev) to run this audit locally.${RB_COLORS.reset}`,
      );
      console.log(`Or use --prod to audit the live site.`);
      process.exit(1);
    }

    const rules = { allow: [] as string[], disallow: [] as string[] };
    const lines = text.split("\n");
    for (const line of lines) {
      const parts = line.split(":");
      if (parts.length < 2) continue;

      const key = parts[0].trim().toLowerCase();
      const value = parts.slice(1).join(":").trim();

      if (key === "allow") rules.allow.push(value);
      if (key === "disallow") rules.disallow.push(value);
    }

    let failures = 0;
    for (const test of TEST_SCENARIOS) {
      const result = robotsMatcher(rules, test.path);
      const isSuccess = result === test.expected;

      if (isSuccess) {
        console.log(
          `${RB_COLORS.green}✅ PASS${RB_COLORS.reset} [${test.label.padEnd(20)}]: ${test.path.padEnd(35)} is correctly ${result.toUpperCase()}`,
        );
      } else {
        console.log(
          `${RB_COLORS.red}❌ FAIL${RB_COLORS.reset} [${test.label.padEnd(20)}]: ${test.path.padEnd(35)} should be ${test.expected.toUpperCase()} but is ${result.toUpperCase()}`,
        );
        failures++;
      }
    }

    console.log(`\n${"-".repeat(50)}`);
    if (failures === 0) {
      console.log(
        `${RB_COLORS.green}✨ ALL SYSTEMS GO: Your crawl logic matches your deployment goals.${RB_COLORS.reset}\n`,
      );
    } else {
      console.log(
        `${RB_COLORS.red}🚨 INCONSISTENCY DETECTED: ${failures} URLs are being handled incorrectly.${RB_COLORS.reset}\n`,
      );
      process.exit(1);
    }
  } catch (err) {
    console.error(
      `${RB_COLORS.red}💥 Fatal Error:${RB_COLORS.reset}`,
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  }
}

validateRobots();
