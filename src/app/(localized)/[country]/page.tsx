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

  return {
    title: `Amazon ${code} Unit Price Tracker & Deals | realpricedata.com`,
    description: `Compare Amazon ${name} products by true cost per unit. Find the best storage deals and hardware savings in ${name} with our real price tracker.`,
    alternates: {
      canonical: `https://realpricedata.com/${country.toLowerCase()}`,
      languages: getAlternateLanguages(),
    },
  };
}

export default async function CountryHomePage({ params }: Props) {
  const { country } = await params;
  return <HomeContent country={(country || DEFAULT_COUNTRY).toLowerCase()} />;
}
