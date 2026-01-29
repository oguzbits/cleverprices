// tests/unit/logic/test-cpu-extraction.ts
import { guardIntegrity } from "../../../scripts/import/data-validator";

const testSamples = [
  {
    title:
      "AMD Ryzen 7 5800X Processor (8 Cores/16 threads, 105W DTP, AM4 socket, 36 MB Cache, up to 4,7Ghz max boost frequency, no cooler)",
    category: "cpu",
  },
  {
    title:
      "Intel® Core™ Ultra 7 Desktop-Prozessor 265K 20 Kerne (8 P-cores +12 E-cores) bis zu 5,5 GHz",
    category: "cpu",
  },
  {
    title:
      "Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz C16 Desktop Memory - Black",
    category: "ram",
  },
];

// Mock extraction logic similar to import-from-csv.ts
function extractSpecs(title: string, category: string) {
  const specs: Record<string, any> = {};

  // CPU Regexes (Simplified for test)
  const coreMatch = title.match(/(\d+)\s*(Cores|Kerne|cores)/i);
  if (coreMatch) specs.Cores = coreMatch[1];

  const socketMatch = title.match(/(\w+?\d*)\s*(socket|Sockel|LGA\d+|AM\d+)/i);
  if (socketMatch) specs.Socket = socketMatch[1];

  const tdpMatch = title.match(/(\d+)\s*W\s*(DTP|TDP)/i);
  if (tdpMatch) specs.TDP = tdpMatch[1] + "W";

  // RAM Regexes
  const ddrMatch = title.match(/(DDR\d+)/i);
  if (ddrMatch) specs.DDR_Version = ddrMatch[1];

  const clockMatch = title.match(/(\d+)\s*MHz/i);
  if (clockMatch) specs.Clock_Speed = clockMatch[1] + "MHz";

  return guardIntegrity(specs, category);
}

console.log("🧪 Testing Extraction Logic...");
for (const sample of testSamples) {
  const clean = extractSpecs(sample.title, sample.category);
  console.log(`\nTitle: ${sample.title}`);
  console.log(`Clean Specs: ${JSON.stringify(clean, null, 2)}`);
}
