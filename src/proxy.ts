import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_COUNTRY, isValidCountryCode } from "./lib/countries";
import { allCategories } from "./lib/categories";

/**
 * Next.js 16 Proxy
 * Handles SEO redirects, country enforcement, and path interception.
 */
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
  // Removed early return for root path to allow cookie enforcement

  const firstSegment = segments.length > 0 ? segments[0].toLowerCase() : "";
  const isExplicitCountryPath = isValidCountryCode(firstSegment);

  // 2. SEO Category Aliases (Root Level)
  // e.g., /storage -> /hard-drives
  if (!isExplicitCountryPath) {
    for (const category of Object.values(allCategories)) {
      if (category.aliases?.includes(firstSegment)) {
        const url = request.nextUrl.clone();
        const remainingPath = segments.slice(1).join("/");
        url.pathname = remainingPath
          ? `/${category.slug}/${remainingPath}`
          : `/${category.slug}`;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  // 3. SEO Category Aliases (Localized Level)
  // e.g., /de/storage -> /de/hard-drives
  if (isExplicitCountryPath && segments.length > 1) {
    const secondSegment = segments[1].toLowerCase();
    for (const category of Object.values(allCategories)) {
      if (category.aliases?.includes(secondSegment)) {
        const url = request.nextUrl.clone();
        const remainingPath = segments.slice(2).join("/");
        url.pathname = remainingPath
          ? `/${firstSegment}/${category.slug}/${remainingPath}`
          : `/${firstSegment}/${category.slug}`;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  // 4. Cookie Enforcement for US Paths
  // If we are on a US path (e.g. / or /electronics) BUT the user prefers a different country,
  // redirect them to that country's localized path.
  if (!isExplicitCountryPath) {
    const countryCookie = request.cookies.get("country")?.value;

    if (
      countryCookie &&
      isValidCountryCode(countryCookie) &&
      countryCookie !== DEFAULT_COUNTRY
    ) {
      // User prefers DE but is visiting /electronics -> Redirect to /de/electronics
      const url = request.nextUrl.clone();
      url.pathname = `/${countryCookie}${pathname}`;
      return NextResponse.redirect(url);
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
