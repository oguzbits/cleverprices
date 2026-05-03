import { describe, expect, it } from "bun:test";

import { getProductIdentity } from "./utils/product-identity";

describe("Monitor Identity - Idealo Reference Tests", () => {
  const cases = [
    {
      id: 1,
      brand: "LG",
      input: "LG 27GP850-B UltraGear Gaming Monitor",
      expected: "LG 27GP850-B",
    },
    {
      id: 2,
      brand: "Samsung",
      input: "Samsung Odyssey G7 G75T 32 Zoll Curved Gaming Monitor",
      expected: "Samsung Odyssey G7 G75T",
    },
    {
      id: 3,
      brand: "Dell",
      input: "Dell S2721DGF 27 Zoll QHD Gaming Monitor",
      expected: "Dell S2721DGF",
    },
    {
      id: 4,
      brand: "ASUS",
      input: "ASUS ROG Swift PG32UCDM OLED Gaming Monitor",
      expected: "ASUS ROG Swift PG32UCDM",
    },
    {
      id: 5,
      brand: "MSI",
      input: "MSI Optix MAG274QRF-QD Gaming Monitor",
      expected: "MSI Optix MAG274QRF-QD",
    },
    {
      id: 6,
      brand: "AOC",
      input: "AOC Gaming C24G2U/BK 24 Zoll Curved Monitor",
      expected: "AOC C24G2U/BK",
    },
    {
      id: 7,
      brand: "BenQ",
      input: "BenQ MOBIUZ EX2710S Gaming Monitor",
      expected: "BenQ MOBIUZ EX2710S",
    },
    {
      id: 8,
      brand: "GIGABYTE",
      input: "GIGABYTE M27Q 27 Zoll KVM Gaming Monitor",
      expected: "GIGABYTE M27Q",
    },
    {
      id: 9,
      brand: "HP",
      input: "HP OMEN 27q QHD Gaming Monitor",
      expected: "HP OMEN 27q",
    },
    {
      id: 10,
      brand: "Samsung",
      input: "Samsung Odyssey OLED G6 (G60SD) S27DG600SU",
      expected: "Samsung Odyssey OLED G6 G60SD S27DG600SU",
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
      brand: "iiyama",
      input: "iiyama G-Master GB2770HSU-B5 Red Eagle",
      expected: "iiyama G-Master GB2770HSU-B5",
    },
    {
      id: 15,
      brand: "LG",
      input: "LG UltraWide 34U511A-B Monitor",
      expected: "LG 34U511A-B",
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
      input: "LG 38WR85QC-W Curved UltraWide Hub Monitor",
      expected: "LG 38WR85QC-W",
    },
    {
      id: 18,
      brand: "iiyama",
      input: "iiyama ProLite XUB2792QSN-B5",
      expected: "iiyama ProLite XUB2792QSN-B5",
    },
    {
      id: 19,
      brand: "Iiyama",
      input: "iiyama Prolite XB3270QSU-B1 USB3.2",
      expected: "iiyama Prolite XB3270QSU-B1",
    },
    {
      id: 20,
      brand: "Minifire",
      input: "Minifire 2.1TMDS 1xDP MFG34C5Q",
      expected: "Minifire MFG34C5Q",
    },
    {
      id: 21,
      brand: "Acer",
      input: "acer Nitro ED273 S3 1xDP",
      expected: "acer Nitro ED273 S3",
    },
    {
      id: 22,
      brand: "Amzfast",
      input: "Amzfast HDMI2.1 DP1.4 75x75mm AMZG34C5Q",
      expected: "Amzfast AMZG34C5Q",
    },
    {
      id: 23,
      brand: "Minifire",
      input: "Minifire Curved Gaming Pip/PBP 300nits MFG34C5Q",
      expected: "Minifire MFG34C5Q",
    },
    {
      id: 24,
      brand: "Minifire",
      input: "Minifire Ports MFG34C5Q",
      expected: "Minifire MFG34C5Q",
    },
    {
      id: 25,
      brand: "Amzfast",
      input: "Amzfast AMZG34C5Q Pro",
      expected: "Amzfast AMZG34C5Q",
    },
    {
      id: 26,
      brand: "BenQ",
      input: "BenQ GW2486TC 1080p",
      expected: "BenQ GW2486TC",
    },
    {
      id: 27,
      brand: "MSI",
      input: "MSI MAG 272URDF E16 1.4a",
      expected: "MSI MAG 272URDF E16",
    },
    {
      id: 28,
      brand: "MSI",
      input: "MSI Modern MD342CQP 3-Achsen 2.0b",
      expected: "MSI Modern MD342CQP",
    },
    {
      id: 29,
      brand: "MSI",
      input: "MSI MAG 272FDE 2.0b 1.2a",
      expected: "MSI MAG 272FDE",
    },
    {
      id: 30,
      brand: "BenQ",
      input: "BenQ MA270U P3-Farbraum",
      expected: "BenQ MA270U",
    },
    {
      id: 31,
      brand: "AOC",
      input: "AOC CU34G4-34",
      expected: "AOC CU34G4",
    },
    {
      id: 32,
      brand: "iiyama",
      input: "iiyama Prolite T2252MSC-B2 7H",
      expected: "iiyama Prolite T2252MSC-B2",
    },
    {
      id: 33,
      brand: "AOC",
      input: "AOC 27G2ZN3-27",
      expected: "AOC 27G2ZN3",
    },
    {
      id: 34,
      brand: "Amzfast",
      input: "Amzfast DQHD5120x1440 2/DP AZMG49C7U",
      expected: "Amzfast AZMG49C7U",
    },
    {
      id: 35,
      brand: "Amzfast",
      input:
        "Amzfast 34 Zoll Curved Gaming Monitor - 165Hz(DP), 21:9 UltraWide QHD(3440x1440), 1 ms GtG, sRGB 130%, DCI-P3 95%, HDR, Adaptive Sync, Eyes-Care, VESA 75x75, HDMI 2.0*2/DP 1.4*2, PIP/PBP - AMZG34C5Q",
      expected: "Amzfast AMZG34C5Q",
    },
    {
      id: 36,
      brand: "Amzfast",
      input: "Amzfast 1500R",
      mpn: "AMZG27C1Q",
      expected: "Amzfast AMZG27C1Q",
    },
    {
      id: 37,
      brand: "CRUA",
      input: "CRUA 3000R",
      expected: "CRUA",
    },
    {
      id: 38,
      brand: "Amzfast",
      input: "Amzfast 4000:1 Kontrast AMZG27C1",
      expected: "Amzfast AMZG27C1",
    },
    {
      id: 39,
      brand: "KOORUI",
      input: "KOORUI Neigungsverstellbar Augenpflege",
      expected: "KOORUI",
    },
    {
      id: 40,
      brand: "Amzfast",
      input: "Amzfast PC PBP/Pip AZMG49C7U",
      expected: "Amzfast AZMG49C7U",
    },
  ];

  it("should match Idealo reference titles for all cases", () => {
    for (const c of cases) {
      const identity = getProductIdentity({
        brand: c.brand,
        title: c.input,
        mpn: c.mpn,
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
    const title =
      "LG 27UP650P-W 27 Zoll UHD 4K Monitor (IPS-Panel, 60 Hz, 5 ms GtG, VESA DisplayHDR 400, 95% DCI-P3)";
    const identity = getProductIdentity({
      brand: "LG",
      title,
      category: "monitors",
    });

    expect(identity.displayTitle).toBe("LG 27UP650P-W");
    expect(identity.variantTokens).not.toContain("dcip3");
  });

  it("should fix the description leak for HP monitors", () => {
    const title =
      "HP M27fe (27 Zoll) Full HD Monitor (IPS, 75Hz, 5ms, VGA, HDMI, AMD FreeSync) silber";
    const identity = getProductIdentity({
      brand: "HP",
      title,
      category: "monitors",
    });

    expect(identity.displayTitle).toBe("HP M27fe");
  });
  it("should recover MPN from passed data if title is only noise", () => {
    const identity = getProductIdentity({
      brand: "Amzfast",
      title: "Amzfast UltraWide",
      mpn: "AMZG34C5Q",
      category: "monitors",
    });
    expect(identity.displayTitle).toBe("Amzfast AMZG34C5Q");
  });
  it("should recover MPN from passed data if title is only noise and strip regional suffixes", () => {
    const identity = getProductIdentity({
      brand: "Amzfast",
      title: "Amzfast UltraWide",
      mpn: "AMZG34C5Q-EU",
      category: "monitors",
    });
    expect(identity.displayTitle).toBe("Amzfast AMZG34C5Q");
  });
});
