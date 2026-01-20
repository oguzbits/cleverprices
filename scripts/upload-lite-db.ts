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

import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

const LITE_DB_PATH = path.join(process.cwd(), "data", "cleverprices-lite.db");

async function uploadLiteDb() {
  // Check for required env vars
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌ Missing BLOB_READ_WRITE_TOKEN in .env.local");
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(LITE_DB_PATH)) {
    console.error("❌ lite.db not found. Run 'bun run db:lite' first.");
    process.exit(1);
  }

  const stats = fs.statSync(LITE_DB_PATH);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`📦 Uploading lite.db (${sizeMB} MB) to Vercel Blob...`);

  try {
    const fileBuffer = fs.readFileSync(LITE_DB_PATH);

    const blob = await put("cleverprices-lite.db", fileBuffer, {
      access: "public",
      contentType: "application/x-sqlite3",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`✅ Upload complete!`);
    console.log(`📍 URL: ${blob.url}`);
    console.log(
      `\n💡 Add this URL to your Vercel Environment Variables as LITE_DB_BLOB_URL`,
    );
  } catch (error: any) {
    console.error("❌ Upload failed:", error.message);
    process.exit(1);
  }
}

uploadLiteDb();
