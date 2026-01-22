import { describe, expect, test } from "bun:test";
import {
  compressHistory,
  decompressHistory,
  parseHistoryBlob,
  pruneHistory,
} from "./history-compression";

describe("history-compression", () => {
  const sampleHistory = {
    "2025-01-22": 89900,
    "2025-01-21": 90500,
    "2025-01-20": 88900,
  };

  describe("compressHistory / decompressHistory", () => {
    test("round-trip compression preserves data exactly", () => {
      const json = JSON.stringify(sampleHistory);
      const compressed = compressHistory(json);
      const decompressed = decompressHistory(compressed);

      expect(decompressed).toBe(json);
    });

    test("compressed size is smaller than original", () => {
      // Create a realistic 365-day history
      const largeHistory: Record<string, number> = {};
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        largeHistory[dateStr] = 50000 + Math.floor(Math.random() * 10000);
      }

      const json = JSON.stringify(largeHistory);
      const compressed = compressHistory(json);

      expect(compressed.length).toBeLessThan(json.length);
      // Should achieve at least 50% compression
      expect(compressed.length).toBeLessThan(json.length * 0.5);
    });

    test("decompressHistory handles null gracefully", () => {
      expect(decompressHistory(null)).toBe("{}");
    });

    test("decompressHistory handles plain text fallback", () => {
      const json = JSON.stringify(sampleHistory);
      const plainBuffer = Buffer.from(json, "utf8");

      // Should fall back to treating it as plain text
      const result = decompressHistory(plainBuffer);
      expect(result).toBe(json);
    });
  });

  describe("parseHistoryBlob", () => {
    test("parses compressed blob correctly", () => {
      const json = JSON.stringify(sampleHistory);
      const compressed = compressHistory(json);

      const parsed = parseHistoryBlob(compressed);
      expect(parsed).toEqual(sampleHistory);
    });

    test("parses legacy string format", () => {
      const json = JSON.stringify(sampleHistory);

      const parsed = parseHistoryBlob(json);
      expect(parsed).toEqual(sampleHistory);
    });

    test("returns empty object for null", () => {
      expect(parseHistoryBlob(null)).toEqual({});
    });

    test("returns empty object for invalid JSON", () => {
      expect(parseHistoryBlob("not valid json")).toEqual({});
    });
  });

  describe("pruneHistory", () => {
    test("keeps entries within maxDays", () => {
      const today = new Date().toISOString().split("T")[0];
      const history = {
        [today]: 10000,
        "2020-01-01": 5000, // Very old, should be pruned
      };

      const pruned = pruneHistory(history, 365);

      expect(pruned[today]).toBe(10000);
      expect(pruned["2020-01-01"]).toBeUndefined();
    });

    test("defaults to 365 days", () => {
      const today = new Date();
      const history: Record<string, number> = {};

      // Add entry for today
      const todayStr = today.toISOString().split("T")[0];
      history[todayStr] = 10000;

      // Add entry for 400 days ago
      const oldDate = new Date(today);
      oldDate.setDate(oldDate.getDate() - 400);
      const oldStr = oldDate.toISOString().split("T")[0];
      history[oldStr] = 5000;

      const pruned = pruneHistory(history);

      expect(Object.keys(pruned).length).toBe(1);
      expect(pruned[todayStr]).toBe(10000);
    });
  });
});
