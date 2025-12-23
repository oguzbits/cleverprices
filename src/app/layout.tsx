import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PromoBanner } from "@/components/layout/PromoBanner";
import { ScrollTracker } from "@/components/ScrollTracker";
import { ThemeProvider } from "@/components/theme-provider";
import { TimeTracker } from "@/components/TimeTracker";
import { NuqsProvider } from "@/providers/nuqs-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://realpricedata.com'),
  title: {
    default: "Amazon Germany (DE) Price Per Unit Tracker, Storage Deals & True Value | realpricedata.com",
    template: "%s | realpricedata.com",
  },
  description: "Amazon Germany (DE) price per unit tracker and value calculator. Compare HDD, SSD, and RAM prices by their true cost (EUR/TB). Find the best storage deals and Amazon.de savings instantly.",
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
    "price drop tracker"
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
    title: "realpricedata.com - Amazon Germany (DE) Price Per Unit Tracker",
    description: "Compare Amazon.de products by their true cost per TB, GB, or unit. Find the best storage deals and hardware savings in Germany instantly.",
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
    title: "realpricedata.com - Amazon Germany (DE) Price Per Unit Tracker",
    description: "Compare Amazon.de products by their true cost per TB, GB, or unit. Find the best storage deals and hardware savings in Germany instantly.",
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
      <head>
        <link rel="preconnect" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
      </head>
      <body className={`${inter.variable} ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsProvider>
            <div className="flex min-h-screen flex-col">
              <PromoBanner />
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            
            {/* Cookieless Analytics - No consent needed! */}
            <ScrollTracker />
            <TimeTracker />
            <SpeedInsights />
            <Analytics />
          </NuqsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
