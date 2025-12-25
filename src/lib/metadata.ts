import type { Metadata } from "next";

export const siteMetadata: Metadata = {
  metadataBase: new URL("https://realpricedata.com"),
  title: {
    default:
      "Amazon DE Unit Price Tracker & Deals | realpricedata.com",
    template: "%s | realpricedata.com",
  },
  description:
    "Amazon Germany (DE) unit price tracker. Compare HDD, SSD, and RAM by true cost per unit (EUR/TB & GB). Find the best storage deals and hardware savings instantly.",
  keywords: [
    "Amazon price tracker",
    "price per unit",
    "cost per TB",
    "HDD deals",
    "SSD prices",
    "RAM price tracker",
    "price comparison",
    "true value finder",
    "storage deals",
    "best prices",
    "Amazon savings",
    "price drop tracker",
  ],
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
      "Compare Amazon.de products by their true cost per TB, GB, or unit. Find the best storage deals and hardware savings in Germany instantly.",
    siteName: "realpricedata.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "realpricedata.com - Find the best value on Amazon Germany",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "realpricedata.com - Unit Price Tracker",
    description:
      "Compare Amazon.de products by their true cost per TB, GB, or unit. Find the best storage deals and hardware savings in Germany instantly.",
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

export function getAlternateLanguages(path: string = "") {
  const baseUrl = "https://realpricedata.com";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanPath = normalizedPath === "/" ? "" : normalizedPath;

  // We are currently using /de as our primary localized version for Amazon.de unit prices
  // x-default should point to our primary version for global users
  return {
    "en-DE": `${baseUrl}/de${cleanPath}`,
    "x-default": `${baseUrl}/de${cleanPath}`,
  };
}
