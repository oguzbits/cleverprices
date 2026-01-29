export const GOLDEN_VALUES: Record<string, string[]> = {
  // 🎨 COLORS (Standardized for Filters)
  Produktfarbe: [
    "Schwarz",
    "Weiß",
    "Silber",
    "Grau",
    "Gold",
    "Rot",
    "Blau",
    "Grün",
    "Gelb",
    "Orange",
    "Lila",
    "Rosa",
    "Braun",
    "Beige",
    "Türkis",
    "Mehrfarbig",
    "Transparent",
  ],

  // 💻 OS (Standardized for Filters)
  Betriebssystem: [
    "Windows 11 Home",
    "Windows 11 Pro",
    "Windows 10 Home",
    "Windows 10 Pro",
    "macOS",
    "iOS",
    "iPadOS",
    "Android",
    "ChromeOS",
    "Linux",
    "Ohne Betriebssystem",
    "FreeDOS",
  ],

  // 🖥️ CONNECTIONS
  "USB-Anschluss": [
    "USB-C",
    "USB-A",
    "Micro-USB",
    "Mini-USB",
    "Lightning",
    "Thunderbolt 3",
    "Thunderbolt 4",
  ],

  // 🔋 BATTERY TECHNOLOGY
  "Akku-/Batterietechnologie": [
    "Lithium-Ion (Li-Ion)",
    "Lithium-Polymer (Li-Po)",
    "Nickel-Metallhydrid (NiMH)",
    "Alkaline",
  ],

  // ❄️ COOLING
  Kühlung: ["Luftkühlung", "Wasserkühlung", "Passiv"],

  // 💾 STORAGE TYPE
  "Interner Speichertyp": [
    "DDR3",
    "DDR4",
    "DDR5",
    "LPDDR4",
    "LPDDR4X",
    "LPDDR5",
    "LPDDR5X",
    "GDDR6",
    "GDDR6X",
    "GDDR5",
    "SSD",
    "HDD",
    "eMMC",
  ],

  // 📶 WIFI
  WLAN: [
    "Wi-Fi 7 (802.11be)",
    "Wi-Fi 6E (802.11ax)",
    "Wi-Fi 6 (802.11ax)",
    "Wi-Fi 5 (802.11ac)",
    "Wi-Fi 4 (802.11n)",
  ],
};

/**
 * 🗺️ SYNONYM MAP (Fuzzy -> Canonical)
 * Maps common variations to the Golden Value.
 */
export const SYNONYM_MAP: Record<string, Record<string, string>> = {
  Produktfarbe: {
    black: "Schwarz",
    anthrazit: "Grau",
    grey: "Grau",
    white: "Weiß",
    silver: "Silber",
    gold: "Gold",
    blue: "Blau",
    red: "Rot",
    green: "Grün",
    yellow: "Gelb",
    pink: "Rosa",
    purple: "Lila",
    brown: "Braun",
    navy: "Blau",
    midnight: "Schwarz",
    starlight: "Silber",
    "space grey": "Grau",
    "space gray": "Grau",
    graphite: "Grau",
  },
  Betriebssystem: {
    win11: "Windows 11 Home",
    "windows 11": "Windows 11 Home",
    "win 11": "Windows 11 Home",
    win10: "Windows 10 Home",
    "windows 10": "Windows 10 Home",
    android: "Android",
    "no os": "Ohne Betriebssystem",
    none: "Ohne Betriebssystem",
    dos: "FreeDOS",
  },
  WLAN: {
    "wifi 6": "Wi-Fi 6 (802.11ax)",
    "wi-fi 6": "Wi-Fi 6 (802.11ax)",
    "802.11ax": "Wi-Fi 6 (802.11ax)",
    "wifi 6e": "Wi-Fi 6E (802.11ax)",
    "wifi 7": "Wi-Fi 7 (802.11be)",
    "wifi 5": "Wi-Fi 5 (802.11ac)",
    "802.11ac": "Wi-Fi 5 (802.11ac)",
  },
};
