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
          id="search-trigger-capture"
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
              --idealo-blue: #0771d0;
            }
            body { background: #ffffff; margin: 0; padding: 0; }
            /* Critical LCP Shell Styles */
            .cn-productCarousel { min-height: 400px; }
            .group.relative.flex.flex-col { background: #fff; border: 1px solid #d4d4d8; border-radius: 6px; }
            .mb-3.bg-gray-100 { background-color: #f3f4f6; }
            .flex.gap-4 { display: flex; gap: 1rem; }
            header { background: #18181b; height: 80px; }
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
