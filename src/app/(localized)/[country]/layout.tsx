import { PageLayout } from "@/components/layout/PageLayout";
import { DEFAULT_COUNTRY, isValidCountryCode } from "@/lib/countries";
import { siteMetadata } from "@/lib/metadata";
import { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const isInternalCountry = isValidCountryCode(country);
  const countryCode = isInternalCountry
    ? country.toUpperCase()
    : DEFAULT_COUNTRY.toUpperCase();

  const locale = `en_${countryCode}`;

  return {
    ...siteMetadata,
    openGraph: {
      ...siteMetadata.openGraph,
      locale,
    },
  };
}

export default async function LocalizedLayout({ children, params }: Props) {
  const { country } = await params;
  const isInternalCountry = isValidCountryCode(country);
  const normalizedCountry = isInternalCountry ? country : DEFAULT_COUNTRY;

  return <PageLayout country={normalizedCountry}>{children}</PageLayout>;
}
