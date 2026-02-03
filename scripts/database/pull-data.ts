import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * CleverPrices "db:pull" script
 * Syncs the production database to local for development.
 */
async function pullData() {
  const isForce = process.argv.includes("--force");
  const PROD_IP = "46.225.72.57";
  const PROD_PATH = "/etc/dokploy/volumes/cleverprices/data/cleverprices.db";
  const LOCAL_PATH = "./data/cleverprices.db";

  console.log("🚀 Starting data sync from Production to Local...");

  if (!isForce && fs.existsSync(LOCAL_PATH)) {
    console.error("❌ ERROR: Data pull will overwrite your local database.");
    console.log("   Please use --force to confirm.");
    process.exit(1);
  }

  try {
    // Ensure data directory exists
    const dataDir = path.dirname(LOCAL_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`📦 Pulling ${PROD_PATH}...`);

    // Check if we can reach the server first
    execSync(`scp root@${PROD_IP}:${PROD_PATH} ${LOCAL_PATH}`, {
      stdio: "inherit",
    });

    console.log("\n✅ Database synced successfully!");

    // Show stats
    const stats = fs.statSync(LOCAL_PATH);
    const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 Local Database Size: ${sizeMb} MB`);
  } catch (err: any) {
    console.error("\n❌ Sync failed:", err.message);
    process.exit(1);
  }
}

pullData();
