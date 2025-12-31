import "@/app/globals.css";
import { PromoBanner } from "@/components/layout/PromoBanner";
import { ThemeProvider } from "@/components/theme-provider";
import { NuqsProvider } from "@/providers/nuqs-provider";
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

interface BaseLayoutProps {
  children: React.ReactNode;
  lang?: string;
}

export function BaseLayout({ children, lang = "en" }: BaseLayoutProps) {
  return (
    <html lang={lang} suppressHydrationWarning>
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
