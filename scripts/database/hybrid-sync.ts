import { Database } from "bun:sqlite";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * CleverPrices "Hybrid Sync"
 * Merges local Quality Improvements (Healed Specs) with Production's Price History.
 */
async function hybridSync() {
  const isForce = process.argv.includes("--force");
  const PROD_IP = "46.225.72.57";
  const APP_NAME = "cleverprices-mlaii0";

  const LOCAL_DB = "./data/cleverprices.db";
  const PROD_TEMP_DB = "./data/cleverprices_prod_candidate.db";

  const HOST_DATA_DIR = "/etc/dokploy/volumes/cleverprices/data";
  const CONTAINER_DATA_DIR = "/app/data";
  const REMOTE_BACKUP_NAME = "hybrid-snapshot.db";

  console.log("🚀 Starting Enterprise Hybrid Sync...");

  if (!fs.existsSync(LOCAL_DB)) {
    console.error(`❌ ERROR: Local database not found at ${LOCAL_DB}`);
    process.exit(1);
  }

  try {
    // 1. Snapshot Production
    console.log(`\n📸 Step 1: Taking atomic snapshot of Production Prices...`);
    const containerId = execSync(
      `ssh root@${PROD_IP} "docker ps --format '{{.ID}}' --filter 'name=${APP_NAME}' | head -n 1"`,
    )
      .toString()
      .trim();

    if (!containerId) throw new Error("Could not find running containers.");

    // Ensure the remote path is clear (VACUUM INTO requires target to NOT exist)
    console.log(`🧹 Cleaning remote path...`);
    execSync(
      `ssh root@${PROD_IP} "rm -f ${HOST_DATA_DIR}/${REMOTE_BACKUP_NAME}"`,
    );

    execSync(
      `ssh root@${PROD_IP} "docker exec ${containerId} sqlite3 ${CONTAINER_DATA_DIR}/cleverprices.db \\"VACUUM INTO '${CONTAINER_DATA_DIR}/${REMOTE_BACKUP_NAME}'\\""`,
      { stdio: "inherit" },
    );

    // 2. Download Candidate
    console.log(`⬇️  Step 2: Downloading Price History candidate...`);
    execSync(
      `scp root@${PROD_IP}:${HOST_DATA_DIR}/${REMOTE_BACKUP_NAME} ${PROD_TEMP_DB}`,
      {
        stdio: "inherit",
      },
    );

    // 3. Perform Hybrid Merge (Atomic Specs Injection)
    console.log(
      `\n🧬 Step 3: Performing DNA Injection (Merging Local Specs into Prod Candidate)...`,
    );
    const db = new Database(PROD_TEMP_DB);

    // Attach the local database
    const absoluteLocalPath = path.resolve(LOCAL_DB);
    db.run(`ATTACH DATABASE '${absoluteLocalPath}' AS local_db`);

    console.log("   Updating Specifications & Enrichment Status...");

    // Use an atomic UPDATE FROM to sync specs, titles, and DQA status
    const result = db
      .prepare(
        `
      UPDATE products
      SET 
        category = local.category,
        slug = local.slug,
        title = local.title,
        brand = local.brand,
        canonical_id = local.canonical_id,
        parent_asin = local.parent_asin,
        capacity = local.capacity,
        capacity_unit = local.capacity_unit,
        normalized_capacity = local.normalized_capacity,
        form_factor = local.form_factor,
        technology = local.technology,
        completeness_score = local.completeness_score,
        missing_specs = local.missing_specs,
        official_title = local.official_title,
        official_specifications = local.official_specifications,
        enrichment_status = local.enrichment_status,
        specifications_source = local.specifications_source,
        last_enriched_at = local.last_enriched_at
      FROM local_db.products AS local
      WHERE products.id = local.id
    `,
      )
      .run();

    console.log(`   ✅ Merged ${result.changes} products successfully!`);

    console.log("   Inserting new products and prices...");

    // Insert products that exist in local but not in prod candidate
    const insertProducts = db
      .prepare(
        `
      INSERT OR IGNORE INTO products
      SELECT * FROM local_db.products
      WHERE id NOT IN (SELECT id FROM products)
    `,
      )
      .run();
    console.log(`   ✅ Inserted ${insertProducts.changes} new products!`);

    // Insert prices for those new products (or any missing prices)
    const insertPrices = db
      .prepare(
        `
      INSERT OR IGNORE INTO prices
      SELECT * FROM local_db.prices
      WHERE id NOT IN (SELECT id FROM prices)
    `,
      )
      .run();
    console.log(`   ✅ Inserted ${insertPrices.changes} new prices!`);

    // Cleanup
    db.run("DETACH DATABASE local_db");
    db.close();

    // 4. Cleanup Remote
    console.log(`\n🧹 Step 4: Cleaning up temporary files...`);
    execSync(`ssh root@${PROD_IP} "rm ${HOST_DATA_DIR}/${REMOTE_BACKUP_NAME}"`);

    console.log(`\n✨ SUCCESS: Hybrid candidate prepared at ${PROD_TEMP_DB}`);
    console.log(`\n   NEXT STEPS:`);
    console.log(
      `   1. Verify the candidate using Drizzle Studio or sqlite3 CLI.`,
    );
    console.log(`   2. Run deploy-data.ts pointing to this candidate:`);
    console.log(
      `      DANGEROUSLY_FORCE_DB_PUSH="..." LOCAL_DB_OVERRIDE="${PROD_TEMP_DB}" bun scripts/database/deploy-data.ts --force`,
    );
  } catch (err: any) {
    console.error("\n❌ Hybrid Sync failed:", err.message);
    process.exit(1);
  }
}

hybridSync();
