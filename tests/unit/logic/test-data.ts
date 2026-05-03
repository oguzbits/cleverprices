export interface ExtractionTestCase {
  title: string;
  text?: string;
  category: string;
  fields: string[];
  expected: Record<string, string | number | boolean | null>;
  description: string;
}

export const EXTRACTION_TEST_CASES: ExtractionTestCase[] = [
  // --- SSDs (Speed & Capacity) ---
  {
    title: "Samsung 990 PRO 2TB NVMe SSD",
    text: "Lesegeschwindigkeit 7450 MB/s, Schreibgeschwindigkeit 6900 MB/s",
    category: "ssds",
    fields: [
      "Speicherkapazität",
      "Lesegeschwindigkeit",
      "Schreibgeschwindigkeit",
    ],
    expected: {
      Speicherkapazität: "2048 GB",
      Lesegeschwindigkeit: "7450 MB/s",
      Schreibgeschwindigkeit: "6900 MB/s",
    },
    description: "Standard SSD extraction with labels",
  },
  {
    title: "Crucial P3 500GB NVMe 3500MB/s M.2 SSD",
    category: "ssds",
    fields: ["Speicherkapazität", "Lesegeschwindigkeit"],
    expected: {
      Speicherkapazität: "500 GB",
      Lesegeschwindigkeit: "3500 MB/s",
    },
    description: "SSD extraction from title with slash",
  },

  // --- Cameras (Megapixels & Color) ---
  {
    title: "Fujifilm X-T50 anthrazit",
    text: "40,2 Megapixel X-Trans CMOS 5 HR Sensor",
    category: "cameras",
    fields: ["Megapixel insgesamt", "Produktfarbe"],
    expected: {
      "Megapixel insgesamt": "40,2 MP",
      Produktfarbe: "Grau",
    },
    description: "Camera with German decimal and golden color",
  },
  {
    title: "Sony Alpha 7 IV (33MP, Black)",
    category: "cameras",
    fields: ["Megapixel insgesamt", "Produktfarbe"],
    expected: {
      "Megapixel insgesamt": "33 MP",
      Produktfarbe: "Schwarz",
    },
    description: "Camera from title with English synonyms",
  },

  // --- Smartphones (Storage, RAM, Booleans) ---
  {
    title: "iPhone 15 Pro 128GB Titan Schwarz",
    text: "6.1 Zoll Super Retina XDR, NFC Ja, WLAN: Vorhanden, Bluetooth 5.3",
    category: "smartphones",
    fields: [
      "Speicherkapazität",
      "Produktfarbe",
      "Bildschirmdiagonale",
      "NFC",
      "WLAN",
    ],
    expected: {
      Speicherkapazität: "128 GB",
      Produktfarbe: "Schwarz",
      Bildschirmdiagonale: "6,1 Zoll",
      NFC: "Ja",
      WLAN: "Ja",
    },
    description: "Smartphone with mixed booleans and decimal unit",
  },

  // --- RAM (Speed, Type, Latency) ---
  {
    title: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz CL30",
    category: "ram",
    fields: [
      "Speicherkapazität",
      "Speichertyp",
      "Speicherdatenübertragungsrate",
      "CAS Latenz",
    ],
    expected: {
      Speicherkapazität: "32 GB",
      Speicherdatenübertragungsrate: "6000 MT/s",
      "CAS Latenz": "CL30",
    },
    description: "RAM with unique numeric units and kit capacity",
  },

  // --- CPUs (Cores, Cache, TDP) ---
  {
    title: "AMD Ryzen 7 7800X3D (8x 4.2GHz, 104MB Cache, 120W TDP)",
    category: "cpu",
    fields: [
      "Anzahl Prozessorkerne",
      "Prozessortaktfrequenz",
      "Thermal Design Power (TDP)",
    ],
    expected: {
      "Anzahl Prozessorkerne": "8",
      Prozessortaktfrequenz: "4,2 GHz",
      "Thermal Design Power (TDP)": "120 W",
    },
    description: "CPU with core count and clock",
  },

  // --- Booleans & Edge Cases ---
  {
    title: "Product with ANC and GPS",
    text: "Geräuschunterdrückung: ja. GPS: false. Wasserfest: nein.",
    category: "unknown",
    fields: ["Geräuschunterdrückung", "GPS", "Wasserschutz"],
    expected: {
      Geräuschunterdrückung: "Ja",
      GPS: "Nein",
      Wasserschutz: "Nein",
    },
    description: "Explicit boolean value mapping",
  },
  {
    title: "Monitor with 144Hz and G-Sync",
    text: "Refresh rate: 144 Hz, NVIDIA G-Sync: Vorhanden",
    category: "monitors",
    fields: ["Maximale Bildwiederholrate", "G-Sync"],
    expected: {
      "Maximale Bildwiederholrate": "144 Hz",
      "G-Sync": "Ja",
    },
    description: "Monitor refresh rate and sync tech",
  },

  // --- Multi-Value sorting ---
  {
    title: "Multi-Color Laptop",
    text: "Verfügbar in Blau, Silber und Schwarz",
    category: "notebooks",
    fields: ["Produktfarbe"],
    expected: {
      Produktfarbe: "Blau, Schwarz, Silber",
    },
    description: "Golden color multi-value sorting",
  },

  // --- Graphics Cards (Memory & Ports) ---
  {
    title: "ASUS TUF Gaming GeForce RTX 4080 SUPER 16GB GDDR6X",
    text: "Anschlüsse: 2x HDMI 2.1a, 3x DisplayPort 1.4a",
    category: "gpu",
    fields: [
      "Videospeicher-Kapazität",
      "Interner Speichertyp",
      "Anzahl HDMI-Anschlüsse",
      "Anzahl DisplayPort Anschlüsse",
    ],
    expected: {
      "Videospeicher-Kapazität": "16 GB",
      "Interner Speichertyp": "GDDR6X",
      "Anzahl HDMI-Anschlüsse": "2",
      "Anzahl DisplayPort Anschlüsse": "3",
    },
    description: "GPU with specialized memory and port counts",
  },

  // --- Home Appliances (Energy & Noise) ---
  {
    title: "Bosch Serie 6 Waschmaschine 9kg",
    text: "Energieeffizienzklasse A, Geräuschwert 71 dB, 1400 U/min",
    category: "washing-machines",
    fields: [
      "Energieeffizienzklasse",
      "Geräuschemissionsklasse",
      "Maximale Schleuderdrehzahl",
    ],
    expected: {
      Energieeffizienzklasse: "A",
      "Maximale Schleuderdrehzahl": "1400 RPM",
    },
    description: "Appliance with energy class and rotation speed",
  },

  // --- Dimensions & Weight (Mixed Units) ---
  {
    title: "Compact Soundbar",
    text: "Breite: 55cm, Höhe: 64mm, Tiefe: 0.1m, Gewicht: 2.5kg",
    category: "electronics",
    fields: ["Breite", "Höhe", "Tiefe", "Gewicht"],
    expected: {
      Breite: "550 mm",
      Höhe: "64 mm",
      Tiefe: "100 mm",
      Gewicht: "2500 g",
    },
    description: "Mixed units normalization (cm, mm, m, kg)",
  },

  // --- Hallucination Defense ---
  {
    title: "Simple Headphones",
    text: "These headphones feature high quality sound. Bluetooth is compatible.",
    category: "headphones",
    fields: ["Akkulaufzeit", "Geräuschunterdrückung"],
    expected: {
      Akkulaufzeit: null,
      Geräuschunterdrückung: null,
    },
    description:
      "Hallucination defense: fields mentioned in schema but missing in text",
  },

  // --- Implicit Negation & Natural Language ---
  {
    title: "Outdoor Watch (No GPS)",
    text: "This robust watch is perfect for hiking. It comes without GPS and also has no NFC.",
    category: "smartwatches",
    fields: ["GPS", "NFC"],
    expected: {
      GPS: "Nein",
      NFC: "Nein",
    },
    description: "Implicit negation: 'without' and 'no' in flowing text",
  },
];
