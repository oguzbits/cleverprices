import type { Metadata } from "next";
import { Category } from "./categories";
import {
  BRAND_DOMAIN,
  BRAND_NAME,
  DEFAULT_TITLE,
  LOGO,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_URL,
  TITLE_TEMPLATE,
  TWITTER_AT,
  getCountryUrl,
} from "./site-config";

export const coreKeywords = [
  "Preisvergleich",
  "Preis pro TB",
  "Preis pro GB",
  "günstigste Hardware",
  "beste Preise Festplatte",
  "SSD Preisvergleich",
  "RAM günstig kaufen",
  "Hardware Angebote Deutschland",
  BRAND_NAME.toLowerCase(),
];

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  keywords: coreKeywords,
  authors: [{ name: SITE_AUTHOR }],
  creator: SITE_AUTHOR,
  applicationName: BRAND_DOMAIN,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: LOGO.icon192, sizes: "192x192", type: "image/png" },
      { url: LOGO.icon512, sizes: "512x512", type: "image/png" },
    ],
    shortcut: LOGO.favicon,
    apple: [{ url: LOGO.appleTouchIcon, sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: LOGO.icon512,
        color: "#3B82F6",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    title: `${BRAND_DOMAIN} - Preisvergleich für Hardware & Speicher`,
    description:
      "Vergleichen Sie Hardware nach echtem Preis pro TB/GB. Finden Sie die günstigsten SSDs, Festplatten und RAM mit unserem Preisvergleich.",
    siteName: BRAND_DOMAIN,
    images: [
      {
        url: LOGO.ogImage,
        width: 1200,
        height: 630,
        alt: `${BRAND_DOMAIN} - Hardware Preisvergleich Deutschland`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_DOMAIN} - Preisvergleich für Hardware & Speicher`,
    description:
      "Vergleichen Sie Hardware nach echtem Preis pro TB/GB. Finden Sie die günstigsten SSDs, Festplatten und RAM.",
    images: [LOGO.ogImage],
    creator: TWITTER_AT,
    site: TWITTER_AT,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND_DOMAIN,
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "msapplication-TileColor": "#3B82F6",
    "msapplication-config": "/browserconfig.xml",
    "color-scheme": "light dark",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { getAllCountries } from "./countries";

export function getAlternateLanguages(
  path: string = "",
  customTranslations: Record<string, string> = {},
  includeRegions: boolean = true,
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanPath = normalizedPath === "/" ? "" : normalizedPath;

  const liveCountries = getAllCountries().filter((c) => c.isLive);
  const alternates: Record<string, string> = {
    // x-default should point to our primary/landing version (US)
    "x-default": `${SITE_URL}${cleanPath}`,
  };

  // Add custom translations first
  Object.entries(customTranslations).forEach(([lang, url]) => {
    alternates[lang] = url.startsWith("http") ? url : `${SITE_URL}${url}`;
  });

  if (includeRegions) {
    liveCountries.forEach((country) => {
      // Correct ISO 3166-1 alpha-2 for United Kingdom is GB
      let region = country.code.toUpperCase();
      if (region === "UK") region = "GB";

      // For our site, we use English UI across all markets: 'en-REGION'
      const hreflang = `en-${region}`;

      // For US, we use the root domain for all pages
      if (country.code === "us") {
        alternates[hreflang] = `${SITE_URL}${cleanPath}`;
      } else {
        alternates[hreflang] = `${SITE_URL}/${country.code}${cleanPath}`;
      }
    });
  }

  // Root domain also serves as the general 'en' version if not already set
  if (!alternates["en"]) {
    alternates["en"] = `${SITE_URL}${cleanPath}`;
  }

  return alternates;
}

/**
 * Generates SEO keywords dynamically based on category and units (German).
 */
export function generateKeywords(
  category?: Category,
  extraKeywords: string[] = [],
): string[] {
  const baseKeywords = [...coreKeywords, ...extraKeywords];

  if (!category) return baseKeywords;

  const unit = category.unitType;
  const unitKeywords = unit
    ? [
        `Preis pro ${unit}`,
        `Kosten pro ${unit}`,
        `günstigste ${category.name} pro ${unit}`,
        `${category.name} Preisvergleich`,
        `beste ${category.name} ${unit}`,
      ]
    : [];

  // Add specific aliases for common units (German)
  if (unit === "W") {
    unitKeywords.push("Preis pro Watt", "Kosten pro Watt", "Euro pro kW");
  } else if (unit === "TB") {
    unitKeywords.push(
      "Preis pro Terabyte",
      "Kosten pro Gigabyte",
      "Euro pro GB",
      "günstigste SSD pro TB",
    );
  }

  return [...new Set([category.name, ...unitKeywords, ...baseKeywords])];
}

/**
 * Returns a complete Open Graph object with sane defaults and overrides.
 */
export function getOpenGraph(
  overrides: {
    title?: string;
    description?: string;
    url?: string;
    type?: "website" | "article";
    locale?: string;
    [key: string]: string | boolean | undefined | number | string[];
  } = {},
) {
  // If no title/description provided, Next.js will use the page's top-level title/description
  // but it's better to be explicit to ensure they are present in the OG tags.
  return {
    ...siteMetadata.openGraph,
    ...overrides,
  };
}

/**
 * Generates consistent homepage metadata for all marketplaces.
 * Ensures US and other country homepages follow the same pattern.
 *
 * @param countryCode - ISO country code (e.g., 'us', 'ca', 'uk')
 * @param countryName - Full country name (optional, for future use)
 * @returns Complete Metadata object for the homepage
 */
export function getHomePageMetadata(
  countryCode: string,
): import("next").Metadata {
  const code = countryCode.toUpperCase();
  const isUS = countryCode.toLowerCase() === "us";

  // Canonical URL: US uses root domain, others use /{country}
  const canonicalUrl = isUS
    ? SITE_URL
    : getCountryUrl(countryCode.toLowerCase());

  // Consistent title pattern for all marketplaces
  const title = `Price Tracker - Amazon ${code}`;

  // Description with country code
  const description = `Amazon ${code} price tracker for hardware & storage. Compare HDD, SSD, RAM and more by true cost per TB/GB. Find the best value hardware deals instantly.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(""),
    },
    openGraph: getOpenGraph({
      title,
      description,
      url: canonicalUrl,
      locale: `en_${code === "UK" ? "GB" : code}`, // Correct ISO code for UK
    }),
  };
}
