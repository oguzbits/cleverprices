/**
 * Maps eBay aspect names (from Browse API) to CleverPrices technical field names.
 */
export const EBAY_FIELD_MAP: Record<string, string> = {
  // Common / Smartphone
  Speicherkapazität: "Interne Speicherkapazität",
  "Arbeitsspeicher-Größe": "RAM-Kapazität",
  Prozessor: "Prozessor",
  Bildschirmgröße: "Bildschirmdiagonale",
  "Kamera-Auflösung": "Auflösung Rückkamera (numerisch)",
  "SIM-Karten-Steckplatz": "SIM-Kartensteckplätze",
  Konnektivität: "Mobilfunknetzgenerierung",
  Modellnummer: "Modell",
  Marke: "Marke",
  Farbe: "Produktfarbe",
  Herstellerfarbe: "Produktfarbe",
  Speichergröße: "Interne Speicherkapazität",
  "Chipsatz/GPU-Modell": "GPU",
  "Chipsatz/GPU-Hersteller": "Grafikprozessorenfamilie",
  "Kompatibler Anschluss/Steckplatz": "Schnittstelle",
  Anschlüsse: "Schnittstelle",
  "Video-Anschlüsse": "Schnittstelle",
  Speichertyp: "Arbeitsspeicher Typ",
  "Netzteil-Formfaktor": "Formfaktor Netzteil",
  Modell: "Modell",
  Kameraauflösung: "Auflösung Rückkamera (numerisch)",
  "Chipsatz Modell": "GPU", // Maps better to GPU chip for graphics cards
  "Chipsatz-Modell": "GPU",
  RAM: "RAM-Kapazität",
  "RAM-Größe": "RAM-Kapazität",
  Arbeitsspeicher: "RAM-Kapazität",
  "Arbeitsspeicher-Kapazität": "RAM-Kapazität",
  "VRAM-Kapazität": "Interne Speicherkapazität",
  "VRAM-Größe": "Interne Speicherkapazität",
  Herstellernummer: "Hersteller-Teilenummer",
  MPN: "Hersteller-Teilenummer",
  // Produktart removed to prevent "Modell: Handy"
  Betriebssystem: "Betriebssystem",
  "Display-Technologie": "Bildschirmtechnologie",
  Bildschirmtechnologie: "Bildschirmtechnologie",
  Auflösung: "Display-Auflösung",
  "Maximale Auflösung": "Display-Auflösung",
  Erscheinungsjahr: "Produktvorstellungsdatum",
  "Release Year": "Produktvorstellungsdatum",

  // English Synonyms (for EBAY_GB/EBAY_US results)
  Brand: "Marke",
  Color: "Produktfarbe",
  Model: "Modell",
  "Screen Size": "Bildschirmdiagonale",
  "Storage Capacity": "Interne Speicherkapazität",
  "Memory Size": "Interne Speicherkapazität",
  "Internal Memory": "Interne Speicherkapazität",
  "RAM Size": "RAM-Kapazität",
  "Operating System": "Betriebssystem",
  "Chipset Manufacturer": "Grafikprozessorenfamilie",
  "Chipset/GPU Model": "GPU",
  "Compatible Slot": "Schnittstelle",
  Connectors: "Schnittstelle",
  Features: "Besonderheiten",
  Connectivity: "Mobilfunknetzgenerierung",
  Network: "Mobilfunknetzgenerierung",
  "Lock Status": "Besonderheiten",
  Sperrstatus: "Besonderheiten",
  Mobilfunkbetreiber: "Mobilfunknetzgenerierung",
  "Unit Weight": "Gewicht",
  "Item Height": "Höhe",
  "Item Width": "Breite",
  "Item Length": "Tiefe",
  "Cooling Component Included": "Anzahl Lüfter",
  "Connectivity Technology": "Schnittstelle",
  "Data Transfer Rate": "Datenübertragungsrate",
  "Wireless Standard": "WLAN-Standards",
  "Number of Antennas": "Anzahl Antennen",
  "Frequency Band": "Frequenzbereich",
  "Maximum LAN Data Rate": "Max. Transferrate",
  "Maximum Wireless Data Rate": "Max. Transferrate",
  "Maximum Data Transfer Rate": "Datenübertragungsrate",
  Type: "Produktart",
  "Product Type": "Produktart",
  "Number of Ports": "Anzahl Ethernet-LAN-Anschlüsse (RJ-45)",
  "Maximum Resolution": "Display-Auflösung",
  "Display Technology": "Bildschirmtechnologie",
  "Processor Model": "Prozessor",
  "Processor Speed": "Prozessor-Taktfrequenz",
  "Video Card": "GPU",
  "Graphic Card": "GPU",
  "Video Memory": "Interne Speicherkapazität",
  "Interface Card Slot": "Schnittstelle",
  "Wireless Communication Technology": "WLAN-Standards",
  "Security Protocol": "Besonderheiten",
  "Connector Type": "Schnittstelle",
  "Input Voltage": "Eingangsspannung",
  "Supported Standards": "WLAN-Standards",
  "Port Type": "Schnittstelle",
  Interface: "Schnittstelle",
  Ports: "Schnittstelle",
  "Number of LAN Ports": "Anzahl Ethernet-LAN-Anschlüsse (RJ-45)",
  "Network Connectivity": "Mobilfunknetzgenerierung",
  "Connectivity Type": "Schnittstelle",
  "Cable Length": "Tiefe",

  // Components
  Länge: "Tiefe",
  Formfaktor: "Formfaktor",
  "Anzahl der Lüfter": "Anzahl Lüfter",
  "Kühlkomponente inklusive": "Anzahl Lüfter", // Often "Lüfter" or "Heatsink"

  // Photography
  "Optischer Zoom": "Optischer Zoom",
  "Digitaler Zoom": "Digitaler Zoom",
  Brennweite: "Brennweitenbereich",
  "Sensor-Typ": "Sensortyp",
  "Maximale Blende": "Maximale Blendenöffnung",

  // Storage / SD Cards
  Format: "Flash Card Typ",
  "Flash-Speichertyp": "Flash Card Typ",
  Geschwindigkeitsklasse: "UHS Speed Klasse",
  "UHS-Geschwindigkeitsklasse": "UHS Speed Klasse",
  "Video-Geschwindigkeitsklasse": "Video-Geschwindigkeitsklasse",
  "Lese-Geschwindigkeit": "Lesegeschwindigkeit",
  "Schreib-Geschwindigkeit": "Schreibgeschwindigkeit",
  Geschwindigkeit: "Lesegeschwindigkeit", // Generic fallback

  Abmessungen: "Tiefe", // Fallback
  Artikelgewicht: "Gewicht",
  Produktgewicht: "Gewicht",
};

const EBAY_VALUE_TRANSLATIONS: Record<string, string> = {
  // Colors
  black: "Schwarz",
  white: "Weiß",
  silver: "Silber",
  blue: "Blau",
  red: "Rot",
  green: "Grün",
  yellow: "Gelb",
  gold: "Gold",
  grey: "Grau",
  gray: "Grau",
  midnight: "Mitternacht",
  starlight: "Polarstern",
  purple: "Violett",
  orange: "Orange",
  pink: "Rosa",
  brown: "Braun",
  // Booleans / States
  yes: "Ja",
  no: "Nein",
  enabled: "Aktiviert",
  disabled: "Deaktiviert",
  none: "Keine",
  "built-in": "Eingebaut",
  internal: "Intern",
  external: "Extern",
  // Display
  widescreen: "Breitbild",
  glossy: "Glänzend",
  // Laptop / MacBook Specific
  "SSD-Festplattenkapazität": "Interne Speicherkapazität",
  Festplattentyp: "Speichermeidien", // e.g. SSD/HDD
  Grafikprozessor: "GPU", // Apple usually labels M3/M4 GPU here
  "Anzahl der Kerne": "Anzahl Prozessorkerne",
  "Anzahl der Prozessorkerne": "Anzahl Prozessorkerne",
  Festplattenkapazität: "Interne Speicherkapazität",

  // English Synonyms for new fields
  "Number of Cores": "Anzahl Prozessorkerne",
  "Processor Speed": "Prozessor-Taktfrequenz",
  "Item Weight": "Gewicht",
  "Item Width": "Breite",
  "Item Height": "Höhe",
  "Item Depth": "Tiefe",
  "Graphics Processing Type": "Grafikkarte-Typ", // e.g. Integrated/Dedicated
  "Hard Drive Capacity": "Interne Speicherkapazität",
  "SSD Capacity": "Interne Speicherkapazität",

  matte: "Matt",
  "not applicable": "Keine",
  "dual band": "Dual-Band",
  "tri band": "Tri-Band",
  "quad band": "Quad-Band",
  integrated: "Integriert",
  dedicated: "Dediziert",
  wired: "Kabelgebunden",
  wireless: "Kabellos",
  unlocked: "Ohne Simlock",
  "factory unlocked": "Ohne Simlock",
  excellent: "Sehr gut",
  "very good": "Gut",
  good: "Befriedigend",
};

/**
 * Normalizes eBay values to match our project conventions.
 */
export function normalizeEbayValue(ebayName: string, value: string): string {
  if (!value) return value;

  // 1. Normalize Inch units (Standard for Screens/Form Factors)
  const isInchValue =
    value.toLowerCase().endsWith(" in") ||
    value.endsWith('"') ||
    value.toLowerCase().endsWith("inch");
  const isSizeField =
    ebayName.toLowerCase().includes("size") ||
    ebayName.toLowerCase().includes("diagonal");

  if (isInchValue || (isSizeField && /^\d+(\.\d+)?$/.test(value))) {
    return value.replace(/\s*(in|inch)$|"/i, "").trim() + '"';
  }

  // 2. Unit Fixing (Spacing)
  if (/^\d+(GB|TB|MB|KB|MHz|GHz|Hz|W|V|A|mAh|Wh|mm|cm|m|g|kg)$/i.test(value)) {
    value = value.replace(/(\d+)([a-zA-Z%°/]+)/i, "$1 $2").trim();
  }

  // 3. Translations
  const lowerVal = value.toLowerCase().trim();
  if (EBAY_VALUE_TRANSLATIONS[lowerVal]) {
    return EBAY_VALUE_TRANSLATIONS[lowerVal];
  }

  // 4. Handle specific fields (Storage/RAM capitalization)
  if (
    ebayName.includes("Speicher") ||
    ebayName.includes("RAM") ||
    ebayName.includes("Kapazität") ||
    ebayName.includes("Memory")
  ) {
    return value.replace(/(\d+)(GB|TB|MB)/i, "$1 $2").toUpperCase();
  }

  // Boolean-like values for German
  if (lowerVal === "ja") return "Ja";
  if (lowerVal === "nein") return "Nein";

  return value;
}
