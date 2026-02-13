import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";

async function simulatePEF() {
  console.log("🚀 --- PEF IMPACT SIMULATION ---");

  // 1. Established Identity (Marketplace Information)
  const identityContext = {
    title: "Nothing Phone (2a) 12+256GB - Schwarz",
    brand: "Nothing",
    model: "Phone (2a)",
  };

  // 2. Polluted Enrichment Data (Mocked Icecat Response with Leakage)
  const pollutedIcecatSpecs = {
    Brand: "Nichts", // Needs Stage 3 Normalization
    Modell: "Nothing Phone (2a) Plus", // Stage 1 Leakage (Plus)
    Prozessorfamilie: "MediaTek Dimensity 7350 Pro", // Stage 1 Leakage (Pro)
    Bildschirmdiagonale: '17 cm (6.7")', // Authentic
    "Arbeitsspeicher-Kapazität": "12 GB", // Authentic
  };

  // 3. Mock Sibling Consensus (Stage 2)
  // authentic tokens are common across the family
  const consensus = {
    total: 20,
    tokenCounts: {
      nothing: 20,
      phone: 20,
      "2a": 20,
      dimensity: 20,
      "7200": 18,
      "17": 19, // 6.7" screen is common
      cm: 19,
      "7350": 1,
      plus: 1,
    },
    specCounts: {},
  };

  console.log("\n--- INPUT DATA (Polluted) ---");
  console.log(JSON.stringify(pollutedIcecatSpecs, null, 2));

  console.log("\n🛡️ PROCESSING WITH PEF...");
  const cleaned = sanitizeSpecs(
    pollutedIcecatSpecs,
    identityContext,
    consensus as any,
  );

  console.log("\n--- OUTPUT DATA (Cleaned) ---");
  console.log(JSON.stringify(cleaned, null, 2));

  console.log("\n📊 COMPARISON SUMMARY:");
  Object.keys(pollutedIcecatSpecs).forEach((k) => {
    const original = (pollutedIcecatSpecs as any)[k];
    const result = cleaned[k];
    if (!result) {
      console.log(
        `❌ [BLOCKED] ${k}: "${original}" (Variant Leakage Detected)`,
      );
    } else if (original !== result) {
      console.log(`✅ [FIXED] ${k}: "${original}" -> "${result}" (Normalized)`);
    } else {
      console.log(`✅ [RETAINED] ${k}: "${result}"`);
    }
  });
}

simulatePEF().catch(console.error);
