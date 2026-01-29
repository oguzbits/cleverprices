import type { CategorySlug } from "../../src/lib/categories";

/**
 * CANONICAL KEY MAPPING
 * Merges multiple redundant keys into a single source of truth.
 */
export const CANONICAL_MAP: Record<string, string> = {
  // Weight normalization
  "Item: Weight (g)": "Weight_Grams",
  "Package: Weight (g)": "Package_Weight_Grams",
  Weight: "Weight_Grams",
  Gewicht: "Weight_Grams",

  // Dimensions normalization
  "Item: Dimension (cm³)": "Dimensions_CM3",
  "Package: Dimension (cm³)": "Package_Dimensions_CM3",
  Dimensions: "Dimensions_CM3",
  Abmessungen: "Dimensions_CM3",

  // Storage & RAM
  Size: "Storage",
  Capacity: "Storage",
  Storage_Capacity: "Storage",
  Arbeitsspeicher: "RAM",
  Memory: "RAM",

  // Multimedia
  Auflösung: "Resolution",
  Display: "Screen_Size",
  Bildschirmdiagonale: "Screen_Size",
  Anschlüsse: "Ports",
  Schnittstelle: "Interface",

  // CPU & RAM
  Sockel: "Socket",
  DDR_Version: "Memory_Type",
  Speichertyp: "Memory_Type",
  Taktfrequenz: "Clock_Speed",
  "CAS Latenz": "Latency",
  Latenz: "Latency",

  // Household
  Energieeffizienzklasse: "Energy_Class",
  Wasserverbrauch: "Water_Consumption",
  Programme: "Programs",
  Program: "Programs",

  // Household & Energy
  Nutzinhalt: "Total_Capacity_L",
  "Energie-Effizienzklasse": "Energy_Class",
  Energieklasse: "Energy_Class",
  Schallleistung: "Noise_Level_dB",
  Schleuderdrehzahl: "Spin_Speed_RPM",
};

/**
 * VALUE VALIDATORS (Regex-based type checking)
 */
const VALUE_VALIDATORS: Record<string, RegExp> = {
  // Weights must be numeric + optional g/kg. Block if contains tech signals like '4G' or 'RTX'
  Weight_Grams: /^\d+[\.,]?\d*\s*(g|kg|gramm|kilogramm)?$/i,
  Dimensions_CM3: /^\d+[\.,]?\d*$/i,
  Storage: /^\d+\s*(GB|TB|MB)$/i,
  RAM: /^\d+\s*(GB|TB|MB)$/i,
  Connectivity: /^(WiFi|WLAN|LTE|5G|4G|NFC|Bluetooth|GPS|eSIM|Dual-SIM|UWB)$/i, // Strict: no "und" or "hast"
  IP_Rating: /^IP\d{2}$/i,
};

/**
 * MARKETING JUNK LIST
 * If a value contains any of these, it's rejected as noisy marketing text.
 */
const MARKETING_JUNK_LIST = [
  "hast",
  "haben",
  "gespeichert",
  "verfügbar",
  "klicken",
  "bestellen",
  "versand",
  "kostenlos",
  "angebot",
  "exklusiv",
];

/**
 * CATEGORY SCHEMAS
 * Whitelist of allowed keys per category to prevent "Noise Pollution".
 */
export const CATEGORY_SCHEMAS: Record<string, string[]> = {
  // --- DOMAIN 1: COMPUTING CORE ---
  gpu: [
    "Chipset",
    "VRAM",
    "VRAM_Type",
    "Bus_Width",
    "Clock_Speed",
    "Cooling",
    "Length",
    "Weight_Grams",
    "Ports",
    "TDP",
    "PCIe_Version",
    "Slot_Width",
    "DLSS_Version",
  ],
  cpu: [
    "Socket",
    "Cores",
    "Threads",
    "Clock_Speed",
    "Boost_Clock",
    "L3_Cache",
    "TDP",
    "Architecture",
    "Integrated_Graphics",
    "Generation",
    "Series",
    "Process_Node",
  ],
  motherboards: [
    "Socket",
    "Chipset",
    "Form_Factor",
    "Memory_Type",
    "Max_RAM",
    "Memory_Slots",
    "PCIe_Slots",
    "M2_Slots",
    "SATA_Ports",
    "WiFi",
    "Bluetooth",
    "USB_Ports",
  ],
  ram: [
    "Capacity",
    "Memory_Type",
    "Clock_Speed",
    "Latency",
    "Voltage",
    "Kit_Size",
    "Form_Factor",
    "ECC",
    "RGB",
  ],
  ssds: [
    "Capacity",
    "Interface",
    "Form_Factor",
    "Read_Speed",
    "Write_Speed",
    "TBW",
    "NAND_Type",
    "Controller",
    "Cache",
  ],
  "hard-drives": [
    "Capacity",
    "Interface",
    "Form_Factor",
    "RPM",
    "Cache",
    "NAS_Ready",
  ],
  "power-supplies": [
    "Wattage",
    "Efficiency_Rating",
    "Modularity",
    "Form_Factor",
    "Fan_Size",
    "Zero_RPM_Mode",
  ],
  "pc-cases": [
    "Type",
    "Form_Factor",
    "Max_GPU_Length",
    "Max_CPU_Height",
    "Fans_Included",
    "Side_Panel",
    "Front_Panel",
    "Radiator_Support",
  ],
  "cpu-coolers": [
    "Type",
    "Fan_Size",
    "TDP_Rating",
    "Socket_Support",
    "Height",
    "Noise_Level_dB",
    "RGB",
  ],

  // --- DOMAIN 2: MOBILE & PORTABLE ---
  smartphones: [
    "Storage",
    "RAM",
    "Screen_Size",
    "Screen_Type",
    "Resolution",
    "Refresh_Rate",
    "Processor",
    "Rear_Camera",
    "Front_Camera",
    "Battery_Capacity",
    "Charging_Speed",
    "OS",
    "5G",
    "NFC",
    "IP_Rating",
    "SIM_Type",
    "Weight_Grams",
  ],
  tablets: [
    "Storage",
    "RAM",
    "Screen_Size",
    "Screen_Type",
    "Resolution",
    "Processor",
    "Battery_Capacity",
    "Pen_Support",
    "OS",
    "Connectivity",
    "Weight_Grams",
  ],
  notebooks: [
    "Processor",
    "RAM",
    "Storage",
    "Graphics",
    "Screen_Size",
    "Screen_Type",
    "Resolution",
    "Refresh_Rate",
    "Battery_Life",
    "Weight_Grams",
    "OS",
    "Keyboard_Layout",
    "Ports",
  ],
  smartwatches: [
    "Screen_Size",
    "Case_Size",
    "Case_Material",
    "Strap_Material",
    "Battery_Life",
    "IP_Rating",
    "Sensors",
    "GPS",
    "NFC",
    "OS",
    "Compatibility",
  ],

  // --- DOMAIN 3: ENTERTAINMENT ---
  tvs: [
    "Screen_Size",
    "Resolution",
    "Panel_Type",
    "Refresh_Rate",
    "HDR_Support",
    "Smart_OS",
    "HDMI_Ports",
    "HDMI_2_1",
    "Sound_Output",
    "Energy_Class",
  ],
  monitors: [
    "Screen_Size",
    "Resolution",
    "Panel_Type",
    "Refresh_Rate",
    "Response_Time",
    "Sync_Tech",
    "Brightness",
    "HDR",
    "Curved",
    "Ports",
    "Ergonomics",
  ],
  headphones: [
    "Type",
    "Connectivity",
    "Active_Noise_Cancelling",
    "Battery_Life",
    "Driver_Size",
    "Impedance",
    "Frequency_Response",
    "Microphone",
    "Weight_Grams",
  ],
  speakers: [
    "Type",
    "Power_Wattage",
    "Connectivity",
    "Battery_Life",
    "Waterproof",
    "Multiroom",
    "Voice_Assistant",
  ],
  soundbars: [
    "Channels",
    "Power_Wattage",
    "Subwoofer",
    "Dolby_Atmos",
    "HDMI_eARC",
    "Connectivity",
    "Dimensions_CM3",
  ],
  consoles: [
    "Platform",
    "Version",
    "Storage",
    "Resolution_Target",
    "Disc_Drive",
    "Bundled_Controller",
  ],

  // --- DOMAIN 4: HOUSEHOLD ---
  waschmaschinen: [
    "Capacity_KG",
    "Spin_Speed_RPM",
    "Energy_Class",
    "Noise_Level_dB",
    "Programs",
    "Water_Consumption",
    "Dimensions_CM3",
    "Type",
  ],
  waeschetrockner: [
    "Capacity_KG",
    "Type",
    "Energy_Class",
    "Noise_Level_dB",
    "Heat_Pump",
    "Self_Cleaning",
  ],
  geschirrspueler: [
    "Capacity_Place_Settings",
    "Energy_Class",
    "Noise_Level_dB",
    "Water_Consumption",
    "Cutlery_Drawer",
    "Width",
    "Type",
  ],
  kuehlschraenke: [
    "Total_Capacity_L",
    "Fridge_Capacity_L",
    "Freezer_Capacity_L",
    "Energy_Class",
    "NoFrost",
    "Noise_Level_dB",
    "Dimensions_CM3",
    "Type",
  ],
  staubsauger: [
    "Type",
    "Power_Wattage",
    "Suction_Power",
    "Battery_Life",
    "Bin_Volume",
    "Weight_Grams",
    "HEPA_Filter",
    "Accessories",
  ],
  backoefen: [
    "Volume_L",
    "Energy_Class",
    "Cleaning_Type",
    "Heating_Modes",
    "Dimensions_CM3",
  ],

  // --- DOMAIN 5: KITCHEN ---
  espressomaschinen: [
    "Type",
    "Pressure_Bar",
    "Wattage",
    "Water_Tank_L",
    "Milk_System",
    "Grinder",
    "Heat_Up_Time",
  ],
  kuechenmaschinen: [
    "Wattage",
    "Bowl_Capacity_L",
    "Speeds",
    "Attachments",
    "Timer",
    "Scale",
  ],

  // --- DOMAIN 6: IMAGING ---
  cameras: [
    "Sensor_Resolution_MP",
    "Sensor_Size",
    "Video_Resolution",
    "ISO_Range",
    "FPS",
    "Stabilization",
    "Viewfinder",
    "Screen_Type",
    "Weight_Grams",
  ],
  drones: [
    "Video_Resolution",
    "Flight_Time_Min",
    "Range_KM",
    "Weight_Grams",
    "Obstacle_Avoidance",
    "Max_Speed",
  ],

  // --- DOMAIN 7: NETWORKING ---
  routers: [
    "WiFi_Standard",
    "Max_Speed_Mbps",
    "Bands",
    "Mesh_Support",
    "LAN_Ports",
    "Modem_Integrated",
  ],
  nas: ["Bays", "Processor", "RAM", "Max_Capacity", "LAN_Ports"],
};

/**
 * QUALITY SCORING
 * Returns a score (0-100) and list of missing keys based on schema.
 */
export function validateCompleteness(
  specs: Record<string, any>,
  category: string,
): { score: number; missing: string[] } {
  const whitelist = CATEGORY_SCHEMAS[category];
  if (!whitelist || whitelist.length === 0) return { score: 100, missing: [] };

  // Identify required keys (assuming all in schema are important for "Industry Grade")
  // In a real scenario, we might have "Required" vs "Optional" maps.
  // For now, let's target 70% coverage of ANY schema fields as "Good".

  // Filter out global safe keys from the requirement check to force category-specific density
  const keysToCheck = whitelist;

  const presentKeys = keysToCheck.filter(
    (k) => specs[k] !== undefined && specs[k] !== null && specs[k] !== "",
  );

  const missing = keysToCheck.filter((k) => !presentKeys.includes(k));
  const score = Math.round((presentKeys.length / keysToCheck.length) * 100);

  return { score, missing };
}

/**
 * Specification Guard: Validates and standardizes extracted technical attributes.
 * Now supports Quality Scoring.
 */
export function validateProductSpecs(
  specs: Record<string, any>,
  category: CategorySlug,
): { specs: Record<string, any>; score: number; missing: string[] } {
  const cleanSpecs = guardIntegrity(specs, category);
  const quality = validateCompleteness(cleanSpecs, category);
  return {
    specs: cleanSpecs,
    score: quality.score,
    missing: quality.missing,
  };
}

/**
 * THE GUARD: Clean, Validate, and Standardize
 */
export function guardIntegrity(
  rawSpecs: Record<string, any>,
  category: string,
): Record<string, any> {
  const cleanSpecs: Record<string, any> = {};

  // 1. Canonical Mapping & Basic Cleaning
  for (const [key, val] of Object.entries(rawSpecs)) {
    if (val === null || val === undefined || val === "") continue;

    // 0. Global Blacklist Check
    if (GLOBAL_BLACKLIST.some((b) => key.includes(b))) continue;

    let canonicalKey = CANONICAL_MAP[key] || key;

    // Retry mapping with normalization if direct match failed
    if (canonicalKey === key) {
      const norm = normalizeKey(key);
      // Reverse lookup or manual check for common fails
      if (norm.includes("weight") && norm.includes("g"))
        canonicalKey = "Weight_Grams";
      if (norm.includes("dimension") && norm.includes("cm"))
        canonicalKey = "Dimensions_CM3";
    }

    let stringVal = String(val).trim();

    // 1.5 Marketing Junk Filter (Emergency Fix)
    const lowerVal = stringVal.toLowerCase();
    if (MARKETING_JUNK_LIST.some((junk) => lowerVal.includes(junk))) continue;

    // 2. Cross-Field Intelligence (Correction Logic)

    // Fix: "4G" in Weight/Connectivity for GPUs is almost always VRAM
    if (
      category === "gpu" &&
      (canonicalKey === "Weight_Grams" || canonicalKey === "Connectivity") &&
      /^4G$/i.test(stringVal)
    ) {
      if (!cleanSpecs["VRAM"]) cleanSpecs["VRAM"] = "4GB";
      continue;
    }

    // Fix: "Storage" in GPU is VRAM
    if (
      category === "gpu" &&
      canonicalKey === "Storage" &&
      stringVal.match(/^\d+\s*(GB|TB)$/i)
    ) {
      cleanSpecs["VRAM"] = stringVal;
      continue;
    }

    // Fix: Bus Width detection for GPUs (e.g. 192-bit)
    if (category === "gpu" && !cleanSpecs["Bus_Width"]) {
      const busMatch = stringVal.match(/(\d+)\s*(-bit|bit)/i);
      if (busMatch) {
        cleanSpecs["Bus_Width"] = busMatch[1] + "-bit";
        continue;
      }
    }

    // 3. Type Validation
    if (VALUE_VALIDATORS[canonicalKey]) {
      if (!VALUE_VALIDATORS[canonicalKey].test(stringVal)) {
        continue;
      }
    }

    // 4. Schema Whitelisting (STRICT MODE)
    // The user demanded "Industry Standard" quality. This means NO extra junk.
    const whitelist = CATEGORY_SCHEMAS[category];

    // Global Safe List (Keys allowed on EVERYTHING)
    const GLOBAL_SAFELIST = [
      "Model",
      "Manufacturer",
      "Brand",
      "Release_Date",
      "Color",
      "Weight_Grams",
      "Dimensions_CM3",
      "EAN",
      "ASIN",
    ];

    if (whitelist) {
      if (
        !whitelist.includes(canonicalKey) &&
        !GLOBAL_SAFELIST.includes(canonicalKey)
      ) {
        // STRICT BLOCK: If it's not in the schema and not a global safe key, it's garbage.
        continue;
      }
    } else if (category !== "uncategorized") {
      // If we have a category but no schema defined yet, we should log warning or be permissive?
      // For now, allow Global + Common Tech keys as fallback, but this path shouldn't be hit often
      // with our exhaustive list.
    }

    // 5. Deduplication & Precision (Keep the best value)
    if (cleanSpecs[canonicalKey]) {
      // If we already have a value, only replace if this one is "better" (e.g. has units)
      if (
        stringVal.match(/[a-z]/i) &&
        !String(cleanSpecs[canonicalKey]).match(/[a-z]/i)
      ) {
        cleanSpecs[canonicalKey] = stringVal;
      }
    } else {
      cleanSpecs[canonicalKey] = stringVal;
    }
  }

  // Final Polish: Ensure weights are consistent
  if (
    cleanSpecs["Weight_Grams"] &&
    !cleanSpecs["Weight_Grams"].toString().toLowerCase().includes("g")
  ) {
    cleanSpecs["Weight_Grams"] = cleanSpecs["Weight_Grams"] + "g";
  }

  return cleanSpecs;
}

/**
 * GLOBAL BLACKLIST
 * Attributes that should NEVER appear in the final specs, regardless of category.
 */
const GLOBAL_BLACKLIST = [
  "Style",
  "Pattern",
  "Department",
  "Batteries Required",
  "Batteries Included",
  "Is Discontinued By Manufacturer",
  "Item: Dimension (cm³)", // Raw keys that failed mapping
  "Package: Dimension (cm³)",
  // "Item: Weight (g)", <-- Removed to allow mapping to Weight_Grams
  "Package: Weight (g)",
  "Date First Available",
  "Customer Reviews",
  "Best Sellers Rank",
];

// Helper to normalize lookups
function normalizeKey(key: string): string {
  // Remove special chars like ³ and lower case
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}
