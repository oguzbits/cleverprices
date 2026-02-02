import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { gzip } from "zlib";

const gzipAsync = promisify(gzip);

// Configuration
const REQUIRED_VARS = [
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_ENDPOINT",
];

// Check env vars
const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[Backup] Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function backup() {
  const dbPath = path.join(process.cwd(), "data", "cleverprices.db");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `backup-${timestamp}.db.gz`;

  console.log(`[Backup] Starting backup for: ${dbPath}`);

  if (!fs.existsSync(dbPath)) {
    console.error(`[Backup] Database not found at ${dbPath}`);
    process.exit(1);
  }

  try {
    // 1. Read and Compress
    console.log("[Backup] Reading and compressing database...");
    const fileBuffer = fs.readFileSync(dbPath);
    const compressedBuffer = await gzipAsync(fileBuffer);
    const sizeMb = (compressedBuffer.length / 1024 / 1024).toFixed(2);

    console.log(`[Backup] Compressed size: ${sizeMb} MB`);

    // 2. Upload to R2
    console.log("[Backup] Uploading to R2...");
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
    console.log(`[Backup] ✅ Success! Saver to: ${backupName}`);

    // 3. Rotation Policy (SafeGuard)
    console.log("[Backup] Checking retention policy...");
    const ListObjectsCommand = (await import("@aws-sdk/client-s3"))
      .ListObjectsV2Command;
    const DeleteObjectCommand = (await import("@aws-sdk/client-s3"))
      .DeleteObjectCommand;

    const listParams = {
      Bucket: process.env.R2_BUCKET,
      Prefix: "backup-",
    };

    const listedObjects = await s3.send(new ListObjectsCommand(listParams));

    if (listedObjects.Contents && listedObjects.Contents.length > 30) {
      // Sort by Date (Oldest first)
      const sorted = listedObjects.Contents.sort((a, b) => {
        return (
          (a.LastModified?.getTime() || 0) - (b.LastModified?.getTime() || 0)
        );
      });

      // Delete extra backups
      const toDelete = sorted.slice(0, sorted.length - 30);
      console.log(`[Backup] Pruning ${toDelete.length} old backups...`);

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

    console.log("[Backup] ✅ Rotation complete. Total clean.");
  } catch (error) {
    console.error("[Backup] ❌ Failed:", error);
    process.exit(1);
  }
}

backup();
