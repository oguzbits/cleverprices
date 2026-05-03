import { Metadata, Viewport } from "next";

import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getHomePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = getHomePageMetadata(DEFAULT_COUNTRY);

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Landing page layout - just passes through children
// Navbar/Footer are handled by the root layout
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
