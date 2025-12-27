"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getUserCountry,
  saveCountryPreference,
  isValidCountryCode,
  DEFAULT_COUNTRY,
  type Country,
  countries,
} from "@/lib/countries";
import { trackSEO } from "@/lib/analytics";

export function useCountry() {
  const pathname = usePathname();
  const router = useRouter();
  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY);
  const [isLoading, setIsLoading] = useState(true);

  // Extract country from URL
  const getCountryFromPath = useCallback((): string | null => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && isValidCountryCode(segments[0])) {
      return segments[0];
    }
    return null;
  }, [pathname]);

  // Initialize country on mount
  useEffect(() => {
    const urlCountry = getCountryFromPath();

    if (urlCountry) {
      // URL has country code - use it and save preference
      setCountry(urlCountry);
      saveCountryPreference(urlCountry);
      setIsLoading(false);
    } else {
      // No country in URL - get user's preferred/detected country
      const userCountry = getUserCountry();
      setCountry(userCountry);
      setIsLoading(false);
    }
  }, [getCountryFromPath]);

  // Change country and update URL
  const changeCountry = useCallback(
    (newCountryCode: string) => {
      if (!isValidCountryCode(newCountryCode)) {
        console.error(`Invalid country code: ${newCountryCode}`);
        return;
      }

      const urlCountry = getCountryFromPath();
      const oldCountry = country;

      setCountry(newCountryCode);
      saveCountryPreference(newCountryCode);

      // Track country change for SEO analytics
      trackSEO.countryChanged(oldCountry, newCountryCode);

      // Update URL
      if (urlCountry) {
        // Safe way to replace ONLY the first segment (the country code)
        const segments = pathname.split("/"); // e.g. ["", "us", "electronics"]
        segments[1] = newCountryCode;
        const newPath = segments.join("/");
        router.push(newPath || "/");
      } else if (pathname === "/") {
        // If we're on the root homepage, redirect to the country homepage
        router.push(`/${newCountryCode}`);
      } else {
        // Optional: If we're on a non-localized page (like /blog), 
        // we might want to redirect to localized versions if they exist.
        // For now, we stay on the page as the state has already been updated.
      }
    },
    [pathname, router, getCountryFromPath, country],
  );

  // Get current country object
  const currentCountry: Country | undefined = countries[country];

  return {
    country,
    currentCountry,
    changeCountry,
    isLoading,
    hasCountryInUrl: !!getCountryFromPath(),
  };
}
