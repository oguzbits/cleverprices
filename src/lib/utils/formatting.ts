import { getCountryByCode } from "@/lib/countries";

/**
 * Format a number as currency based on country code
 */
export function formatCurrency(amount: number, countryCode: string): string {
  const country = getCountryByCode(countryCode);
  if (!country) {
    // Fallback to USD
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: country.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format price per unit (e.g., "$0.05/TB")
 */
export function formatPricePerUnit(
  price: number,
  unit: string,
  countryCode: string,
): string {
  const formattedPrice = formatCurrency(price, countryCode);
  return `${formattedPrice}/${unit}`;
}

/**
 * Format capacity with unit (e.g., "2 TB", "500 GB")
 */
export function formatCapacity(value: number, unit: string): string {
  return `${value} ${unit}`;
}

/**
 * Format a number with specified decimal places
 */
export function formatNumber(
  value: number,
  decimals: number = 2,
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Null-safe currency formatter for component use
 */
export function formatCurrencySafe(
  value: number | undefined | null,
  countryCode: string,
): string {
  if (value === undefined || value === null) return "–";
  return formatCurrency(value, countryCode);
}

/**
 * Format rating as German decimal (e.g., 1,5)
 */
export function formatRatingDE(rating: number): string {
  return rating.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Casing map for specific tech terms that should have fixed casing.
 */
const TECH_TERMS_MAP: Record<string, string> = {
  ssd: "SSD",
  ssds: "SSDs",
  hdd: "HDD",
  hdds: "HDDs",
  tv: "TV",
  tvs: "TVs",
  gpu: "GPU",
  gpus: "GPUs",
  cpu: "CPU",
  cpus: "CPUs",
  ram: "RAM",
  psu: "PSU",
  psus: "PSUs",
  nvme: "NVMe",
  sata: "SATA",
  oled: "OLED",
  qled: "QLED",
  led: "LED",
  usb: "USB",
  hdmi: "HDMI",
  pci: "PCI",
  pcie: "PCIe",
  atx: "ATX",
  itx: "ITX",
  ddr4: "DDR4",
  ddr5: "DDR5",
  wlan: "WLAN",
  lan: "LAN",
  ups: "UPS",
  usv: "USV",
  ips: "IPS",
  va: "VA",
  tn: "TN",
};

/**
 * Regex components for units and abbreviations
 */
const TECH_REGEX = new RegExp(
  `\\b(${Object.keys(TECH_TERMS_MAP).join("|")})\\b`,
  "gi",
);
const UNIT_REGEX =
  /\b(\d+)\s*(gb|tb|mb|kb|mhz|ghz|wh|w|core|cores|bits|bit)\b/gi;

/**
 * Smartly format tech-heavy text (fixing abbreviations and units)
 */
export function formatTechText(text: string): string {
  if (!text) return text;

  let formatted = text;

  // 1. Fix known abbreviations using the mapping
  formatted = formatted.replace(TECH_REGEX, (match) => {
    return TECH_TERMS_MAP[match.toLowerCase()] || match;
  });

  // 2. Fix Units (e.g., "2tb" -> "2 TB", "6000mhz" -> "6000 MHz")
  formatted = formatted.replace(UNIT_REGEX, (_, val, unit) => {
    const uppercaseUnit =
      unit.toLowerCase() === "core" || unit.toLowerCase() === "cores"
        ? unit.toLowerCase()
        : unit.toUpperCase();
    return `${val} ${uppercaseUnit}`;
  });

  return formatted;
}

/**
 * Clean up long product titles for display (e.g., in cards and breadcrumbs)
 * Preserves model identifiers while removing extra metadata.
 */
export function formatDisplayTitle(title: string, _model?: string): string {
  if (!title) return "";

  // User SSOT: We now trust the standardized title from mapDbProduct.
  // Do NOT truncate or split it. Just apply tech formatting.
  return formatTechText(title);
}
