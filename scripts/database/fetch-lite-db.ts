/**
 * Fetch Lite DB from Vercel Blob
 *
 * This script runs during the Vercel build process (prebuild).
 * It downloads the latest lite.db from Vercel Blob storage,
 * ensuring the deployment always has fresh data without
 * committing binary files to Git.
 *
 * Required Environment Variables:
 * - BLOB_READ_WRITE_TOKEN: Vercel Blob access token
 * - LITE_DB_BLOB_URL: URL to the lite.db in Vercel Blob (optional, has default)
 */

import fs from "fs";
import path from "path";

const LITE_DB_PATH = path.join(process.cwd(), "data", "cleverprices-lite.db");
const BLOB_URL = process.env.LITE_DB_BLOB_URL!;

async function fetchLiteDb() {
  console.log("[Prebuild] Fetching lite.db from Vercel Blob...");

  // Skip if not in Vercel environment (local dev uses local file)
  if (!process.env.VERCEL) {
    console.log("[Prebuild] Not on Vercel, skipping blob fetch.");
    return;
  }

  try {
    // 1. Check Remote Last-Modified via HEAD request
    let shouldDownload = true;
    let remoteLastModified: Date | null = null;

    try {
      const headResponse = await fetch(BLOB_URL, {
        method: "HEAD",
        headers: {
          ...(process.env.BLOB_READ_WRITE_TOKEN && {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          }),
        },
      });

      if (headResponse.ok) {
        const lastModHeader = headResponse.headers.get("last-modified");
        if (lastModHeader) {
          remoteLastModified = new Date(lastModHeader);

          // 2. Compare with Local File (if exists)
          // On Vercel, force download to bypass Git timestamp issues
          if (fs.existsSync(LITE_DB_PATH) && !process.env.VERCEL) {
            const stats = fs.statSync(LITE_DB_PATH);
            // Add a small buffer (2s) to avoid clock skew issues
            if (stats.mtime.getTime() > remoteLastModified.getTime() - 2000) {
              console.log(
                `[Prebuild] Local cache is fresh (Remote: ${remoteLastModified.toISOString()}). Skipping download.`,
              );
              shouldDownload = false;
            } else {
              console.log(
                `[Prebuild] Remote is newer (${remoteLastModified.toISOString()}). Downloading...`,
              );
            }
          }
        }
      }
    } catch (headError) {
      console.warn(
        "[Prebuild] Failed to check HEAD, falling back to download for safety.",
      );
    }

    if (!shouldDownload) {
      return;
    }

    // 3. Download if needed
    const response = await fetch(BLOB_URL, {
      headers: {
        // Vercel Blob public URLs don't need auth, but private ones do
        ...(process.env.BLOB_READ_WRITE_TOKEN && {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch lite.db: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();

    // Ensure data directory exists
    const dataDir = path.dirname(LITE_DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(LITE_DB_PATH, Buffer.from(buffer));

    const sizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);
    console.log(`[Prebuild] ✅ Downloaded lite.db (${sizeMB} MB)`);
  } catch (error: any) {
    console.error("[Prebuild] ❌ Failed to fetch lite.db:", error.message);

    // If we have a fallback file, don't fail the build
    if (fs.existsSync(LITE_DB_PATH)) {
      console.log("[Prebuild] Using existing fallback lite.db");
    } else {
      // No fallback available, the build will fail later when trying to read the DB
      console.error("[Prebuild] No fallback available. Build may fail.");
    }
  }
}

fetchLiteDb();
