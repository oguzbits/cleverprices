import { spawn } from "child_process";

/**
 * Master Enrichment Coordinator
 * Hierarchy:
 * 1. eBay Browse API (Structured, High Accuracy)
 * 2. Google Shopping (Stealth Scraper, Fallback)
 * 3. AI Scavenger (LLM, Gaps only)
 */

async function runScript(name: string, args: string[]) {
  console.log(
    `\n============== RUNNING: ${name} ${args.join(" ")} ==============`,
  );
  return new Promise((resolve) => {
    const proc = spawn("npx", ["tsx", `scripts/enrichment/${name}`, ...args], {
      stdio: "inherit",
      env: process.env,
    });
    proc.on("close", (code) => {
      console.log(`[${name}] Finished with code ${code}`);
      resolve(code);
    });
  });
}

async function main() {
  const limit = process.argv[2] || "20";

  // 1. Keepa Phase (Internal High-Speed Scavenge)
  // We do this FIRST to fill gaps with existing data before checking external APIs
  await runScript("scavenge-keepa-data.ts", [limit]);

  // 2. eBay Phase (if credentials exist)
  if (process.env.EBAY_APP_ID) {
    await runScript("ebay-enricher.ts", [limit]);
  } else {
    console.log("⏭️ Skipping eBay (No EBAY_APP_ID found)");
  }

  // 2. Google Phase (Fallback for remaining gaps)
  await runScript("google-shopping-enricher.ts", [limit]);

  console.log("\n✅ Comprehensive Enrichment Phase Complete.");
}

main().catch(console.error);
