import "@/app/globals.css";

import { BfcacheRecovery } from "@/components/layout/BfcacheRecovery";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
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
        <script
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
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link
          rel="preconnect"
          href="https://images-na.ssl-images-amazon.com"
          crossOrigin=""
        />
        <link
          rel="dns-prefetch"
          href="https://images-na.ssl-images-amazon.com"
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
