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
  const LOCAL_PATH = "./data/cleverprices.db";

  const APP_NAME = "cleverprices-mlaii0"; // From Dokploy dashboard
  const TEMP_BACKUP_NAME = "cleverprices-backup.db";

  // NOTE: This assumes the standard Dokploy volume mapping:
  // Host: /etc/dokploy/volumes/cleverprices/data -> Container: /app/data
  const HOST_DATA_DIR = "/etc/dokploy/volumes/cleverprices/data";
  const CONTAINER_DATA_DIR = "/app/data";

  console.log("🚀 Starting SAFE data sync from Production to Local...");

  if (!isForce && fs.existsSync(LOCAL_PATH)) {
    console.error("❌ ERROR: Data pull will overwrite your local database.");
    console.log("   Please use --force to confirm.");
    process.exit(1);
  }

  try {
    // Ensure local data directory exists
    const dataDir = path.dirname(LOCAL_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`🔍 Finding container for ${APP_NAME}...`);
    // 1. Get Container ID
    const containerId = execSync(
      `ssh root@${PROD_IP} "docker ps --format '{{.ID}}' --filter 'name=${APP_NAME}' | head -n 1"`,
    )
      .toString()
      .trim();

    if (!containerId) {
      throw new Error(`Could not find running container for ${APP_NAME}`);
    }
    console.log(`   Container ID: ${containerId}`);

    // 2. Create reliable snapshot using VACUUM INTO
    console.log("📸 Creating atomic database snapshot (Hot Backup)...");
    execSync(
      `ssh root@${PROD_IP} "docker exec ${containerId} sqlite3 ${CONTAINER_DATA_DIR}/cleverprices.db \\"VACUUM INTO '${CONTAINER_DATA_DIR}/${TEMP_BACKUP_NAME}'\\""`,
      { stdio: "inherit" },
    );

    // 3. Download the snapshot
    console.log(`⬇️  Downloading snapshot...`);
    execSync(
      `scp root@${PROD_IP}:${HOST_DATA_DIR}/${TEMP_BACKUP_NAME} ${LOCAL_PATH}`,
      {
        stdio: "inherit",
      },
    );

    // 4. Clean up remote snapshot
    console.log("Pw Cleaning up remote snapshot...");
    execSync(`ssh root@${PROD_IP} "rm ${HOST_DATA_DIR}/${TEMP_BACKUP_NAME}"`);

    console.log("\n✅ Database synced successfully & safely!");

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
