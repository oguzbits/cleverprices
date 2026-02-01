/**
 * Upload Lite DB to Vercel Blob
 *
 * This script uploads the local cleverprices-lite.db to Vercel Blob storage.
 * Run this manually when you want to update the production database.
 *
 * Usage: bun run db:upload-blob
 *
 * Required Environment Variables (in .env.local):
 * - BLOB_READ_WRITE_TOKEN: Your Vercel Blob token
 * - LITE_DB_BLOB_URL: The destination URL in Vercel Blob
 */

import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

const LITE_DB_PATH = path.join(process.cwd(), "data", "cleverprices-lite.db");
const STORE_NAME = "production-db";
const BLOB_KEY = "cleverprices-lite.db";

async function uploadLiteDb() {
  // Check for required env vars
  if (!process.env.NETLIFY_AUTH_TOKEN || !process.env.NETLIFY_SITE_ID) {
    console.error("❌ Missing NETLIFY_AUTH_TOKEN or NETLIFY_SITE_ID in .env.local");
    console.log("💡 Run this with `netlify link` active or set the vars manually.");
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(LITE_DB_PATH)) {
    console.error("❌ lite.db not found. Run 'bun run db:lite' first.");
    process.exit(1);
  }

  const stats = fs.statSync(LITE_DB_PATH);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`📦 Uploading lite.db (${sizeMB} MB) to Netlify Blobs...`);

  try {
    const store = getStore({
      name: STORE_NAME,
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    const fileBuffer = fs.readFileSync(LITE_DB_PATH);

    await store.set(BLOB_KEY, fileBuffer);

    console.log(`✅ Upload complete to store: ${STORE_NAME}`);
  } catch (error: any) {
    console.error("❌ Upload failed:", error.message);
    process.exit(1);
  }
}

uploadLiteDb();
