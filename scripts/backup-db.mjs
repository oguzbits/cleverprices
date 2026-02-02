import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { gzip } from "zlib";

const gzipAsync = promisify(gzip);

console.log("[Backup] 👋 Booting backup script (Node.js ESM)...");

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
  console.error(`[Backup] ❌ Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function backup() {
  const possiblePaths = [
    path.join(process.cwd(), "data", "cleverprices.db"),
    "/app/data/cleverprices.db",
  ];

  let dbPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      dbPath = p;
      break;
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `backup-${timestamp}.db.gz`;

  console.log(`[Backup] 🔍 Searching for database...`);
  if (!dbPath) {
    console.error(`[Backup] ❌ Database not found!`);
    console.log(`[Backup] Current directory: ${process.cwd()}`);
    process.exit(1);
  }

  console.log(`[Backup] 📂 Found database at: ${dbPath}`);

  try {
    // 1. Read and Compress
    console.log("[Backup] 📦 Compressing database...");
    const fileBuffer = fs.readFileSync(dbPath);
    const compressedBuffer = await gzipAsync(fileBuffer);
    const sizeMb = (compressedBuffer.length / 1024 / 1024).toFixed(2);

    console.log(`[Backup] ✅ Compression complete (${sizeMb} MB)`);

    // 2. Upload to R2
    console.log(`[Backup] ☁️ Uploading to R2...`);
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
    console.log(`[Backup] 🚀 Upload successful: ${backupName}`);

    // 3. Rotation Policy
    console.log("[Backup] 🧹 Checking retention policy...");
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET,
        Prefix: "backup-",
      }),
    );

    if (listed.Contents && listed.Contents.length > 30) {
      const sorted = listed.Contents.sort(
        (a, b) => a.LastModified.getTime() - b.LastModified.getTime(),
      );
      const toDelete = sorted.slice(0, sorted.length - 30);

      for (const obj of toDelete) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: obj.Key,
          }),
        );
        console.log(`[Backup] Deleted old backup: ${obj.Key}`);
      }
    }

    console.log("[Backup] ✅ Finished successfully.");
  } catch (error) {
    console.error("[Backup] 💥 Error:", error);
    process.exit(1);
  }
}

backup();
