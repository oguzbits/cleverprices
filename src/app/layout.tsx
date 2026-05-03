import { Metadata, Viewport } from "next";

import RootLayoutWrapper from "@/app/RootLayoutWrapper";
import { siteMetadata } from "@/lib/metadata";

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#ffffff",
};

import { GlobalSchema } from "@/components/seo/GlobalSchema";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayoutWrapper lang="de">
      <GlobalSchema />
      {children}
    </RootLayoutWrapper>
  );
}
