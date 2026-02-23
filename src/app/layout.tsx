import RootLayoutWrapper from "@/app/RootLayoutWrapper";
import { Suspense } from "react";

import { siteMetadata } from "@/lib/metadata";
import { Metadata, Viewport } from "next";

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
      <Suspense fallback={null}>
        <GlobalSchema />
      </Suspense>
      <Suspense fallback={null}>{children}</Suspense>
    </RootLayoutWrapper>
  );
}
