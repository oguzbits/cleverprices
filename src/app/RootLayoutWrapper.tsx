import "@/app/globals.css";

import { BfcacheRecovery } from "@/components/layout/BfcacheRecovery";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import Script from "next/script";
import * as React from "react";

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
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/*
          Hydration Barrier Script:
          Ensures that if a user clicks a "Search" button before the dynamic
          SearchManager has hydrated, the intent is captured and set as a flag.
          Without this, the first click on mobile during loading would be "swallowed".
        */}
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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root {
              --background: #ffffff;
              --header-bg: #18181b;
              --idealo-text-primary: #2d2d2d;
            }
            body { background: #ffffff; margin: 0; }
          `,
          }}
        />
      </head>
      <body
        className={cn(inter.variable, "bg-background min-h-screen antialiased")}
      >
        <div className="flex min-h-screen flex-col">
          <BfcacheRecovery />
          {!hideNavbar && <Navbar />}
          <main className="flex-1">{children}</main>
          {!hideFooter && <Footer />}
        </div>
      </body>
    </html>
  );
}
