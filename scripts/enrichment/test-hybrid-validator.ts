import {
  FIELD_DEFINITIONS,
  createZodFromDefinition,
} from "./field-definitions";

async function testPatternValidators() {
  console.log("🧪 Testing Hybrid Pattern Validators...\n");

  const testCases = [
    { field: "Bluetooth-Version", val: "5.3", valid: true },
    { field: "Bluetooth-Version", val: "7.0", valid: true }, // Schema check: Future version
    { field: "Bluetooth-Version", val: "Five", valid: false },
    { field: "WLAN-Standards", val: "Wi-Fi 6 (802.11ax)", valid: true },

    // Multi-unit Dimensions
    { field: "Breite", val: "220 mm", valid: true },
    { field: "Breite", val: "22 cm", valid: true },
    { field: "Breite", val: "0.22 m", valid: true },
    { field: "Breite", val: "220", valid: false }, // Still strict about having *some* unit

    // Multi-unit Weight
    { field: "Gewicht", val: "500 g", valid: true },
    { field: "Gewicht", val: "0.5 kg", valid: true },

    // Color Flexibility (Open Enum)
    { field: "Produktfarbe", val: "Neon Pink", valid: true },
    { field: "Produktfarbe", val: "Matt Midnight Green", valid: true }, // Complex undefined color -> Should pass

    { field: "Anzahl HDMI-Anschlüsse", val: "2", valid: true },
    { field: "Anzahl HDMI-Anschlüsse", val: "10", valid: false }, // Strict Enum (0-6)

    // Validating improvements
    { field: "WLAN-Standards", val: "Wi-Fi 7 (802.11be)", valid: true },
    { field: "Bluetooth-Version", val: "Bluetooth 5.4", valid: true }, // New Regex supports "Bluetooth" prefix
    { field: "Energieeffizienzklasse", val: "A+++", valid: true },
    { field: "Energieeffizienzklasse", val: "G", valid: true },
    { field: "Energieeffizienzklasse", val: "Z", valid: true }, // Unknown allowed (warns)

    // Bounds Check (Min: 0)
    { field: "Breite", val: "-10 mm", valid: false }, // Negative width = invalid
    { field: "Breite", val: "0 mm", valid: true }, // 0 is technically allowed by >=0

    // HDMI Standard Pattern
    { field: "HDMI-Version", val: "2.1", valid: true },
    { field: "HDMI-Version", val: "1.4b", valid: true }, // 'b' suffix allowed by new pattern
  ];

  for (const test of testCases) {
    const def = FIELD_DEFINITIONS[test.field];
    if (!def) {
      console.warn(`⚠️ Definition missing for ${test.field}`);
      continue;
    }

    const schema = createZodFromDefinition(def);
    const result = await schema.safeParseAsync(test.val);

    const passed = result.success === test.valid;
    const icon = passed ? "✅" : "❌";

    console.log(
      `${icon} [${test.field}] value="${test.val}" | Expected: ${test.valid} | Got: ${result.success}`,
    );
    if (!passed && !result.success) console.log(result.error);
  }
}

testPatternValidators().catch(console.error);
