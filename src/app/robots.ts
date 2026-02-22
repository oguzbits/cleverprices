import { SITE_URL } from "@/lib/site-config";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/static/",
          "/monitoring/", // Block Sentry telemetry
          "/search?*",
          "/*?view=",
          "/*?sort=",
          "/*?search=",
          "/*?filter_",
          "/*?condition=",
          "/*?_rsc=", // Block Next.js RSC payload fragments
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
