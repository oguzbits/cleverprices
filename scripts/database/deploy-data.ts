import { execSync } from "child_process";
import fs from "fs";

/**
 * CleverPrices "db:push" script
 * Deploys local SQLite database to Production using a safe Hot-Swap method.
 */
async function deployData() {
  const isForce = process.argv.includes("--force");
  const PROD_IP = "46.225.72.57";
  const APP_NAME = "cleverprices-mlaii0";

  // NOTE: Dokploy volume mapping
  const HOST_DATA_DIR = "/etc/dokploy/volumes/cleverprices/data";
  const LOCAL_PATH = "./data/cleverprices.db";
  const REMOTE_PATH_NEW = `${HOST_DATA_DIR}/cleverprices.db.new`;
  const REMOTE_PATH_TARGET = `${HOST_DATA_DIR}/cleverprices.db`;

  console.log("🚀 Starting SAFE Atomic Data Deployment...");

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

    // 1. Upload to .new file (This is safe, doesn't touch live DB)
    console.log(`\n☁️  Step 1: Uploading valid Candidate...`);
    execSync(`scp ${LOCAL_PATH} root@${PROD_IP}:${REMOTE_PATH_NEW}`, {
      stdio: "inherit",
    });

    console.log(`\n🛑 Step 2: Stopping App for Atomic Swap...`);
    // Find container ID
    const containerId = execSync(
      `ssh root@${PROD_IP} "docker ps --format '{{.ID}}' --filter 'name=${APP_NAME}' | head -n 1"`,
    )
      .toString()
      .trim();

    if (containerId) {
      execSync(`ssh root@${PROD_IP} "docker stop ${containerId}"`, {
        stdio: "inherit",
      });
    } else {
      console.log("   (App was not running, proceeding...)");
    }

    // 3. Swap Files (Atomic Move) + Cleanup WAL
    // We delete WAL/SHM to force SQLite to start fresh from the main DB file
    console.log(`\n🔄 Step 3: Swapping Database Files...`);
    const swapCmd = `ssh root@${PROD_IP} "mv ${REMOTE_PATH_NEW} ${REMOTE_PATH_TARGET} && rm -f ${HOST_DATA_DIR}/cleverprices.db-wal ${HOST_DATA_DIR}/cleverprices.db-shm"`;
    execSync(swapCmd, { stdio: "inherit" });

    // 4. Start App
    console.log(`\n▶️  Step 4: Restarting App...`);
    if (containerId) {
      execSync(`ssh root@${PROD_IP} "docker start ${containerId}"`, {
        stdio: "inherit",
      });
    }

    console.log("\n✅ Deployment completed successfully!");
  } catch (err: any) {
    console.error("\n❌ Deployment failed:", err.message);
    process.exit(1);
  }
}

deployData();
