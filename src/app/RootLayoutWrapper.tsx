import "@/app/globals.css";

import { Inter } from "next/font/google";
import Script from "next/script";
import * as React from "react";

import { BfcacheRecovery } from "@/components/layout/BfcacheRecovery";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
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
    <html
      lang={lang}
      suppressHydrationWarning
      data-build-id={process.env.NEXT_PUBLIC_BUILD_ID || "dev-hash"}
    >
      <head>
        <Script
          id="search-trigger-capture"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.triggerSearch = function() {
                window.__searchPending = true;
              };
            `,
          }}
        />
        <link
          rel="preconnect"
          href="https://m.media-amazon.com"
          crossOrigin=""
        />
      </head>
      <body
        className={cn(inter.variable, "bg-background min-h-screen antialiased")}
      >
        <div className="flex min-h-screen flex-col">
          <div className="relative z-[100] border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-center text-xs font-medium text-amber-800 dark:text-amber-300">
            ⚠️ <strong>Demonstrationsmodus:</strong> Die Preise sind nicht
            aktuell (historische Daten). Diese Webseite dient ausschließlich
            Vorführungszwecken. / <strong>Demo Mode:</strong> Prices are
            historical and not live. This website is for demonstration purposes
            only.
          </div>
          <BfcacheRecovery />
          {!hideNavbar && <Navbar />}
          <main className="flex-1">{children}</main>
          {!hideFooter && <Footer />}
        </div>
      </body>
    </html>
  );
}
