import RootLayoutWrapper from "@/app/RootLayoutWrapper";
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

// Root layout - minimal wrapper, individual pages/route groups control their own navbar/footer
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayoutWrapper lang="de">{children}</RootLayoutWrapper>;
}
