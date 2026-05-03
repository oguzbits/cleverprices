/**
 * History Compression Utilities
 *
 * Compresses and decompresses price history JSON blobs using gzip.
 * This reduces storage by ~73% while preserving full 365-day daily precision.
 *
 * Usage:
 *   const compressed = compressHistory(JSON.stringify(historyObj));
 *   const decompressed = decompressHistory(compressedBlob);
 *   const historyObj = JSON.parse(decompressed);
 */

import { gunzipSync, gzipSync } from "node:zlib";

import { getSafeDate } from "./server/deterministic-time";

/**
 * Compress a JSON string to a gzipped Buffer.
 * @param json - The JSON string to compress
 * @returns A gzipped Buffer suitable for storing in a BLOB column
 */
export function compressHistory(json: string): Buffer {
  return Buffer.from(gzipSync(Buffer.from(json, "utf8")));
}

/**
 * Decompress a gzipped Buffer back to a JSON string.
 * @param blob - The gzipped Buffer from the database
 * @returns The original JSON string
 */
export function decompressHistory(blob: Buffer | Uint8Array | null): string {
  if (!blob) return "{}";

  const input = blob instanceof Buffer ? blob : new Uint8Array(blob);

  // Check for gzip magic number (0x1f 0x8b)
  const isGzipped = input.length >= 2 && input[0] === 0x1f && input[1] === 0x8b;

  if (isGzipped) {
    try {
      const decompressed = gunzipSync(input);
      return new TextDecoder().decode(decompressed);
    } catch (error) {
      console.error(
        "[History Decompression Error]",
        error instanceof Error ? error.message : error,
      );
      // If decompression fails despite having the header, fall back to plain text
    }
  }

  // Fallback to plain text (either not gzipped or gunzip failed)
  try {
    if (blob instanceof Buffer) {
      return blob.toString("utf8");
    }
    return new TextDecoder().decode(blob);
  } catch (fallbackError) {
    if (isGzipped) {
      console.error("[History Fallback Error]", fallbackError);
    }
    return "{}";
  }
}

/**
 * Parse a history blob (compressed or uncompressed) into a Record.
 * Handles both legacy TEXT and new BLOB formats during migration.
 * @param blob - The raw data from the database
 * @returns Parsed history object { "YYYY-MM-DD": priceInCents }
 */
export function parseHistoryBlob(
  blob: Buffer | Uint8Array | string | null,
): Record<string, number> {
  if (!blob) return {};

  try {
    let jsonStr: string;

    if (typeof blob === "string") {
      // Legacy TEXT format
      jsonStr = blob;
    } else {
      // Try to decompress; fallback to plain text if it fails
      jsonStr = decompressHistory(blob);
    }

    return JSON.parse(jsonStr) as Record<string, number>;
  } catch {
    return {};
  }
}

/**
 * Prune history to keep only entries within the specified number of days.
 * @param history - The history object
 * @param maxDays - Maximum age in days (default: 365)
 * @returns Pruned history object
 */
export function pruneHistory(
  history: Record<string, number>,
  maxDays: number = 365,
): Record<string, number> {
  const cutoff = getSafeDate();
  cutoff.setDate(cutoff.getDate() - maxDays);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const pruned: Record<string, number> = {};
  for (const [date, price] of Object.entries(history)) {
    if (date >= cutoffStr) {
      pruned[date] = price;
    }
  }

  return pruned;
}
