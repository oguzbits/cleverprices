import { BaseLayoutContent } from "@/components/layout/BaseLayoutContent";
import { getCountryByCode } from "@/lib/countries";
import { siteMetadata } from "@/lib/metadata";
import { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryConfig = getCountryByCode(country);
  const locale = `en_${countryConfig?.code.toUpperCase() || "US"}`;

  return {
    ...siteMetadata,
    openGraph: {
      ...siteMetadata.openGraph,
      locale,
    },
  };
}

export default async function LocalizedLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
      </head>
      <BaseLayoutContent>{children}</BaseLayoutContent>
    </html>
  );
}
