import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { allCategories } from "./lib/categories";
import { isValidCountryCode } from "./lib/countries";

/**
 * Next.js 16 Proxy
 * Handles SEO redirects, country enforcement, and path interception.
 */
const LEGACY_COUNTRIES = ["us", "uk", "ca", "fr", "es", "it", "de"];

// Handles SEO redirects, country enforcement, and path interception.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip internal paths and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/flags") ||
    pathname.startsWith("/out")
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments.length > 0 ? segments[0].toLowerCase() : "";

  // Check for both current supported countries and legacy codes that need redirecting
  const isExplicitCountryPath =
    isValidCountryCode(firstSegment) || LEGACY_COUNTRIES.includes(firstSegment);

  // NEW: Redirect country code paths to root
  // Since we only support German market, paths like /de, /de/categories, /us, etc.
  // should redirect to the equivalent path without the country code prefix
  if (isExplicitCountryPath) {
    const url = request.nextUrl.clone();
    // Remove the country code and redirect to the remaining path
    const remainingPath = segments.slice(1).join("/");
    url.pathname = remainingPath ? `/${remainingPath}` : "/";
    return NextResponse.redirect(url, 301);
  }

  // 2. SEO Category Aliases (Root Level)
  // e.g., /storage -> /hard-drives
  for (const category of Object.values(allCategories)) {
    if (
      category.aliases?.includes(firstSegment) &&
      category.slug !== firstSegment
    ) {
      const url = request.nextUrl.clone();
      const remainingPath = segments.slice(1).join("/");
      url.pathname = remainingPath
        ? `/${category.slug}/${remainingPath}`
        : `/${category.slug}`;
      return NextResponse.redirect(url, 301);
    }
  }

  // Default: Serve as is.
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
