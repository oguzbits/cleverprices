/**
 * Maps eBay aspect names (from Browse API) to CleverPrices technical field names.
 */
export const EBAY_FIELD_MAP: Record<string, string> = {
  // Common / Smartphone
  Speicherkapazität: "Interne Speicherkapazität",
  "Arbeitsspeicher-Größe": "RAM-Kapazität",
  Betriebssystem: "Prozessorfamilie", // Often contains OS info or CPU
  Prozessor: "Prozessor",
  Bildschirmgröße: "Bildschirmdiagonale",
  "Kamera-Auflösung": "Auflösung Rückkamera (numerisch)",
  "SIM-Karten-Steckplatz": "SIM-Kartensteckplätze",
  Konnektivität: "Mobilfunknetzgenerierung",
  Modellnummer: "Modell",
  Marke: "Marke",
  Farbe: "Produktfarbe",
  Herstellerfarbe: "Produktfarbe",

  // Laptops / Cameras / Components
  Besonderheiten: "Besonderheiten",
  "Maximale Auflösung": "Display-Auflösung",
  Grafikprozessor: "GPU",
  "SSD-Festplattenkapazität": "Interne Speicherkapazität",
  Festplattenkapazität: "Interne Speicherkapazität",
  Speichertyp: "Arbeitsspeicher Typ",
  Prozessortyp: "Prozessor",
  Prozessorgeschwindigkeit: "Prozessortaktung",
  "Anzahl der Kerne": "Anzahl Prozessorkerne",
  Bildschirmdiagonale: "Bildschirmdiagonale",
  "Display-Technologie": "Bildschirmtechnologie",

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

  // 3D Printers
  Drucktechnologie: "Drucktechnologie",
  "Maximale Druckauflösung": "Maximale Auflösung",
  Schnittstelle: "Schnittstelle",

  // Weights & Dimensions
  Gewicht: "Gewicht",
  Breite: "Breite",
  Höhe: "Höhe",
  Tiefe: "Tiefe",
  Artikelgewicht: "Gewicht",
  Produktgewicht: "Gewicht",
};

/**
 * Normalizes eBay values to match our project conventions.
 */
export function normalizeEbayValue(ebayName: string, value: string): string {
  // Fix spacing for units (e.g., "12GB" -> "12 GB")
  if (/^\d+(GB|TB|MB|KB|MHz|GHz|Hz|W|V|A|mAh|Wh|mm|cm|m|g|kg)$/i.test(value)) {
    return value.replace(/(\d+)([a-zA-Z%°/]+)/i, "$1 $2").trim();
  }

  // Handle specific fields
  if (
    ebayName.includes("Speicher") ||
    ebayName.includes("RAM") ||
    ebayName.includes("Kapazität")
  ) {
    return value.replace(/(\d+)(GB|TB|MB)/i, "$1 $2").toUpperCase();
  }

  // Boolean-like values
  if (value.toLowerCase() === "ja" || value.toLowerCase() === "yes")
    return "Ja";
  if (value.toLowerCase() === "nein" || value.toLowerCase() === "no")
    return "Nein";

  return value;
}
