import { BaseLayoutContent } from "@/components/layout/BaseLayoutContent";
import { siteMetadata } from "@/lib/metadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...siteMetadata,
  openGraph: {
    ...siteMetadata.openGraph,
    locale: "de_DE",
  },
};

export default function GermanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
      </head>
      <BaseLayoutContent>{children}</BaseLayoutContent>
    </html>
  );
}
