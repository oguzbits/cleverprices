import * as fs from "fs";
import * as path from "path";

import {
  EXTRACTION_TEST_CASES,
  ExtractionTestCase,
} from "../../tests/unit/logic/test-data";

/**
 * Massive Test Generator for SmartParser v3
 */

function generateMassiveTests() {
  const massive: ExtractionTestCase[] = [];

  // 1. Manually curated base cases
  massive.push(...EXTRACTION_TEST_CASES);

  // 2. SSD Performance Matrix (100 variations)
  for (let i = 0; i < 100; i++) {
    const read = 1000 + i * 50;
    const write = 800 + i * 50;
    massive.push({
      title: `SuperFast SSD X${i} (${read}/${write} MB/s) NVMe Gen4`,
      category: "ssds",
      fields: ["Lesegeschwindigkeit", "Schreibgeschwindigkeit"],
      expected: {
        Lesegeschwindigkeit: `${read} MB/s`,
        Schreibgeschwindigkeit: `${write} MB/s`,
      },
      description: `SSD slash extraction #${i}`,
    });
  }

  // 3. Camera Megapixel Variations (50 variations)
  for (let i = 0; i < 50; i++) {
    const val = 10 + i * 0.51;
    // Mirror parser: strip .0 by rounding or regex
    const valFixed = val
      .toFixed(2)
      .replace(/\.00$/, "")
      .replace(/(\.\d)0$/, "$1");
    const valStr = valFixed.replace(".", ",");
    massive.push({
      title: `Camera ${i} with ${valStr} MP Resolution`,
      category: "cameras",
      fields: ["Megapixel insgesamt"],
      expected: {
        "Megapixel insgesamt": `${valStr} MP`,
      },
      description: `Camera MP decimal extraction #${i}`,
    });
  }

  // 4. RAM / Speed Matrix (50 variations)
  for (let i = 0; i < 50; i++) {
    const mt = 3200 + i * 133;
    massive.push({
      title: `RAM Stick ${i} DDR5 ${mt}MT/s CL${36 + (i % 4)}`,
      category: "ram",
      fields: ["Interner Speichertyp", "Speicherdatenübertragungsrate"],
      expected: {
        "Interner Speichertyp": "DDR5",
        Speicherdatenübertragungsrate: `${mt} MT/s`,
      },
      description: `RAM MT/s extraction #${i}`,
    });
  }

  // 5. Physical Dimensions (100 variations)
  const dims = ["Breite", "Höhe", "Tiefe"];
  for (let i = 0; i < 100; i++) {
    const field = dims[i % 3];
    const val = 20.5 + i * 1.5;
    // Mirror the parser's behavior: strip .0 by using toString() replacement
    const valStr = val.toString().replace(".", ",");
    massive.push({
      title: `Box ${i} Dimensions: ${field}: ${valStr} mm`,
      category: "dimensions",
      fields: [field],
      expected: {
        [field]: `${valStr} mm`,
      },
      description: `Dimension ${field} extraction #${i}`,
    });
  }

  // 6. Boolean Presence Logic (50 variations)
  const bools = [
    {
      name: "Bluetooth",
      keywords: ["Bluetooth 5.3", "BT 5.3", "Bluetooth", "mit Bluetooth"],
    },
    { name: "WLAN", keywords: ["WLAN ax", "Wi-Fi 6", "WiFi", "mit WLAN"] },
    {
      name: "GPS",
      keywords: ["GPS integriert", "mit GPS", "Ortung", "GLONASS"],
    },
  ];
  for (let i = 0; i < 50; i++) {
    const cfg = bools[i % 3];
    const kw = cfg.keywords[i % cfg.keywords.length];
    massive.push({
      title: `Device ${i} (${kw})`,
      category: "booleans",
      fields: [cfg.name],
      expected: {
        [cfg.name]: "Ja",
      },
      description: `Boolean presence #${i} for ${cfg.name}`,
    });
  }

  const outputPath = path.join(
    process.cwd(),
    "tests/unit/logic/massive-test-data.json",
  );
  fs.writeFileSync(outputPath, JSON.stringify(massive, null, 2));
  console.log(`Successfully generated ${massive.length} unit test cases.`);
}

generateMassiveTests();
