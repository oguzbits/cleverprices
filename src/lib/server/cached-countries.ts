"use cache";

import {
  getAllCountries as getAllCountriesSync,
  getCountryByCode as getCountryByCodeSync,
  type Country,
} from "../countries";

/**
 * Cached server-side wrappers for country functions
 * These are used in Server Components to benefit from Next.js caching
 */

export async function getAllCountries(): Promise<Country[]> {
  return getAllCountriesSync();
}

export async function getCountryByCode(
  code: string | null | undefined,
): Promise<Country | undefined> {
  return getCountryByCodeSync(code);
}
