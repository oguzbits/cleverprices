export interface Country {
  code: string // ISO 3166-1 alpha-2
  name: string
  flag: string
  domain: string
  currency: string
  locale: string // e.g., 'en-US', 'de-DE'
  isLive: boolean
}

export const countries: Record<string, Country> = {
  us: {
    code: 'us',
    name: 'United States',
    flag: '🇺🇸',
    domain: 'amazon.com',
    currency: 'USD',
    locale: 'en-US',
    isLive: true,
  },
  uk: {
    code: 'uk',
    name: 'United Kingdom',
    flag: '🇬🇧',
    domain: 'amazon.co.uk',
    currency: 'GBP',
    locale: 'en-GB',
    isLive: false,
  },
  ca: {
    code: 'ca',
    name: 'Canada',
    flag: '🇨🇦',
    domain: 'amazon.ca',
    currency: 'CAD',
    locale: 'en-CA',
    isLive: false,
  },
  de: {
    code: 'de',
    name: 'Germany',
    flag: '🇩🇪',
    domain: 'amazon.de',
    currency: 'EUR',
    locale: 'de-DE',
    isLive: false,
  },
  es: {
    code: 'es',
    name: 'Spain',
    flag: '🇪🇸',
    domain: 'amazon.es',
    currency: 'EUR',
    locale: 'es-ES',
    isLive: false,
  },
  it: {
    code: 'it',
    name: 'Italy',
    flag: '🇮🇹',
    domain: 'amazon.it',
    currency: 'EUR',
    locale: 'it-IT',
    isLive: false,
  },
  fr: {
    code: 'fr',
    name: 'France',
    flag: '🇫🇷',
    domain: 'amazon.fr',
    currency: 'EUR',
    locale: 'fr-FR',
    isLive: false,
  },
  au: {
    code: 'au',
    name: 'Australia',
    flag: '🇦🇺',
    domain: 'amazon.com.au',
    currency: 'AUD',
    locale: 'en-AU',
    isLive: false,
  },
  se: {
    code: 'se',
    name: 'Sweden',
    flag: '🇸🇪',
    domain: 'amazon.se',
    currency: 'SEK',
    locale: 'sv-SE',
    isLive: false,
  },
  ie: {
    code: 'ie',
    name: 'Ireland',
    flag: '🇮🇪',
    domain: 'amazon.co.uk',
    currency: 'EUR',
    locale: 'en-IE',
    isLive: false,
  },
  in: {
    code: 'in',
    name: 'India',
    flag: '🇮🇳',
    domain: 'amazon.in',
    currency: 'INR',
    locale: 'en-IN',
    isLive: false,
  },
}

export const DEFAULT_COUNTRY = 'us'

// Get all countries as array
export function getAllCountries(): Country[] {
  return Object.values(countries)
}

// Get country by code
export function getCountryByCode(code: string): Country | undefined {
  return countries[code.toLowerCase()]
}

// Detect country from browser locale
export function detectCountryFromLocale(locale?: string): string {
  if (!locale && typeof navigator !== 'undefined') {
    locale = navigator.language || (navigator as any).userLanguage
  }
  
  if (!locale) return DEFAULT_COUNTRY
  
  // Extract country code from locale (e.g., 'en-US' -> 'us')
  const parts = locale.toLowerCase().split('-')
  const countryCode = parts[parts.length - 1]
  
  // Check if we support this country
  if (countries[countryCode]) {
    return countryCode
  }
  
  // Fallback mappings for common cases
  const fallbackMap: Record<string, string> = {
    'en': 'us',
    'de': 'de',
    'fr': 'fr',
    'es': 'es',
    'it': 'it',
    'sv': 'se',
    'hi': 'in',
  }
  
  const languageCode = parts[0]
  return fallbackMap[languageCode] || DEFAULT_COUNTRY
}

// LocalStorage key for country preference
export const COUNTRY_STORAGE_KEY = 'realpricedata_country'

// Get saved country preference from localStorage
export function getSavedCountry(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(COUNTRY_STORAGE_KEY)
  } catch {
    return null
  }
}

// Save country preference to localStorage
export function saveCountryPreference(countryCode: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(COUNTRY_STORAGE_KEY, countryCode.toLowerCase())
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Get user's country (saved preference > detected > default)
export function getUserCountry(): string {
  // 1. Check saved preference
  const saved = getSavedCountry()
  if (saved && countries[saved]) {
    return saved
  }
  
  // 2. Detect from browser
  const detected = detectCountryFromLocale()
  if (detected && countries[detected]) {
    return detected
  }
  
  // 3. Default
  return DEFAULT_COUNTRY
}

// Validate country code
export function isValidCountryCode(code: string): boolean {
  return !!countries[code.toLowerCase()]
}
