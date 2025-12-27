import type { Metadata } from "next";
import { Category } from "./categories";

export const coreKeywords = [
  "Amazon price tracker",
  "price per unit",
  "unit price comparison",
  "true value finder",
  "best value hardware",
  "Amazon hardware deals",
  "realpricedata",
];

export const siteMetadata: Metadata = {
  metadataBase: new URL("https://realpricedata.com"),
  title: {
    default: "Amazon Unit Price Tracker & Deals | realpricedata.com",
    template: "%s | realpricedata.com",
  },
  description:
    "Amazon price tracker for hardware & storage across multiple markets. Compare HDD, SSD, RAM and more by true cost per TB/GB. Find the best value hardware deals instantly.",
  keywords: coreKeywords,
  authors: [{ name: "RealPriceData Team" }],
  creator: "RealPriceData Team",
  applicationName: "realpricedata.com",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icon-512.png",
        color: "#3B82F6",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://realpricedata.com",
    title: "realpricedata.com - Unit Price Tracker",
    description:
      "Compare Amazon hardware by true cost per TB/GB across multiple markets. Track HDD, SSD, and RAM prices to find the best value deals instantly.",
    siteName: "realpricedata.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "realpricedata.com - Find the best value on Amazon US",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "realpricedata.com - Unit Price Tracker",
    description:
      "Compare Amazon hardware by true cost per TB/GB across multiple markets. Track HDD, SSD, and RAM prices to find the best value deals instantly.",
    images: ["/og-image.png"],
    creator: "@realpricedata",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "realpricedata",
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

export function getAlternateLanguages(path: string = "") {
  const baseUrl = "https://realpricedata.com";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanPath = normalizedPath === "/" ? "" : normalizedPath;

  const liveCountries = getAllCountries().filter(c => c.isLive);
  const alternates: Record<string, string> = {
    // x-default should point to our primary/landing version for global users
    "x-default": `${baseUrl}/us${cleanPath}`,
  };

  liveCountries.forEach(country => {
    // For our site, we use English UI across all markets
    // So hreflang should be 'en-COUNTRYCODE'
    const hreflang = country.code === "us" ? "en-US" : `en-${country.code.toUpperCase()}`;
    alternates[hreflang] = `${baseUrl}/${country.code}${cleanPath}`;
  });

  // Root domain is 'en' (Global English)
  if (cleanPath === "") {
    alternates["en"] = baseUrl;
  }

  return alternates;
}

/**
 * Generates SEO keywords dynamically based on category and units.
 */
export function generateKeywords(category?: Category, extraKeywords: string[] = []): string[] {
  const baseKeywords = [
    ...coreKeywords,
    ...extraKeywords,
  ];

  if (!category) return baseKeywords;

  const unit = category.unitType;
  const unitKeywords = unit ? [
    `price per ${unit}`,
    `cost per ${unit}`,
    `cheapest ${category.name} per ${unit}`,
    `best ${unit} value`,
  ] : [];

  // Add specific aliases for common units
  if (unit === "W") {
    unitKeywords.push("price per watt", "cost per watt", "price per kW");
  } else if (unit === "TB") {
    unitKeywords.push("price per terabyte", "cost per gigabyte", "price per GB");
  }

  return [...new Set([
    category.name,
    ...unitKeywords,
    ...baseKeywords,
  ])];
}
