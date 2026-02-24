/**
 * High-value overrides where a simple heuristic isn't enough.
 * These take priority over the heuristic logic.
 */
const OVERRIDES: Record<string, string> = {
  "release date": "Gelistet seit",
  manufacturer: "Hersteller",
  "form factor": "Bauform",
  dimensions: "Abmessungen",
  warranty: "Garantie",
  capacity: "Kapazität",
  "read speed": "Lesegeschwindigkeit",
  "write speed": "Schreibgeschwindigkeit",
  technology: "Technik",
  socket: "Sockel",
  cores: "Kerne",
  "base clock": "Basistakt",
  "boost clock": "Boost-Takt",
  "contrast ratio": "Kontrastverhältnis",
  "response time": "Reaktionszeit",
  "refresh rate": "Bildwiederholfrequenz",
  "screen size": "Bildschirmdiagonale",
  "aspect ratio": "Seitenverhältnis",
  "display type": "Display-Typ",
  connections: "Anschlüsse",
  "video memory": "Grafikspeicher",
  "memory type": "Speichertyp",
  "memory clock": "Speichertakt",
  "power consumption": "Stromverbrauch",
  cooling: "Kühlung",
  "memory speed": "Speichertakt",
  "cas latency": "CAS Latenz",
  efficiency: "Effizienz",
  "rotational speed": "Umdrehungsgeschwindigkeit",
  "buffer size": "Cache-Größe",
  "pixel density": "Pixeldichte",
  "display resolution": "Auflösung",
  processor: "Prozessor",
  "chip name": "Chip",
  description: "Beschreibung",
  color: "Farbe",
  interface: "Schnittstelle",
  type: "Typ",
  voltage: "Spannung",
  wattage: "Leistung",
  modular: "Modular",
  certification: "Zertifizierung",
  series: "Serie",
  model: "Modell",
  chipset: "Grafikchipsatz",
};

/**
 * Common technical terms and their German equivalents for heuristics.
 */
const TECHNICAL_MAP: Record<string, string> = {
  clock: "Takt",
  speed: "Geschwindigkeit",
  resolution: "Auflösung",
  power: "Leistung",
  supply: "Versorgung",
  memory: "Speicher",
  graphics: "Grafik",
  display: "Display",
  screen: "Bildschirm",
  storage: "Speicher",
  battery: "Akku",
  camera: "Kamera",
  sensor: "Sensor",
  weight: "Gewicht",
  height: "Höhe",
  width: "Breite",
  depth: "Tiefe",
  length: "Länge",
  connection: "Anschluss",
};

/**
 * Acronyms that should always be uppercased.
 */
const ACRONYMS = new Set([
  "gpu",
  "cpu",
  "tdp",
  "ram",
  "rom",
  "ssd",
  "hdd",
  "hdmi",
  "usb",
  "wlan",
  "wi-fi",
  "fhd",
  "qhd",
  "uhd",
  "os",
  "mp",
  "gps",
  "nfc",
]);

/**
 * Logic-driven translation for specification keys.
 * Reduces the need for massive hard-coded lists by using heuristics
 * for technical terms, casing, and common phrasing patterns.
 */
export function translateSpecKey(key: string): string {
  if (!key) return "";

  // 1. Basic Cleanup
  const cleanKey = key.replace(/[‡*]/g, "").trim();
  const lowerKey = cleanKey.toLowerCase();

  // 2. Direct Override Check (Strongest match)
  if (OVERRIDES[lowerKey]) return OVERRIDES[lowerKey];

  // 3. Heuristic Transformation
  // Split by common separators (space, underscore, hyphen) or camelCase
  const words = cleanKey
    .replace(/([a-z])([A-Z])/g, "$1 $2") // CamelCase to space
    .replace(/[_-]/g, " ") // Symbols to space
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return cleanKey;

  const translatedWords = words.map((word) => {
    const wordLower = word.toLowerCase();

    // Preserve Acronyms
    if (ACRONYMS.has(wordLower)) return wordLower.toUpperCase();

    // Map Technical Suffixes/Terms
    if (TECHNICAL_MAP[wordLower]) return TECHNICAL_MAP[wordLower];

    // Default: Just capitalize
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  // Join back together
  // Special rule: if it starts with an acronym like "GPU Clock", use a space or hyphen
  const firstWordLower = words[0].toLowerCase();
  if (ACRONYMS.has(firstWordLower) && translatedWords.length > 1) {
    return translatedWords.join("-");
  }

  return translatedWords.join(" ");
}

/**
 * Legacy support for the object lookup (Optional, but helps minimize changes if needed)
 */
export const SPEC_KEY_TRANSLATIONS = new Proxy({} as Record<string, string>, {
  get: (_, prop: string) => translateSpecKey(prop),
});
