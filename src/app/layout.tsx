import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://bestprices.today'),
  title: {
    default: "bestprices.today - Compare Price Per Unit",
    template: "%s | bestprices.today",
  },
  description: "Find the best value by comparing price per unit across thousands of products. We track millions of products to find you the absolute best deals on HDDs, SSDs, and more.",
  keywords: ["price comparison", "price per unit", "best deals", "HDD prices", "SSD prices", "storage deals"],
  authors: [{ name: "BestPrices Team" }],
  creator: "BestPrices Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bestprices.today",
    title: "bestprices.today - Compare Price Per Unit",
    description: "Stop overpaying. Compare price per unit for HDDs, SSDs, and more.",
    siteName: "bestprices.today",
    images: [
      {
        url: "/og-image.png", // We should ideally create this image
        width: 1200,
        height: 630,
        alt: "bestprices.today Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "bestprices.today - Compare Price Per Unit",
    description: "Stop overpaying. Compare price per unit for HDDs, SSDs, and more.",
    images: ["/og-image.png"],
    creator: "@bestprices",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
