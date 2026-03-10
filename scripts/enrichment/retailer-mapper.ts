/**
 * Maps retailer-specific attribute names (Cyberport, Alternate, NBB, etc.)
 * to CleverPrices technical field names.
 */
export const RETAILER_FIELD_MAP: Record<string, string> = {
  // Common / Smartphone / Electronics
  Display: "Bildschirmdiagonale",
  "Display-Größe": "Bildschirmdiagonale",
  Bildschirmgröße: "Bildschirmdiagonale",
  "Display - Bild": "Bildschirmdiagonale",
  "Display - Bildschirmdiagonale": "Bildschirmdiagonale",
  "Display - Auflösung": "Display-Auflösung",
  "Display-Auflösung": "Display-Auflösung",
  Auflösung: "Display-Auflösung",
  "Display - Typ": "Bildschirmtechnologie",
  "Panel-Typ": "Bildschirmtechnologie",
  Prozessor: "Prozessor",
  "Prozessor-Modell": "Prozessor",
  Bezeichnung: "Prozessor",
  "Prozessor - Bezeichnung": "Prozessor",
  "Arbeitsspeicher-Größe": "RAM-Kapazität",
  Arbeitsspeicher: "RAM-Kapazität",
  Speicher: "Interne Speicherkapazität",
  "Speicher - Gesamtkapazität": "Interne Speicherkapazität",
  Festplatte: "Interne Speicherkapazität",
  "SSD-Kapazität": "Interne Speicherkapazität",
  "Festspeicher - Gesamtkapazität": "Interne Speicherkapazität",
  Gesamtkapazität: "Interne Speicherkapazität",
  Kapazität: "Interne Speicherkapazität",
  "Kapazität - Gesamt": "Interne Speicherkapazität",
  Serie: "Produktfamilie",
  "Produkt - Serie": "Produktfamilie",
  "Prozessor - Serie": "Produktfamilie",
  Mobilfunk: "Mobilfunknetzgenerierung",
  "Bluetooth-Version": "Bluetooth",
  "WLAN-Standards": "WLAN",
  "Schnittstelle - Intern": "Schnittstelle",
  Grafik: "GPU",
  Grafikkarte: "GPU",
  Betriebssystem: "Betriebssystem",
  "Betriebssystem - Version": "Betriebssystem-Version",
  Gewicht: "Gewicht",
  Maße: "Tiefe",
  Breite: "Breite",
  Höhe: "Höhe",
  Tiefe: "Tiefe",
  Farbe: "Produktfarbe",
  "Eigenschaften - Farbe": "Produktfarbe",
  "Identifier - EAN": "gtin",
  EAN: "gtin",

  // Camera (Smartphones)
  "Kamera - Rückseite": "Hauptkamera-Typ",
  "Kamera - Video": "Video-Aufzeichnungsmodi",
  "Kamera - Frontseite": "Frontkamera-Typ",

  // Sensors
  "Sensoren - Beschleunigungssensor": "Beschleunigungsmesser",
  "Sensoren - Gyroskop": "Gyroskop",
  "Sensoren - Annäherungssensor": "Annäherungssensor",
  "Sensoren - Helligkeitssensor": "Umgebungslichtsensor",
  "Sensoren - Kompass (Magnetometer)": "Magnetometer",
  "Sensoren - Fingerabdrucksensor": "Fingerabdruckscanner",

  // Components / Hardware
  Speichertyp: "Arbeitsspeicher Typ",
  Taktfrequenz: "Prozessor-Taktfrequenz",
  Anschlüsse: "Schnittstelle",
  Schnittstelle: "Schnittstelle",
  Garantie: "Besonderheiten",
  Kerne: "Anzahl Prozessorkerne",
  Threads: "Anzahl Threads",
  Sockel: "Prozessorsockel",
  "L3-Cache": "Prozessor-Cache",
  Speichergröße: "Interne Speicherkapazität",
  Speichertakt: "Speichertaktfrequenz",
  Bus: "Schnittstelle",
  Gehäusefarbe: "Produktfarbe",
  Pixelauflösung: "Display-Auflösung",
  Länge: "Tiefe",
  "RAM-Kapazität": "Arbeitsspeicher",
  Speicherkapazität: "Interner Speicher",
  "Bildschirmdiagonale (Zoll)": "Display-Größe",
};

export const RETAILER_VALUE_TRANSLATIONS: Record<string, string> = {
  schwarz: "Schwarz",
  weiß: "Weiß",
  silber: "Silber",
  blau: "Blau",
  grau: "Grau",
  ja: "Ja",
  nein: "Nein",
  schiefergrau: "Grau",
  anthrazit: "Schwarz",
  midnight: "Mitternacht",
  spacegrey: "Space Grau",
};

/**
 * Normalizes values from various retailers.
 */
export function normalizeRetailerValue(name: string, value: string): string {
  if (!value) return value;

  const lowerVal = value.toLowerCase().trim();
  const lowerName = name.toLowerCase().trim();

  // 1. Translations
  if (RETAILER_VALUE_TRANSLATIONS[lowerVal]) {
    return RETAILER_VALUE_TRANSLATIONS[lowerVal];
  }

  // 2. Unit Fixing (Spacing)
  if (/^\d+(GB|TB|MB|MHz|GHz|Hz|W|Wh|mAh|mm|cm|g|kg|Zoll|\")$/i.test(value)) {
    // Standardize Inch
    if (value.includes('"') || lowerVal.includes("zoll")) {
      return value.replace(/\s*(zoll|\")$/i, "").trim() + '"';
    }
    return value.replace(/(\d+)([a-zA-Z%°/]+)/i, "$1 $2").trim();
  }

  // 3. Weight cleanup (e.g. "ca. 1.2kg" -> "1.2 kg")
  if (lowerName === "gewicht" && value.includes("kg")) {
    return value
      .replace(/ca\.\s*/i, "")
      .replace(/(\d+)([a-z]+)/i, "$1 $2")
      .trim();
  }

  return value;
}
