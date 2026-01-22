#!/usr/bin/env bun
/**
 * Proof of Concept: History Compression Benchmark
 *
 * This script demonstrates the potential size savings from compressing
 * price history data using gzip.
 *
 * Since the local DB is currently corrupted, we use realistic mock data.
 */

import { gunzipSync, gzipSync } from "node:zlib";

// Generate realistic mock history data
function generateMockHistory(days: number): Record<string, number> {
  const history: Record<string, number> = {};
  const basePrice = Math.floor(Math.random() * 50000) + 5000; // 50-500€ in cents
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Add some price variance (±10%)
    const variance = (Math.random() - 0.5) * 0.2 * basePrice;
    history[dateStr] = Math.round(basePrice + variance);
  }

  return history;
}

async function main() {
  console.log("📊 History Compression Benchmark (Using Mock Data)\n");

  const PRODUCT_COUNT = 7800;
  const DAYS_OF_HISTORY = 365;

  console.log(
    `Simulating ${PRODUCT_COUNT} products with ${DAYS_OF_HISTORY} days of history...\n`,
  );

  let totalOriginalBytes = 0;
  let totalCompressedBytes = 0;
  let totalDataPoints = 0;

  const samples: {
    id: number;
    original: number;
    compressed: number;
    ratio: number;
    points: number;
  }[] = [];

  for (let id = 1; id <= PRODUCT_COUNT; id++) {
    // Vary the history length to simulate real data (some products have less history)
    const historyDays = Math.floor(Math.random() * DAYS_OF_HISTORY) + 30;
    const history = generateMockHistory(historyDays);
    const historyJson = JSON.stringify(history);

    const originalBytes = Buffer.byteLength(historyJson, "utf8");

    // Compress using gzip
    const compressed = gzipSync(Buffer.from(historyJson, "utf8"));
    const compressedBytes = compressed.length;

    // Verify decompression works
    const decompressed = gunzipSync(compressed);
    const decompressedStr = new TextDecoder().decode(decompressed);

    if (decompressedStr !== historyJson) {
      console.error(`❌ Decompression mismatch for id ${id}!`);
      continue;
    }

    const points = Object.keys(history).length;

    totalOriginalBytes += originalBytes;
    totalCompressedBytes += compressedBytes;
    totalDataPoints += points;

    samples.push({
      id,
      original: originalBytes,
      compressed: compressedBytes,
      ratio: (1 - compressedBytes / originalBytes) * 100,
      points,
    });
  }

  // Sort by compression ratio to show range
  samples.sort((a, b) => b.ratio - a.ratio);

  console.log("📈 Sample Results (Top 5 Best Compression):");
  for (const s of samples.slice(0, 5)) {
    console.log(
      `  ID ${s.id}: ${s.original} → ${s.compressed} bytes (${s.ratio.toFixed(1)}% saved, ${s.points} points)`,
    );
  }

  console.log("\n📉 Sample Results (Bottom 5 Worst Compression):");
  for (const s of samples.slice(-5)) {
    console.log(
      `  ID ${s.id}: ${s.original} → ${s.compressed} bytes (${s.ratio.toFixed(1)}% saved, ${s.points} points)`,
    );
  }

  const overallRatio = (1 - totalCompressedBytes / totalOriginalBytes) * 100;
  const avgPointsPerProduct = totalDataPoints / samples.length;

  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));
  console.log(`  Products with history:     ${samples.length}`);
  console.log(
    `  Total data points:         ${totalDataPoints.toLocaleString()}`,
  );
  console.log(`  Avg points per product:    ${avgPointsPerProduct.toFixed(1)}`);
  console.log("");
  console.log(
    `  Original size:             ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(
    `  Compressed size:           ${(totalCompressedBytes / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`  Savings:                   ${overallRatio.toFixed(1)}%`);
  console.log("");
  console.log(
    `  💡 Estimated DB size after: ~${(10 + totalCompressedBytes / 1024 / 1024).toFixed(0)} MB (from ~${(10 + totalOriginalBytes / 1024 / 1024).toFixed(0)} MB)`,
  );
}

main().catch(console.error);
