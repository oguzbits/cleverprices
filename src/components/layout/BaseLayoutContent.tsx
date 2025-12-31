import "@/app/globals.css";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PromoBanner } from "@/components/layout/PromoBanner";
import { ThemeProvider } from "@/components/theme-provider";
import { type CountryCode } from "@/lib/countries";
import { NuqsProvider } from "@/providers/nuqs-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export function BaseLayoutContent({ 
  children, 
  country 
}: { 
  children: React.ReactNode;
  country?: CountryCode;
}) {
  return (
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
            <Navbar country={country} />
            <main className="flex-1">{children}</main>
            <Footer country={country} />
          </div>

          {/* Vercel Analytics - Page views only (custom events not enabled) */}
          <SpeedInsights />
          <Analytics />
        </NuqsProvider>
      </ThemeProvider>
    </body>
  );
}
