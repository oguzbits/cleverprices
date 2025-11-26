/**
 * Language detection and preference management utilities
 * Detects user's preferred language from browser settings and manages manual overrides
 */

const STORAGE_KEY = 'preferred-language';
const SUPPORTED_LANGUAGES = ['de', 'en'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Detects the user's preferred language based on:
 * 1. Stored preference (if user manually selected)
 * 2. Browser language settings
 * 3. Fallback to English
 */
export function getPreferredLanguage(): SupportedLanguage {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return 'en';
  }

  // First, check if user has manually set a preference
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
  } catch (error) {
    // localStorage might not be available (privacy mode, etc.)
    console.warn('Could not access localStorage:', error);
  }

  // Detect from browser language settings
  const browserLanguage = detectBrowserLanguage();
  return browserLanguage;
}

/**
 * Detects language from browser settings
 * Checks navigator.languages array and navigator.language
 */
function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  // Get all browser languages in order of preference
  const languages = navigator.languages || [navigator.language];

  // Check each language in order
  for (const lang of languages) {
    const normalizedLang = normalizeLangCode(lang);
    if (SUPPORTED_LANGUAGES.includes(normalizedLang as SupportedLanguage)) {
      return normalizedLang as SupportedLanguage;
    }
  }

  // Default to English if no supported language found
  return 'en';
}

/**
 * Normalizes language codes to our supported format
 * Examples: 'de-DE' -> 'de', 'en-US' -> 'en', 'de-AT' -> 'de'
 */
function normalizeLangCode(langCode: string): string {
  if (!langCode) return 'en';
  
  // Extract the primary language code (before the hyphen)
  const primaryLang = langCode.toLowerCase().split('-')[0];
  
  return primaryLang;
}

/**
 * Stores the user's manual language preference
 * This overrides automatic detection
 */
export function setLanguagePreference(language: SupportedLanguage): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    console.warn('Could not save language preference:', error);
  }
}

/**
 * Clears the stored language preference
 * Returns to automatic browser-based detection
 */
export function clearLanguagePreference(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Could not clear language preference:', error);
  }
}

/**
 * Checks if a language preference has been manually set
 */
export function hasStoredPreference(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}
