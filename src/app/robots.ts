import { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/_next/static/", // CRITICAL: Allow Googlebot to load CSS and JS for rendering
          "/static/", // Allow access to public static assets
        ],
        disallow: [
          "/api/",
          "/monitoring/", // Block Sentry telemetry
          "/_next/", // Block Next.js internal paths (except /static/ allowed above)
          "/search?*",
          "/*?view=",
          "/*?sort=",
          "/*?search=",
          "/*?brand=", // Block filter combinations (Crawl Trap)
          "/*?capacity=",
          "/*?condition=",
          "/*?technology=",
          "/*?formFactor=",
          "/*?cores=",
          "/*?socket=",
          "/*?storageType=",
          "/*?minPrice=",
          "/*?maxPrice=",
          "/*?minCapacity=",
          "/*?maxCapacity=",
          "/*?_rsc=", // Block Next.js RSC payload fragments - keep this to save budget, but unblocking JS above fixes rendering
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
