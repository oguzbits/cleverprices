import "@/app/globals.css";

import { PromoBanner } from "@/components/layout/PromoBanner";
import { ThemeProvider } from "@/components/theme-provider";
import { siteMetadata } from "@/lib/metadata";
import { NuqsProvider } from "@/providers/nuqs-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import * as React from "react";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
      </head>
      <body
        className={`${inter.variable} ${inter.className} bg-background min-h-screen antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsProvider>
            <div className="flex min-h-screen flex-col">
              <PromoBanner />
              {children}
            </div>
            <SpeedInsights />
            <Analytics />
          </NuqsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
