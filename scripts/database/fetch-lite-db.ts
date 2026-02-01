/**
 * Fetch Lite DB from Netlify Blobs
 *
 * This script runs during the Netlify build process (prebuild).
 * It downloads the latest lite.db from Netlify Blobs storage,
 * ensuring the deployment always has fresh data without
 * committing binary files to Git.
 *
 * Required Environment Variables:
 * - NETLIFY_AUTH_TOKEN: Netlify Personal Access Token
 * - NETLIFY_SITE_ID: Netlify Site ID
 */

import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

const LITE_DB_PATH = path.join(process.cwd(), "data", "cleverprices-lite.db");
const STORE_NAME = "production-db";
const BLOB_KEY = "cleverprices-lite.db";

async function fetchLiteDb() {
  console.log("[Prebuild] Checking for lite.db in Netlify Blobs...");

  // Skip if not in Netlify environment (local dev uses local file)
  if (process.env.NETLIFY !== "true") {
    console.log("[Prebuild] Not on Netlify, skipping blob fetch.");
    return;
  }

  try {
    const store = getStore({
      name: STORE_NAME,
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    const blob = await store.get(BLOB_KEY, { type: "arrayBuffer" });

    if (!blob) {
      console.warn(
        `[Prebuild] ⚠️ Database blob '${BLOB_KEY}' not found in store '${STORE_NAME}'`,
      );
      return;
    }

    // Ensure data directory exists
    const dataDir = path.dirname(LITE_DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(LITE_DB_PATH, Buffer.from(blob));

    const sizeMB = (blob.byteLength / (1024 * 1024)).toFixed(2);
    console.log(`[Prebuild] ✅ Downloaded lite.db (${sizeMB} MB)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Prebuild] ❌ Failed to fetch lite.db:", message);

    // If we have a fallback file, don't fail the build
    if (fs.existsSync(LITE_DB_PATH)) {
      console.log("[Prebuild] Using existing fallback lite.db");
    } else {
      console.error("[Prebuild] No fallback available. Build may fail.");
    }
  }
}

fetchLiteDb();
