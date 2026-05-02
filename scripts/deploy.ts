import { execSync } from "node:child_process";

/**
 * Automated Deployment Script
 * 1. Pre-flight checks (Typecheck, Lint, E2E)
 * 2. Git Push
 * 3. Polling Verification (Wait for Build ID to match)
 * 4. Post-flight (Warm Cache)
 */

const TARGET_URL = process.env.PRODUCTION_URL || "https://cleverprices.de";
const POLL_INTERVAL_MS = 10000; // 10 seconds
const MAX_ATTEMPTS = 60; // 10 minutes total

function run(command: string) {
  console.log(`\n🚀 Running: ${command}`);
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`\n❌ Command failed: ${command}`);
    process.exit(1);
  }
}

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

async function main() {
  const localHash = execSync("git rev-parse --short HEAD").toString().trim();
  console.log(`\n🛠️ Starting automated deployment for [${localHash}]`);

  // 1. Pre-flight
  run("bun run typecheck");
  run("bun run lint");
  run("bun run test:e2e");

  // 2. Git Push
  console.log("\n📦 Pushing to main...");
  // Check for uncommitted changes
  const status = execSync("git status --porcelain").toString();
  if (status) {
    console.log("⚠️ Uncommitted changes detected. Committing first...");
    run(
      `git add . && git commit -m "chore: automated deployment sync [${localHash}]"`,
    );
  }
  run("git push origin main");

  // 3. Polling Verification
  console.log(`\n⏳ Waiting for deployment to propagate at ${TARGET_URL}...`);
  let attempts = 0;
  while (attempts < MAX_ATTEMPTS) {
    const prodHash = await getProductionBuildId();
    if (prodHash === localHash) {
      console.log(
        `\n✅ DEPLOYMENT VERIFIED: ${TARGET_URL} is now running ${localHash}`,
      );
      break;
    }

    attempts++;
    process.stdout.write(
      `\r   Polling... Attempt ${attempts}/${MAX_ATTEMPTS} (Current: ${prodHash || "loading..."})`,
    );
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  if (attempts >= MAX_ATTEMPTS) {
    console.error(
      `\n❌ TIMEOUT: Deployment did not propagate after 10 minutes.`,
    );
    console.error(
      `   Check Dokploy logs for scope Scott scoht-SCOHTzTH30XLEP352ao0L`,
    );
    process.exit(1);
  }

  // 4. Post-flight
  run("bun run warm-cache --lite");
  console.log("\n🎊 Deployment Complete!");
}

main().catch(console.error);
