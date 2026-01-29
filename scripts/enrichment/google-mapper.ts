/**
 * Maps Google Shopping aspect names to CleverPrices technical field names.
 */
export const GOOGLE_FIELD_MAP: Record<string, string> = {
  // Common
  Marke: "Marke",
  Farbe: "Produktfarbe",
  Produkttyp: "Modell",
  Modell: "Modell",
  Hersteller: "Marke",

  // Storage / SD Cards / RAM
  Speicherkapazität: "Interne Speicherkapazität",
  Speicher: "Interne Speicherkapazität",
  Arbeitsspeicher: "RAM-Kapazität",
  "Arbeitsspeicher-Typ": "Arbeitsspeicher Typ",
  "Interner Speicher": "Interne Speicherkapazität",
  "Flash Card Typ": "Flash Card Typ",
  "UHS Speed Klasse": "UHS Speed Klasse",
  "Video-Geschwindigkeitsklasse": "Video-Geschwindigkeitsklasse",
  Lesegeschwindigkeit: "Lesegeschwindigkeit",
  Schreibgeschwindigkeit: "Schreibgeschwindigkeit",

  // Display
  Bildschirmgröße: "Bildschirmdiagonale",
  Displaygröße: "Bildschirmdiagonale",
  Auflösung: "Display-Auflösung",
  "Maximale Auflösung": "Display-Auflösung",
  Displaytechnologie: "Bildschirmtechnologie",
  Bildwiederholrate: "Maximale Bildwiederholrate",

  // CPU / Performance
  Prozessor: "Prozessor",
  Prozessortyp: "Prozessor",
  Prozessorgeschwindigkeit: "Prozessortaktung",
  "Anzahl der Kerne": "Anzahl Prozessorkerne",
  Kernanzahl: "Anzahl Prozessorkerne",
  Grafik: "GPU",
  Grafikkarte: "GPU",
  Grafikprozessor: "GPU",

  // Battery / Power
  Akkukapazität: "Akku-/Batteriekapazität",
  Batteriekapazität: "Akku-/Batteriekapazität",
  "Akku-Laufzeit": "Akku-/Batteriebetriebsdauer",
  Akkulaufzeit: "Akku-/Batteriebetriebsdauer",

  // Connectivity
  Konnektivität: "Mobilfunknetzgenerierung",
  "Mobilfunk-Generation": "Mobilfunknetzgenerierung",
  Bluetooth: "Bluetooth",
  "NFC-fähig": "NFC",
  WLAN: "WLAN",

  // Camera
  Kamera: "Auflösung Rückkamera (numerisch)",
  "Kamera-Auflösung": "Auflösung Rückkamera (numerisch)",
  "Megapixel-Anzahl": "Megapixel insgesamt",
  "Optischer Zoom": "Optischer Zoom",

  // Consoles
  Plattform: "Plattform",
  "Blu-ray Player": "Integrierter Kartenleser", // Sometimes used for media slots
  "Unterstützte Medien": "Integrierter Kartenleser",

  // Physical
  Gewicht: "Gewicht",
  Breite: "Breite",
  Höhe: "Höhe",
  Tiefe: "Tiefe",
};

/**
 * Normalizes Google value strings.
 */
export function normalizeGoogleValue(
  googleName: string,
  value: string,
): string {
  // Fix spacing: "128GB" -> "128 GB"
  if (/^\d+(GB|TB|MB|KB|MHz|GHz|Hz|W|V|A|mAh|Wh|mm|cm|m|g|kg)$/i.test(value)) {
    return value.replace(/(\d+)([a-zA-Z%°/]+)/i, "$1 $2").trim();
  }

  // Multi-value cleanup
  if (value.includes(",")) {
    // Keep as is or take first? Usually for colors it's better to keep all.
  }

  // Boolean-like
  if (value.toLowerCase() === "ja") return "Ja";
  if (value.toLowerCase() === "nein") return "Nein";

  return value;
}
