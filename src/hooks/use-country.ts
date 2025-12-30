"use client";

import { useEffect, useState } from "react";
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
  const getCountryFromPath = (): string | null => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && isValidCountryCode(segments[0])) {
      return segments[0];
    }
    return null;
  };

  // Initialize country on mount and on pathname changes
  useEffect(() => {
    const urlCountry = getCountryFromPath();

    if (urlCountry) {
      // URL has country code - use it and save preference
      setCountry(urlCountry);
      saveCountryPreference(urlCountry);
      setIsLoading(false);

      // If it's the default country landing page, redirect to root to avoid duplicate content
      if (
        urlCountry === DEFAULT_COUNTRY &&
        pathname === `/${DEFAULT_COUNTRY}`
      ) {
        router.replace("/");
      }
    } else {
      // No country in URL - get user's preferred/detected country
      const userCountry = getUserCountry();
      setCountry(userCountry);
      setIsLoading(false);

      // If we're on the root homepage, redirect to the country homepage (unless it's default)
      if (pathname === "/" && userCountry !== DEFAULT_COUNTRY) {
        router.replace(`/${userCountry}`);
      }
    }
  }, [pathname, router]);

  // Change country and update URL
  const changeCountry = (newCountryCode: string) => {
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
      // If switching TO the default country from its localized landing page, go to root
      if (
        newCountryCode === DEFAULT_COUNTRY &&
        pathname === `/${urlCountry}`
      ) {
        router.push("/");
      } else {
        // Safe way to replace ONLY the first segment (the country code)
        const segments = pathname.split("/"); // e.g. ["", "us", "electronics"]
        segments[1] = newCountryCode;
        const newPath = segments.join("/");
        router.push(newPath || "/");
      }
    } else if (pathname === "/") {
      // If we're on the root homepage and switching away from default, redirect
      if (newCountryCode !== DEFAULT_COUNTRY) {
        router.push(`/${newCountryCode}`);
      }
    }
  };

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
