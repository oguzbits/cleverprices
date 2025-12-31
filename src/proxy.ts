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

  // 0. Check for explicit country set via query param (e.g. ?set_country=us)
  // This supports prefetching for the US root domain by updating the cookie on the redirect
  const setCountryParam = request.nextUrl.searchParams.get("set_country");
  if (setCountryParam && isValidCountryCode(setCountryParam)) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("set_country");
    const countryCode = setCountryParam.toLowerCase();

    // Use 302 to prevent browser caching of the redirect
    const response = NextResponse.redirect(url);

    // Force aggressive cookie setting
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.cookies.set("country", countryCode, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
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

  // 2. If no country code, allow US (Default)
  // We ONLY redirect if the user has an EXPLICIT cookie preference.
  const savedCountry = request.cookies.get("country")?.value;
  if (savedCountry && isValidCountryCode(savedCountry)) {
    if (savedCountry !== DEFAULT_COUNTRY) {
      // Redirect naked paths (e.g., / or /blog) to localized versions (e.g., /de or /de/blog)
      return NextResponse.redirect(
        new URL(`/${savedCountry}${pathname}`, request.url),
      );
    }
  }

  // Default: Serve US (Next.js handles the route)
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    // Match all paths except static files and internal Next.js paths
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|flags|icon.png).*)",
  ],
};
