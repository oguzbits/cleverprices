import "@/app/globals.css";

import { PromoBanner } from "@/components/layout/PromoBanner";
import { ThemeProvider } from "@/components/theme-provider";
import { NuqsProvider } from "@/providers/nuqs-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import * as React from "react";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export default function RootLayout({
  children,
  lang = "en",
}: {
  children: React.ReactNode;
  lang?: string;
}) {
  return (
    <html lang={lang} suppressHydrationWarning>
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
          <QueryProvider>
            <NuqsProvider>
              <div className="flex min-h-screen flex-col">
                <PromoBanner />
                {children}
              </div>
              <SpeedInsights />
              <Analytics />
            </NuqsProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
