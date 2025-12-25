import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PromoBanner } from "@/components/layout/PromoBanner";
import { ScrollTracker } from "@/components/ScrollTracker";
import { ThemeProvider } from "@/components/theme-provider";
import { TimeTracker } from "@/components/TimeTracker";
import { NuqsProvider } from "@/providers/nuqs-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export function BaseLayoutContent({ children }: { children: React.ReactNode }) {
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
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>

          {/* Cookieless Analytics - No consent needed! */}
          <ScrollTracker />
          <TimeTracker />
          <SpeedInsights />
          <Analytics />
        </NuqsProvider>
      </ThemeProvider>
    </body>
  );
}
