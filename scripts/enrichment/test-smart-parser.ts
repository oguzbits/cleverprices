import { SmartParser } from "./smart-parser";

async function testSmartParser() {
  const parser = new SmartParser();

  console.log("🧪 Testing SmartParser regex enhancements...\n");

  const testCases = [
    {
      category: "GPU",
      title: "ASUS TUF Gaming GeForce RTX 5070 Ti 16GB GDDR7",
      text: "3,125 Slots Design, TDP 250W, PCIe 5.0",
      schema: [
        "Anzahl Slots",
        "Thermal Design Power (TDP)",
        "Schnittstelle",
        "Grafikkartenspeichertyp",
      ],
      expected: {
        "Anzahl Slots": "3,125 slots",
        "Thermal Design Power (TDP)": "250 w",
        // "Schnittstelle": "pcie 5.0" // Pass 2 might handle this, or regex if added
        Grafikkartenspeichertyp: "gddr7", // Should be captured if gb rule not greedy
      },
    },
    {
      category: "Smartphone",
      title: "Samsung Galaxy A55 5G",
      text: "Display 6,6 Zoll, Auflösung 2.340 x 1.080 Pixel, Akku 5.000 mAh, 25W Laden",
      schema: ["Display-Auflösung", "Batteriekapazität", "Ladegeschwindigkeit"],
      expected: {
        "Display-Auflösung": "2340 x 1080 pixel",
        Batteriekapazität: "5000 mah",
        Ladegeschwindigkeit: "25 w",
      },
    },
    {
      category: "3D-Drucker",
      title: "Anycubic Kobra 3 V2 Combo",
      text: "Druckgeschwindigkeit 600 mm/s, Bauvolumen 255 x 255 x 260 mm, Düse 300 °C",
      schema: ["Druckgeschwindigkeit", "Bauvolumen", "Düsentemperatur"],
      expected: {
        Druckgeschwindigkeit: "600 mm/s",
        Bauvolumen: "255 x 255 x 260 mm",
        Düsentemperatur: "300 °c",
      },
    },
    {
      category: "Monitor",
      title: "Minifire 34 Zoll Gaming Monitor",
      text: "Auflösung 3440 x 1440 Pixel, 165 Hz Bildwiederholfrequenz, 300 cd/m² Helligkeit",
      schema: ["Auflösung", "Maximale Bildwiederholrate", "Helligkeit"],
      expected: {
        Auflösung: "3440 x 1440 pixel",
        "Maximale Bildwiederholrate": "165 hz",
        Helligkeit: "300 cd/m²",
      },
    },
    {
      category: "Soundbar",
      title: "Test Soundbar Strict Mode",
      text: "Das Gerät verfügt über integriertes BT 5.3 für drahtloses Streaming.",
      schema: ["Bluetooth-Version"],
      expected: {
        "Bluetooth-Version": "5.3", // Should be strictly validated to "5.3"
      },
    },
    {
      category: "3D-Drucker (Unit Recovery)",
      title: "Creality K1 Max",
      text: "Druckgeschwindigkeit: 600, Düse: 350, Heizbett: 100, Filament: 1.75, NVMe: True",
      schema: [
        "Druckgeschwindigkeit",
        "Düsentemperatur",
        "Heizbett-Temperatur",
        "Filamentdurchmesser",
        "NVMe",
      ],
      expected: {
        Druckgeschwindigkeit: "600 mm/s",
        Düsentemperatur: "350 °C",
        "Heizbett-Temperatur": "100 °C",
        Filamentdurchmesser: "1.75 mm",
        NVMe: "Ja",
      },
    },
    {
      category: "Kamera (Pass 1 Aggressive)",
      title: "Nikon Z fc Systemkamera",
      text: "ISO 100-51200, 20.9 MP CMOS Sensor, 445g Gewicht",
      schema: ["ISO-Empfindlichkeit", "Megapixel insgesamt", "Gewicht"],
      expected: {
        "ISO-Empfindlichkeit": "ISO 100-51200",
        "Megapixel insgesamt": "20.9 MP",
        Gewicht: "445 g",
      },
    },
  ];

  for (const test of testCases) {
    console.log(`\n📋 Testing Category: ${test.category}`);
    // Mock the parseProductPage internal flow or just use it with empty example
    // We can't access private method deterministicExtract directly,
    // so we rely on the log output or the returned object from parseProductPage (Pass 1 part)
    // We'll trust parseProductPage returns the deterministic part mixed in.

    // We force a quick return or just inspect the result
    // To ensure we see deterministic results, we can mock the process.env.STRICT_MODE to avoid Pass 2?
    // Actually parseProductPage returns everything.

    const result = await parser.parseProductPage(
      test.text,
      test.title,
      test.schema,
      undefined,
    );

    console.log("   Result:", JSON.stringify(result, null, 2));

    // Validation
    let allPassed = true;
    for (const [key, expectedVal] of Object.entries(test.expected)) {
      if (result[key] === expectedVal) {
        // ok
      } else if (JSON.stringify(result[key]) === JSON.stringify(expectedVal)) {
        // ok
      } else {
        console.error(
          `   ❌ Mismatch for ${key}: Expected '${expectedVal}' (${typeof expectedVal}), got '${result[key]}' (${typeof result[key]})`,
        );
        if (
          typeof expectedVal === "string" &&
          typeof result[key] === "string"
        ) {
          console.error(
            `   Chars:`,
            Array.from(expectedVal).map((c) => c.charCodeAt(0)),
            " vs ",
            Array.from(result[key]).map((c) => c.charCodeAt(0)),
          );
        }
        allPassed = false;
      }
    }

    if (allPassed) console.log("   ✅ All checks passed.");
  }
}

testSmartParser().catch(console.error);
