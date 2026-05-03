import { type Currency } from "@/types";

export type CountryCode = "us" | "uk" | "ca" | "de" | "es" | "it" | "fr";

export interface Country {
  code: CountryCode; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  domain: string;
  currency: Currency;
  symbol: string;
  locale: string; // e.g., 'en-US', 'de-DE'
  isLive: boolean;
}

export const countries: Record<CountryCode, Country> = {
  us: {
    code: "us",
    name: "United States",
    flag: "🇺🇸",
    domain: "amazon.com",
    currency: "USD",
    symbol: "$",
    locale: "en-US",
    isLive: false, // Phase 3: Enable after PA API access
  },
  uk: {
    code: "uk",
    name: "United Kingdom",
    flag: "🇬🇧",
    domain: "amazon.co.uk",
    currency: "GBP",
    symbol: "£",
    locale: "en-GB",
    isLive: false, // Future expansion
  },
  ca: {
    code: "ca",
    name: "Canada",
    flag: "🇨🇦",
    domain: "amazon.ca",
    currency: "CAD",
    symbol: "$",
    locale: "en-CA",
    isLive: false, // Future expansion
  },
  de: {
    code: "de",
    name: "Germany",
    flag: "🇩🇪",
    domain: "amazon.de",
    currency: "EUR",
    symbol: "€",
    locale: "de-DE",
    isLive: true, // Primary market
  },
  es: {
    code: "es",
    name: "Spain",
    flag: "🇪🇸",
    domain: "amazon.es",
    currency: "EUR",
    symbol: "€",
    locale: "es-ES",
    isLive: false, // Future expansion
  },
  it: {
    code: "it",
    name: "Italy",
    flag: "🇮🇹",
    domain: "amazon.it",
    currency: "EUR",
    symbol: "€",
    locale: "it-IT",
    isLive: false, // Future expansion
  },
  fr: {
    code: "fr",
    name: "France",
    flag: "🇫🇷",
    domain: "amazon.fr",
    currency: "EUR",
    symbol: "€",
    locale: "fr-FR",
    isLive: false, // Future expansion
  },
};

export const DEFAULT_COUNTRY: CountryCode = "de"; // Germany-first strategy

// Get all countries as array
export function getAllCountries(): Country[] {
  return Object.values(countries);
}

// Get country by code
export function getCountryByCode(
  code: string | null | undefined,
): Country | undefined {
  if (!code) return undefined;
  return countries[code.toLowerCase() as CountryCode];
}

// Detect country from browser locale
function detectCountryFromLocale(locale?: string): CountryCode {
  if (!locale && typeof navigator !== "undefined") {
    locale =
      navigator.language ||
      (navigator as Navigator & { userLanguage?: string }).userLanguage;
  }

  if (!locale) return DEFAULT_COUNTRY;

  // Extract country code from locale (e.g., 'en-US' -> 'us')
  const parts = locale.toLowerCase().split("-");
  const countryCode = parts[parts.length - 1] as CountryCode;

  // Check if we support this country
  if (countries[countryCode]) {
    return countryCode;
  }

  // Fallback mappings for common cases
  const fallbackMap: Record<string, CountryCode> = {
    en: "us",
    de: "de",
    fr: "fr",
    es: "es",
    it: "it",
  };

  const languageCode = parts[0];
  return fallbackMap[languageCode] || DEFAULT_COUNTRY;
}

// LocalStorage key for country preference (Deprecated, kept for cleanup)
const COUNTRY_STORAGE_KEY = "cleverprices_country";

// Get saved country preference from Cookies (Client-side)
function getSavedCountry(): CountryCode | null {
  if (typeof window === "undefined") return null;
  try {
    const match = document.cookie.match(/(^| )country=([^;]+)/);
    if (match) {
      return match[2] as CountryCode;
    }
  } catch {
    // Ignore error
  }
  return null;
}

// Save country preference to Cookies matches Server Proxy expectation
function _saveCountryPreference(countryCode: string): void {
  if (typeof window === "undefined") return;
  try {
    // Set cookie for 1 year, Lax, Root path to ensure Proxy visibility
    const isSecure = window.location.protocol === "https:";
    document.cookie = `country=${countryCode.toLowerCase()}; path=/; max-age=31536000; SameSite=Lax${isSecure ? "; Secure" : ""}`;

    // Cleanup legacy localStorage if it exists
    localStorage.removeItem(COUNTRY_STORAGE_KEY);
  } catch {
    // Silently fail if cookies are blocked
  }
}

// Get user's country (saved preference > detected > default)
function _getUserCountry(): CountryCode {
  // 1. Check saved preference
  const saved = getSavedCountry();
  if (saved && countries[saved] && countries[saved].isLive) {
    return saved;
  }

  // 2. Detect from browser
  const detected = detectCountryFromLocale();
  if (detected && countries[detected] && countries[detected].isLive) {
    return detected;
  }

  // 3. Default
  return DEFAULT_COUNTRY;
}

// Get flag URL (SVG) for a country code
export function getFlag(code: string): string {
  // Map "uk" to "gb" for local flags
  const flagCode = code.toLowerCase() === "uk" ? "gb" : code.toLowerCase();
  return `/flags/${flagCode}.svg`;
}

// Validate country code
export function isValidCountryCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return !!countries[code.toLowerCase() as CountryCode];
}
