import { describe, expect, it } from "bun:test";
import {
  extractSalesRank,
  getDailyLow,
  keepaPriceToDecimal,
  keepaTimeToUnix,
  normalizeRating,
  parseKeepaHistory,
} from "./utils";

describe("keepa utility", () => {
  describe("keepaPriceToDecimal", () => {
    it("should convert integer price to decimal", () => {
      expect(keepaPriceToDecimal(2999)).toBe(29.99);
      expect(keepaPriceToDecimal(0)).toBe(0);
    });

    it("should handle null/undefined/negative", () => {
      expect(keepaPriceToDecimal(null)).toBe(null);
      expect(keepaPriceToDecimal(undefined)).toBe(null);
      expect(keepaPriceToDecimal(-1)).toBe(null);
    });
  });

  describe("extractSalesRank", () => {
    it("should extract the latest sales rank", () => {
      const salesRanks = {
        0: [
          [100, 1000],
          [200, 950],
        ],
      };
      expect(extractSalesRank(salesRanks)).toBe(950);
    });

    it("should return null for empty or null input", () => {
      expect(extractSalesRank(null)).toBe(null);
      expect(extractSalesRank({})).toBe(null);
    });
  });

  describe("normalizeRating", () => {
    it("should convert 10-50 rating to 1.0-5.0", () => {
      expect(normalizeRating(45)).toBe(4.5);
      expect(normalizeRating(10)).toBe(1.0);
    });

    it("should handle invalid values", () => {
      expect(normalizeRating(null)).toBe(null);
      expect(normalizeRating(0)).toBe(null);
    });
  });

  describe("keepaTimeToUnix", () => {
    it("should convert keepa minutes to unix timestamp", () => {
      // Keepa time 0 is 2011-01-01 00:00:00 UTC
      // 2011-01-01 00:00:00 in unix is 1293840000000
      expect(keepaTimeToUnix(0)).toBe(1293120000000);
      // Wait, let's verify the formula in the code: (keepaMinutes + 21552000) * 60000
      // 21552000 * 60000 = 1293120000000
    });
  });

  describe("parseKeepaHistory", () => {
    it("should parse CSV array into timestamped prices", () => {
      const csv = [0, 2999, 1440, 2499]; // 0 min, 29.99€; 1 day later, 24.99€
      const parsed = parseKeepaHistory(csv);
      expect(parsed.length).toBe(2);
      expect(parsed[0].price).toBe(29.99);
      expect(parsed[1].price).toBe(24.99);
      expect(parsed[0].timestamp).toBe(keepaTimeToUnix(0));
    });

    it("should handle empty or invalid input", () => {
      expect(parseKeepaHistory([])).toEqual([]);
      expect(parseKeepaHistory(undefined)).toEqual([]);
    });
  });

  describe("getDailyLow", () => {
    it("should aggregate data into daily minimums", () => {
      const history = [
        { timestamp: keepaTimeToUnix(0), price: 100 },
        { timestamp: keepaTimeToUnix(60), price: 90 }, // Same day, lower
        { timestamp: keepaTimeToUnix(1440), price: 95 }, // Next day
      ];
      const daily = getDailyLow(history);
      expect(daily.length).toBe(2);

      const day1Key = new Date(keepaTimeToUnix(0)).toISOString().split("T")[0];
      const day1 = daily.find(
        (d) => new Date(d.timestamp).toISOString().split("T")[0] === day1Key,
      );
      expect(day1?.price).toBe(90); // Min of 100 and 90
    });
  });
});
