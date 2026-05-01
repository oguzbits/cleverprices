import { describe, expect, it } from "bun:test";

import { computePriceAnalysis } from "./price-analysis-utils";
import { getSafeNow } from "./server/deterministic-time";


describe("computePriceAnalysis", () => {
  // Setup consistent chart data
  const baseDate = new Date("2025-01-01");
  const history = [
    { date: new Date("2025-01-01"), price: 100 },
    { date: new Date("2025-01-02"), price: 100 },
    { date: new Date("2025-01-03"), price: 100 },
    { date: new Date("2025-01-04"), price: 90 }, // Low
    { date: new Date("2025-01-05"), price: 110 }, // High
  ]; // Avg: 100

  it("should return null if history has less than 2 points", () => {
    expect(computePriceAnalysis(100, [])).toBeNull();
    expect(
      computePriceAnalysis(100, [{ date: new Date(), price: 100 }]),
    ).toBeNull();
  });

  it("should return null if current price is missing/invalid", () => {
    expect(computePriceAnalysis(0, history)).toBeNull();
    expect(computePriceAnalysis(-10, history)).toBeNull();
  });

  it("should calculate correct average and recommendations", () => {
    // Current price 100 (matches avg) -> Fair
    const result = computePriceAnalysis(100, history);
    expect(result?.averagePrice).toBe(100);
    expect(result?.currentPrice).toBe(100);
    expect(result?.recommendation).toBe("fair");
    expect(result?.lowestPrice).toBe(90);
    expect(result?.highestPrice).toBe(110);
  });

  it("should recommend 'great_deal' if price is near lowest (<= 5% from lowest)", () => {
    // Lowest is 90. 92 is within 5% of 90? (2/90 = 2.2%) -> Yes
    const result = computePriceAnalysis(92, history);
    expect(result?.recommendation).toBe("great_deal");
    expect(result?.recommendationText).toContain("near the lowest price");
  });

  it("should recommend 'good_price' if price is 5-10% below average", () => {
    // Avg 100. Price 93 is 7% below avg (but not close enough to lowest 90 to trigger great deal?)
    // Lowest 90. 93 is 3.3% from lowest. It might trigger great_deal via lowest check first!

    // Let's adjust history so lowest is far away
    const historyHighLowest = [
      { date: new Date(), price: 100 },
      { date: new Date(), price: 100 },
      { date: new Date(), price: 80 }, // Lowest 80
    ]; // Avg 93.33.
    // We want price ~7% below avg but > 5% above lowest.
    // Price 87. Avg 93.3. Lowest 80.
    // % from lowest: (87-80)/80 = 8.75% (>5, so not great_deal via lowest)
    // % from avg: (87-93.3)/93.3 = -6.7% (between -5 and -10) -> good_price?

    const result = computePriceAnalysis(87, historyHighLowest);
    expect(result?.recommendation).toBe("good_price");
  });

  it("should recommend 'wait' if price is > 5% above average", () => {
    // Avg 100. Price 110.
    const result = computePriceAnalysis(110, history);
    expect(result?.recommendation).toBe("wait");
    expect(result?.percentFromAverage).toBeGreaterThan(5);
  });

  it("should calculate correct dates analyzed", () => {
    const d1 = new Date(getSafeNow());

    const d2 = new Date(d1);
    d2.setDate(d2.getDate() - 10);

    const hist = [
      { date: d2, price: 100 },
      { date: d1, price: 100 },
    ];

    const result = computePriceAnalysis(100, hist, d1.getTime());
    // Should be approx 10 days
    expect(result?.daysAnalyzed).toBeGreaterThanOrEqual(10);
    expect(result?.daysAnalyzed).toBeLessThanOrEqual(11);
  });
});
