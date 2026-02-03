import { execSync } from "child_process";
import fs from "fs";

/**
 * CleverPrices "db:push" script
 * Deploys local SQLite database to Production using a safe Hot-Swap method.
 */
async function deployData() {
  const isForce = process.argv.includes("--force");
  const PROD_IP = "46.225.72.57";
  const PROD_PATH = "/etc/dokploy/volumes/cleverprices/data/cleverprices.db";
  const TEMP_PATH =
    "/etc/dokploy/volumes/cleverprices/data/cleverprices.db.tmp";
  const LOCAL_PATH = "./data/cleverprices.db";

  console.log("🚀 Starting Safe Data Deployment to Production...");

  if (!fs.existsSync(LOCAL_PATH)) {
    console.error(`❌ ERROR: Local database not found at ${LOCAL_PATH}`);
    process.exit(1);
  }

  if (!isForce) {
    console.warn("⚠️  Warning: This will overwrite the production database.");
    console.log("   Please use --force to confirm.");
    process.exit(1);
  }

  try {
    const stats = fs.statSync(LOCAL_PATH);
    const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 Local Database Size: ${sizeMb} MB`);

    // 1. Upload to temporary file
    console.log(`\n☁️  Step 1: Uploading to temporary file...`);
    execSync(`scp ${LOCAL_PATH} root@${PROD_IP}:${TEMP_PATH}`, {
      stdio: "inherit",
    });

    // 2. Perform Hot-Swap via SSH
    console.log(
      `\n🔄 Step 2: Performing Hot-Swap on Production (Next.js stay running)...`,
    );
    const hotswapCmd = `ssh root@${PROD_IP} "sqlite3 ${PROD_PATH} '.restore ${TEMP_PATH}' && rm ${TEMP_PATH}"`;
    execSync(hotswapCmd, { stdio: "inherit" });

    console.log("\n✅ Deployment completed successfully!");
    console.log("🏁 Your production database has been hot-swapped.");
  } catch (err: any) {
    console.error("\n❌ Deployment failed:", err.message);
    process.exit(1);
  }
}

deployData();
