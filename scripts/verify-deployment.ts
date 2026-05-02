import { execSync } from "node:child_process";

/**
 * Deployment Verification Script with Polling
 * This script checks if the production site is serving the correct version.
 * It will poll for a specified duration to allow for deployment propagation.
 */

const TARGET_URL = process.env.PRODUCTION_URL || "https://cleverprices.de";
const POLL_INTERVAL_MS = 15000; // 15 seconds
const MAX_ATTEMPTS = 40; // 10 minutes total

async function getProductionBuildId() {
  try {
    const response = await fetch(TARGET_URL, { cache: "no-store" });
    const buildIdHeader = response.headers.get("X-Build-ID");
    if (buildIdHeader) return buildIdHeader;

    const html = await response.text();
    const match = html.match(/data-build-id="([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function verify() {
  console.log(`\n🔍 Verifying deployment at ${TARGET_URL}...`);

  // 1. Get Local Git Hash (Current Commit)
  let localHash = "";
  try {
    localHash = execSync("git rev-parse --short HEAD").toString().trim();
    console.log(`📍 Expected Hash: ${localHash}`);
  } catch (error) {
    console.error("❌ Failed to get local git hash");
    process.exit(1);
  }

  // 2. Polling Loop
  let attempts = 0;
  while (attempts < MAX_ATTEMPTS) {
    const prodHash = await getProductionBuildId();

    if (prodHash === localHash) {
      console.log(
        `\n✅ SUCCESS: Production is now serving the latest commit [${localHash}]!`,
      );
      process.exit(0);
    }

    attempts++;
    process.stdout.write(
      `\r   Polling... Attempt ${attempts}/${MAX_ATTEMPTS} (Current live: ${prodHash || "connecting..."})`,
    );
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  console.error(
    `\n\n❌ FAILURE: Version mismatch after ${MAX_ATTEMPTS} attempts.`,
  );
  console.error(`   Local (Expected): ${localHash}`);
  console.error(
    `   Remote (Live): ${(await getProductionBuildId()) || "unknown"}`,
  );
  process.exit(1);
}

verify().catch(console.error);
