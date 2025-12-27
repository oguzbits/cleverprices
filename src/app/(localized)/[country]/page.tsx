import HomeContent from "@/components/HomeContent";
import { getCountryByCode, DEFAULT_COUNTRY } from "@/lib/countries";
import { getAlternateLanguages } from "@/lib/metadata";
import { Metadata } from "next";

type Props = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryConfig =
    getCountryByCode(country) || getCountryByCode(DEFAULT_COUNTRY);
  const name = countryConfig?.name || "Global";
  const code = (countryConfig?.code || country || "US").toUpperCase();
  const domain = countryConfig?.domain || "amazon.com";

  const canonicalUrl =
    country.toLowerCase() === DEFAULT_COUNTRY
      ? "https://realpricedata.com"
      : `https://realpricedata.com/${country.toLowerCase()}`;

  return {
    title: `Price Tracker - Amazon ${code}`,
    description: `Amazon ${code} price tracker for hardware & storage. Compare HDD, SSD, RAM and more by true cost per TB/GB. Find the best value hardware deals instantly.`,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(""),
    },
    openGraph: {
      url: canonicalUrl,
    },
  };
}

export default async function CountryHomePage({ params }: Props) {
  const { country } = await params;
  return <HomeContent country={(country || DEFAULT_COUNTRY).toLowerCase()} />;
}
