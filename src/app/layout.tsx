import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LazyCookieConsent } from "@/components/LazyCookieConsent";
import Link from "next/link";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://realpricedata.com'),
  title: {
    default: "realpricedata.com - Compare Price Per Unit",
    template: "%s | realpricedata.com",
  },
  description: "Compare Amazon products in your region by their true cost per liter, kilogram, or item. Find the best deals instantly.",
  keywords: ["price comparison", "price per unit", "best deals", "HDD prices", "SSD prices", "storage deals"],
  authors: [{ name: "BestPrices Team" }],
  creator: "BestPrices Team",
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
    title: "realpricedata.com - See the Real Value",
    description: "Compare Amazon products in your region by their true cost per liter, kilogram, or item. Find the best deals instantly.",
    siteName: "realpricedata.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "realpricedata.com - Find the best value by comparing price per unit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "realpricedata.com - See the Real Value",
    description: "Compare Amazon products in your region by their true cost per liter, kilogram, or item. Find the best deals instantly.",
    images: ["/og-image.png"],
    creator: "@bestprices",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "bestprices",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "msapplication-TileColor": "#3B82F6",
    "msapplication-config": "/browserconfig.xml",
    "color-scheme": "light dark",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <LazyCookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
