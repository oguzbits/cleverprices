import { describe, expect, it } from "bun:test";
import { getProductIdentity } from "./utils/product-identity";

describe("Monitor Identity - Idealo Reference Tests", () => {
  const cases = [
    {
      id: 1,
      brand: "ASUS",
      input: "ASUS ROG Strix OLED XG27AQWMG - 27 Zoll WQHD Gaming Monitor",
      expected: "ASUS ROG Strix OLED XG27AQWMG",
    },
    {
      id: 2,
      brand: "Apple",
      input: "Apple Studio Display - 27 Zoll 5K Retina Monitor",
      expected: "Apple Studio Display",
    },
    {
      id: 3,
      brand: "GigaByte",
      input: "GigaByte MO27Q28G OLED Gaming Monitor",
      expected: "GigaByte MO27Q28G",
    },
    {
      id: 4,
      brand: "LG",
      input: "LG 32GS95UX-B 32 Zoll OLED Gaming Monitor",
      expected: "LG 32GS95UX-B",
    },
    {
      id: 5,
      brand: "Dell",
      input: "Dell U2725QE 27 Zoll 4K Monitor",
      expected: "Dell U2725QE",
    },
    {
      id: 6,
      brand: "Samsung",
      input: "Samsung Essential Monitor S3 (LS24D364GAUXEN)",
      expected: "Samsung Essential S3 LS24D364GAUXEN",
    },
    {
      id: 7,
      brand: "Alienware",
      input: "Alienware AW2725Q Gaming Monitor",
      expected: "Alienware AW2725Q",
    },
    {
      id: 8,
      brand: "Samsung",
      input: "Samsung Odyssey G5 (C34G55TWWP) Curved Gaming Monitor",
      expected: "Samsung Odyssey G5 C34G55TWWP",
    },
    {
      id: 8.1, // Lenovo example
      brand: "Lenovo",
      input: "Lenovo Legion 27Q-10 Monitor",
      expected: "Lenovo Legion 27Q-10",
    },
    {
      id: 9,
      brand: "AOC",
      input: "AOC Q27G41ZDF 27 Zoll Gaming Monitor",
      expected: "AOC Q27G41ZDF",
    },
    {
      id: 10,
      brand: "Samsung",
      input: "Samsung Odyssey OLED G60SD (LS27DG600SUXEN)",
      expected: "Samsung Odyssey OLED G60SD LS27DG600SUXEN",
    },
    {
      id: 11,
      brand: "Xiaomi",
      input: "Xiaomi G34WQi UltraWide Gaming Monitor",
      expected: "Xiaomi G34WQi",
    },
    {
      id: 12,
      brand: "Samsung",
      input: "Samsung Essential S3 LS27D304GAUXEN",
      expected: "Samsung Essential S3 LS27D304GAUXEN",
    },
    {
      id: 13,
      brand: "Dell",
      input: "Dell UltraSharp U4025QW UltraWide Monitor",
      expected: "Dell UltraSharp U4025QW",
    },
    {
      id: 14,
      brand: "ASUS",
      input: "ASUS ROG Swift OLED PG32UCDMR Gaming Monitor",
      expected: "ASUS ROG Swift OLED PG32UCDMR",
    },
    {
      id: 15,
      brand: "LG",
      input: "LG UltraWide 34U511A-B Monitor",
      expected: "LG UltraWide 34U511A-B",
    },
    {
      id: 16,
      brand: "MSI",
      input: "MSI MPG 491CQPXDE QD-OLED Gaming Monitor",
      expected: "MSI MPG 491CQPXDE",
    },
    {
      id: 17,
      brand: "LG",
      input: "LG Ultragear 45GX950A-B OLED Gaming Monitor",
      expected: "LG Ultragear 45GX950A-B",
    },
    {
      id: 18,
      brand: "Xiaomi",
      input: "Xiaomi Mini LED Gaming G Pro 27i",
      expected: "Xiaomi Mini LED Gaming G Pro 27i",
    },
    {
      id: 19,
      brand: "Acer",
      input: "Acer Nitro VG270U P6 Gaming Monitor",
      expected: "Acer Nitro VG270U P6",
    },
    {
      id: 20,
      brand: "Dell",
      input:
        "Dell U2724D UltraSharp 27 Zoll QHD (2560x1440) Monitor, 120Hz, IPS Black, 5ms, 98% DCI-P3, 2X USB-C, 2X DisplayPort, HDMI, 3X USB, 3 Jahre Garantie, Silber",
      expected: "Dell U2724D UltraSharp",
    },
    {
      id: 21,
      brand: "Dell",
      input:
        "Dell 27 Plus USB-C Monitor - S2725QC, 4K UHD (3840x2160), 120Hz, IPS, 4ms, AMD FreeSync Premium, 99% sRGB, Höhenverstellbar, Eingebaute Lautsprecher, 2 USB-C, 2 HDMI, 2 USB, 3 Jahre Garantie",
      expected: "Dell Plus S2725QC",
    },
    {
      id: 22,
      brand: "MSI",
      input:
        "MSI MAG 321CUPDE QD-OLED 32 Zoll UHD Curved Gaming Monitor - 1700R, 3840 x 2160 Quantum Dot OLED Panel, 165Hz / 0,03ms, 99% DCI-P3, Delta E≤2, DisplayHDR True Black 400, DP 1. 4a, HDMI 2.1, USB Type-C",
      expected: "MSI MAG 321CUPDE",
    },
    {
      id: 23,
      brand: "ASUS",
      input: "ASUS ROG Strix OLED XG32UCWMG 15W",
      expected: "ASUS ROG Strix OLED XG32UCWMG",
    },
    {
      id: 24,
      brand: "HP",
      input: "HP 532sf 300cd/m²",
      expected: "HP 532sf",
    },
    {
      id: 25,
      brand: "ASUS",
      input:
        "ASUS ROG Strix OLED XG27ACDMS 27 Zoll WQHD Gaming Monitor (280 Hz, 0.03ms GtG, G-Sync, FreeSync, AdaptiveSync, ELMB, 10-bit QD-OLED Panel, 16:9, 2560x1440, DP 1.4, HDMI 2.1, USB-C mit 15W, Ergo.)",
      expected: "ASUS ROG Strix OLED XG27ACDMS",
    },
  ];

  it("should match Idealo reference titles for all cases", () => {
    for (const c of cases) {
      const identity = getProductIdentity({
        brand: c.brand,
        title: c.input,
        category: "monitors",
      });

      if (identity.displayTitle !== c.expected) {
        console.log(`CASE ${c.id} FAIL:`, {
          input: c.input,
          expected: c.expected,
          received: identity.displayTitle,
          modelWords: identity.modelTitle,
          variantTokens: identity.variantTokens,
          mpn: identity.mpn,
        });
      }

      // We expect the 'displayTitle' to match the Idealo reference
      expect(identity.displayTitle).toBe(c.expected);
    }
  });

  it("should fix the specific 'DCI-P3' leak reported by the user", () => {
    const input =
      "ASUS TUF Gaming VG27WQ3B - 27 Zoll WQHD Curved Monitor - 180 Hz, 1ms GtG, FreeSync, AdaptiveSync, HDR 10 - Fast-VA Panel, 16:9, 2560x1440, DisplayPort, HDMI, Speaker";
    const identity = getProductIdentity({
      brand: "ASUS",
      title: input,
      category: "monitors",
    });
    expect(identity.displayTitle).toBe("ASUS TUF Gaming VG27WQ3B");
  });

  it("should fix the description leak for HP monitors", () => {
    const input =
      "HP Arbeiten Sie wie es möchtenWenn richtige Technik für einen arbeitsreichen Tag mit Projekten Konferenzen und mehr brauchen ist höhenverstellbare FHD-Monitor HP-Serie einer Diagonale von";
    const identity = getProductIdentity({
      brand: "HP",
      title: input,
      category: "monitors",
    });
    // If it's a description leak without a clear model, it should at least not be the whole string.
    // Ideally it finds the brand/series but skips the marketing fluff.
    expect(identity.displayTitle).not.toContain("Arbeiten Sie");
    expect(identity.displayTitle).toContain("HP");
  });
});
