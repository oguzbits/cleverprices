import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { DEFAULT_COUNTRY, isValidCountryCode } from './lib/countries'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip internal paths, static files, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/flags')
  ) {
    return NextResponse.next()
  }

  // 1. Check if the URL already has a valid country code
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  
  if (firstSegment && isValidCountryCode(firstSegment)) {
    const response = NextResponse.next()
    
    // Update the country cookie to match the explicit URL preference
    // This allows the user to switch regions just by clicking a link
    if (request.cookies.get('country')?.value !== firstSegment) {
      response.cookies.set('country', firstSegment, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax'
      })
    }

    // Special case: Redirect the default country home (e.g., /us) to root (/)
    // but KEEP the path for sub-pages (e.g., /us/blog -> keep it or redirect?)
    // Based on sitemap.ts, /us is non-canonical for the homepage.
    if (firstSegment === DEFAULT_COUNTRY && segments.length === 1) {
      return NextResponse.redirect(new URL('/', request.url), {
        headers: response.headers // Carry over the new cookie!
      })
    }

    return response
  }

  // 2. If no country code, detect the best country
  // First, check for a cookie (saved preference)
  const savedCountry = request.cookies.get('country')?.value
  
  if (savedCountry && isValidCountryCode(savedCountry)) {
    if (savedCountry !== DEFAULT_COUNTRY) {
       // Redirect naked paths (e.g., / or /blog) to localized versions (e.g., /de or /de/blog)
       return NextResponse.redirect(new URL(`/${savedCountry}${pathname}`, request.url))
    }
    // If it's the default country (us), we stay on the current path (/)
    return NextResponse.next()
  }

  // Next, detect from Accept-Language header (only if no cookie)
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage && pathname === '/') {
    // Primary language/country extraction
    const preferredLocale = acceptLanguage.split(',')[0].split('-')
    const lang = preferredLocale[0]
    const countryFromHeader = preferredLocale[1]?.toLowerCase() || lang
    
    if (isValidCountryCode(countryFromHeader) && countryFromHeader !== DEFAULT_COUNTRY) {
      return NextResponse.redirect(new URL(`/${countryFromHeader}${pathname}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and internal Next.js paths
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|flags|icon.png).*)',
  ],
}
