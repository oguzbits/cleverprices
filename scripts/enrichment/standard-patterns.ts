/**
 * 📚 STANDARD VALIDATION PATTERNS
 *
 * Sourced from:
 * - GS1 GDSN (Global Data Synchronization Network)
 * - Schema.org Product Types
 * - ISO Standards (8601, 3166)
 * - Industry Groups (Wi-Fi Alliance, Bluetooth SIG, HDMI.org)
 */

export const StandardPatterns = {
  // 📦 GS1 / IDENTIFIERS
  GTIN_13: /^\d{13}$/, // Standard EAN-13
  GTIN_12: /^\d{12}$/, // UPC-A
  GTIN_8: /^\d{8}$/, // EAN-8
  GTIN_14: /^\d{14}$/, // ITF-14 (Case packs)
  ASIN: /^[A-Z0-9]{10}$/, // Amazon Standard Identification Number

  // 📐 MEASUREMENTS (GS1 GDSN)
  // Numeric: Allows integer or float (dot or comma), requires positive values
  NUMERIC_POSITIVE: /^[+]?([0-9]*[.,])?[0-9]+$/,

  // Dimensions with specific units (derived from GS1 codes)
  DIMENSION_MM_CM_M: /^[0-9]+([.,][0-9]+)?\s*(mm|cm|m)$/i,
  WEIGHT_G_KG: /^[0-9]+([.,][0-9]+)?\s*(g|kg|tons?)$/i,

  // ⚡ ELECTRICITY / POWER
  VOLTAGE: /^[0-9]+([.,][0-9]+)?\s*(V|kV|mV)$/i,
  CONSUMPTION: /^[0-9]+([.,][0-9]+)?\s*(W|kW|kWh)$/i,
  CURRENT: /^[0-9]+([.,][0-9]+)?\s*(A|mA)$/i,
  FREQUENCY: /^[0-9]+([.,][0-9]+)?\s*(Hz|kHz|MHz|GHz)$/i,

  // 📡 CONNECTIVITY STANDARDS (Industry Groups)
  // Bluetooth SIG: "Bluetooth" or "BT" prefix optional, Version X.X mandatory
  BLUETOOTH_VERSION: /^(?:Bluetooth|BT)?\s*(\d+(\.\d+)?)?$/i,

  // Wi-Fi Alliance: Branding (Wi-Fi 6) or IEEE Standard (802.11ax)
  WIFI_STANDARD: /^(Wi-Fi\s*\d+[E]?|802\.11[a-z]{1,2})$/i,

  // HDMI.org: Version numbers like 1.4b, 2.1
  HDMI_VERSION: /^(\d+\.\d+[a-z]?)$/i,

  // USB Implementers Forum
  USB_VERSION: /^(USB\s*)?(\d+\.\d+|Type-C|Thunderbolt\s*\d+)$/i,

  // 📅 DATES (ISO 8601)
  ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
  YEAR: /^\d{4}$/,

  // 🖥️ DISPLAY
  RESOLUTION: /^\d{3,5}\s*[xX]\s*\d{3,5}$/, // e.g., 1920x1080
  ASPECT_RATIO: /^\d{1,2}[:]\d{1,2}$/, // e.g., 16:9
};

export const StandardEnums = {
  // 🇪🇺 EU Energy Label (Regulation 2017/1369)
  // Includes new A-G scale and legacy A+++ scale
  ENERGY_CLASS: ["A", "B", "C", "D", "E", "F", "G", "A+++", "A++", "A+"],

  // ✅ Boolean values (Schema.org / XSD boolean)
  BOOLEAN: ["true", "false", "1", "0", "Yes", "No", "Ja", "Nein"],
};
