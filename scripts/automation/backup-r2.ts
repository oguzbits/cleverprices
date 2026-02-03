#!/usr/bin/env bun
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { gzipSync } from "zlib";

/**
 * CleverPrices R2 Backup Engine
 *
 * Periodically backs up the local SQLite database to Cloudflare R2
 * while maintaining a 30-day rotation policy.
 */

// 1. Configuration & Env Validation
const REQUIRED_VARS = [
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_ENDPOINT",
];

const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `[Backup] ❌ Missing environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function runBackup() {
  console.log("🚀 Starting Database Backup to R2...");

  // 2. Identify Database Path
  const dbPath = join(process.cwd(), "data", "cleverprices.db");

  if (!existsSync(dbPath)) {
    console.error(`[Backup] ❌ Database NOT found at: ${dbPath}`);
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `backup-${timestamp}.db.gz`;

  try {
    // 3. Compression Phase (Bun + Zlib)
    console.log("[Backup] 📦 Compressing database...");
    const fileBuffer = readFileSync(dbPath);
    const compressedBuffer = gzipSync(fileBuffer);
    const sizeMb = (compressedBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`[Backup] ✅ Compression complete (${sizeMb} MB)`);

    // 4. Upload Phase
    console.log(
      `[Backup] ☁️ Uploading to R2 (${process.env.R2_BUCKET}/${backupName})...`,
    );
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.R2_BUCKET,
        Key: backupName,
        Body: compressedBuffer,
        ContentType: "application/gzip",
      },
    });

    await upload.done();
    console.log(`[Backup] 🚀 Upload successful!`);

    // 5. Rotation Phase (Maintain last 30 backups)
    console.log("[Backup] 🧹 Checking retention policy (30 days)...");
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET,
        Prefix: "backup-",
      }),
    );

    if (listed.Contents && listed.Contents.length > 30) {
      const sorted = listed.Contents.sort(
        (a, b) =>
          (a.LastModified?.getTime() || 0) - (b.LastModified?.getTime() || 0),
      );
      const toDelete = sorted.slice(0, sorted.length - 30);

      console.log(`[Backup] ✂️ Pruning ${toDelete.length} old backups...`);
      for (const obj of toDelete) {
        if (obj.Key) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET,
              Key: obj.Key,
            }),
          );
          console.log(`[Backup] Deleted: ${obj.Key}`);
        }
      }
    }

    console.log("[Backup] ✅ Backup cycle complete.");
  } catch (error) {
    console.error(
      `[Backup] 💥 Fatal Error:`,
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

runBackup();
