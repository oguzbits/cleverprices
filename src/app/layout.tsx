import "@/app/globals.css";
import { PromoBanner } from "@/components/layout/PromoBanner";
import { ThemeProvider } from "@/components/theme-provider";
import { NuqsProvider } from "@/providers/nuqs-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { siteMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export const metadata: Metadata = siteMetadata;

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
