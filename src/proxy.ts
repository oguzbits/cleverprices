import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEFAULT_COUNTRY, isValidCountryCode } from "./lib/countries";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internal paths, static files, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/flags") ||
    pathname.startsWith("/out")
  ) {
    return NextResponse.next();
  }

  // 1. Check if the URL already has a valid country code
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isValidCountryCode(firstSegment)) {
    // If it's the US country code, redirect to root path (301 permanent redirect)
    // US content is served from root domain, not /us/
    if (firstSegment === DEFAULT_COUNTRY) {
      const newPath =
        segments.length === 1 ? "/" : "/" + segments.slice(1).join("/");
      return NextResponse.redirect(new URL(newPath, request.url), {
        status: 301,
      });
    }

    // For other countries, continue to the localized page
    const response = NextResponse.next();

    // Synchronize the country cookie with the explicit URL preference
    if (request.cookies.get("country")?.value !== firstSegment) {
      response.cookies.set("country", firstSegment, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    }

    return response;
  }

  // 2. If no country code, detect the best country
  // First, check for a cookie (saved preference)
  const savedCountry = request.cookies.get("country")?.value;

  if (savedCountry && isValidCountryCode(savedCountry)) {
    if (savedCountry !== DEFAULT_COUNTRY) {
      // Redirect naked paths (e.g., / or /blog) to localized versions (e.g., /de or /de/blog)
      return NextResponse.redirect(
        new URL(`/${savedCountry}${pathname}`, request.url),
      );
    }
    // If it's the default country (us), we stay on the current path (/)
    return NextResponse.next();
  }

  // Next, detect from Accept-Language header (only if no cookie)
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage && pathname === "/") {
    // Primary language/country extraction
    const preferredLocale = acceptLanguage.split(",")[0].split("-");
    const lang = preferredLocale[0];
    const countryFromHeader = preferredLocale[1]?.toLowerCase() || lang;

    if (
      isValidCountryCode(countryFromHeader) &&
      countryFromHeader !== DEFAULT_COUNTRY
    ) {
      return NextResponse.redirect(
        new URL(`/${countryFromHeader}${pathname}`, request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and internal Next.js paths
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|flags|icon.png).*)",
  ],
};
