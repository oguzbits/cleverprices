"use client"

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  getUserCountry,
  saveCountryPreference,
  isValidCountryCode,
  DEFAULT_COUNTRY,
  type Country,
  countries,
} from '@/lib/countries'

export function useCountry() {
  const pathname = usePathname()
  const router = useRouter()
  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY)
  const [isLoading, setIsLoading] = useState(true)

  // Extract country from URL
  const getCountryFromPath = useCallback((): string | null => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length > 0 && isValidCountryCode(segments[0])) {
      return segments[0]
    }
    return null
  }, [pathname])

  // Initialize country on mount
  useEffect(() => {
    const urlCountry = getCountryFromPath()
    
    if (urlCountry) {
      // URL has country code - use it and save preference
      setCountry(urlCountry)
      saveCountryPreference(urlCountry)
      setIsLoading(false)
    } else {
      // No country in URL - get user's preferred/detected country
      const userCountry = getUserCountry()
      setCountry(userCountry)
      setIsLoading(false)
    }
  }, [getCountryFromPath])

  // Change country and update URL
  const changeCountry = useCallback((newCountryCode: string) => {
    if (!isValidCountryCode(newCountryCode)) {
      console.error(`Invalid country code: ${newCountryCode}`)
      return
    }

    const urlCountry = getCountryFromPath()
    setCountry(newCountryCode)
    saveCountryPreference(newCountryCode)

    // Update URL if it currently has a country code
    if (urlCountry) {
      const newPath = pathname.replace(`/${urlCountry}`, `/${newCountryCode}`)
      router.push(newPath)
    }
  }, [pathname, router, getCountryFromPath])

  // Get current country object
  const currentCountry: Country | undefined = countries[country]

  return {
    country,
    currentCountry,
    changeCountry,
    isLoading,
    hasCountryInUrl: !!getCountryFromPath(),
  }
}
