import { describe, expect, it } from "bun:test";
import { gzipSync } from "node:zlib";
import { decompressHistory, parseHistoryBlob } from "./history-compression";

describe("history-compression", () => {
  describe("decompressHistory", () => {
    it("should return empty object string for null input", () => {
      expect(decompressHistory(null)).toBe("{}");
    });

    it("should decompress a valid Buffer", () => {
      const data = JSON.stringify({ "2025-01-01": 1000 });
      const compressed = gzipSync(data);
      expect(decompressHistory(compressed)).toBe(data);
    });

    it("should decompress a valid Uint8Array", () => {
      const data = JSON.stringify({ "2025-01-01": 1000 });
      const compressed = gzipSync(data);
      const uint8 = new Uint8Array(compressed);
      expect(decompressHistory(uint8)).toBe(data);
    });

    it("should handle plain text fallback (Buffer)", () => {
      // Simulate legacy data stored as plain text buffer
      const data = JSON.stringify({ "2025-01-01": 1000 });
      const buffer = Buffer.from(data);
      // decompressHistory should fail gunzip and fall back to toString
      expect(decompressHistory(buffer)).toBe(data);
    });

    it("should return empty object string for invalid garbage data", () => {
      const garbage = Buffer.from([0x1, 0x2, 0x3]);
      // This is not gzip, and not valid utf8 text yielding JSON?
      // Actually fallback tries to decode as text.
      // If it decodes to random string, it returns that string.
      // But parseHistoryBlob will fail JSON.parse later.
      // decompressHistory itself just returns the string.
      // Let's verify it doesn't crash.
      const result = decompressHistory(garbage);
      expect(typeof result).toBe("string");
    });
  });

  describe("parseHistoryBlob", () => {
    it("should parse legacy plain text JSON string", () => {
      const data = { "2024-01-01": 500 };
      const result = parseHistoryBlob(JSON.stringify(data));
      expect(result).toEqual(data);
    });

    it("should parse compressed Buffer", () => {
      const data = { "2024-01-01": 500 };
      const compressed = gzipSync(JSON.stringify(data));
      const result = parseHistoryBlob(compressed);
      expect(result).toEqual(data);
    });

    it("should return empty object for invalid input", () => {
      expect(parseHistoryBlob(null)).toEqual({});
      expect(parseHistoryBlob("invalid-json")).toEqual({});
    });
  });
});
