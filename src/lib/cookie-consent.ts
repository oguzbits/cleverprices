/**
 * Utility functions for handling cookie consent and affiliate links
 */

/**
 * Check if user has accepted cookies
 */
export function hasAcceptedCookies(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem("cookie-consent") === "accepted"
}

/**
 * Check if user has declined cookies
 */
export function hasDeclinedCookies(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem("cookie-consent") === "declined"
}

/**
 * Check if user hasn't made a choice yet
 */
export function hasNoCookieChoice(): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem("cookie-consent")
}

/**
 * Get the user's cookie consent status
 */
export function getCookieConsent(): 'accepted' | 'declined' | 'pending' {
  if (typeof window === 'undefined') return 'pending'
  
  const consent = localStorage.getItem("cookie-consent")
  if (consent === "accepted") return 'accepted'
  if (consent === "declined") return 'declined'
  return 'pending'
}

/**
 * Remove affiliate tracking parameters from a URL
 * This respects user's privacy when they decline cookies
 */
export function removeAffiliateParams(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Remove common affiliate parameters
    const affiliateParams = ['tag', 'ref', 'ref_', 'linkCode', 'ascsubtag', 'creative', 'creativeASIN']
    
    affiliateParams.forEach(param => {
      urlObj.searchParams.delete(param)
    })
    
    return urlObj.toString()
  } catch (error) {
    // If URL parsing fails, just return the original URL
    console.warn('Failed to parse URL for affiliate param removal:', error)
    return url
  }
}

/**
 * Get the appropriate link based on cookie consent
 * If user declined cookies, returns URL without affiliate parameters
 * If user accepted or hasn't decided, returns original URL with affiliate parameters
 */
export function getConsentAwareLink(affiliateLink: string): string {
  const consent = getCookieConsent()
  
  if (consent === 'declined') {
    return removeAffiliateParams(affiliateLink)
  }
  
  // For 'accepted' or 'pending', return the affiliate link
  return affiliateLink
}

/**
 * Reset cookie consent (useful for "Cookie Settings" button)
 */
export function resetCookieConsent(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem("cookie-consent")
}
