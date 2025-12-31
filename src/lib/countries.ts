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
    isLive: true,
  },
  uk: {
    code: "uk",
    name: "United Kingdom",
    flag: "🇬🇧",
    domain: "amazon.co.uk",
    currency: "GBP",
    symbol: "£",
    locale: "en-GB",
    isLive: true,
  },
  ca: {
    code: "ca",
    name: "Canada",
    flag: "🇨🇦",
    domain: "amazon.ca",
    currency: "CAD",
    symbol: "$",
    locale: "en-CA",
    isLive: true,
  },
  de: {
    code: "de",
    name: "Germany",
    flag: "🇩🇪",
    domain: "amazon.de",
    currency: "EUR",
    symbol: "€",
    locale: "de-DE",
    isLive: true,
  },
  es: {
    code: "es",
    name: "Spain",
    flag: "🇪🇸",
    domain: "amazon.es",
    currency: "EUR",
    symbol: "€",
    locale: "es-ES",
    isLive: true,
  },
  it: {
    code: "it",
    name: "Italy",
    flag: "🇮🇹",
    domain: "amazon.it",
    currency: "EUR",
    symbol: "€",
    locale: "it-IT",
    isLive: true,
  },
  fr: {
    code: "fr",
    name: "France",
    flag: "🇫🇷",
    domain: "amazon.fr",
    currency: "EUR",
    symbol: "€",
    locale: "fr-FR",
    isLive: true,
  },
};

export const DEFAULT_COUNTRY: CountryCode = "us";

// Get all countries as array
export function getAllCountries(): Country[] {
  return Object.values(countries);
}

// Get country by code
export function getCountryByCode(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return countries[code.toLowerCase() as CountryCode];
}

// Detect country from browser locale
export function detectCountryFromLocale(locale?: string): CountryCode {
  if (!locale && typeof navigator !== "undefined") {
    locale = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage;
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

// LocalStorage key for country preference
export const COUNTRY_STORAGE_KEY = "realpricedata_country";

// Get saved country preference from localStorage
export function getSavedCountry(): CountryCode | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(COUNTRY_STORAGE_KEY);
    return saved as CountryCode | null;
  } catch {
    return null;
  }
}

// Save country preference to localStorage
export function saveCountryPreference(countryCode: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COUNTRY_STORAGE_KEY, countryCode.toLowerCase());
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Get user's country (saved preference > detected > default)
export function getUserCountry(): CountryCode {
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
