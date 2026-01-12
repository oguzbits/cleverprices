import "@/app/globals.css";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { NuqsProvider } from "@/providers/nuqs-provider";
import { QueryProvider } from "@/providers/query-provider";
import { cn } from "@/lib/utils";
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

interface RootLayoutProps {
  children: React.ReactNode;
  lang?: string;
  hideNavbar?: boolean;
  hideFooter?: boolean;
}

export default function RootLayoutWrapper({
  children,
  lang = "de",
  hideNavbar = false,
  hideFooter = false,
}: RootLayoutProps) {
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
      </head>
      <body
        className={cn(
          inter.variable,
          inter.className,
          "bg-background min-h-screen antialiased",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <NuqsProvider>
              <div className="flex min-h-screen flex-col">
                {!hideNavbar && <Navbar />}
                <main className="flex-1">{children}</main>
                {!hideFooter && <Footer />}
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
