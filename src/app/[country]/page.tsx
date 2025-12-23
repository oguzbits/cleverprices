import HomeContent from "@/components/HomeContent";
import { getCountryByCode, DEFAULT_COUNTRY } from "@/lib/countries";
import { Metadata } from "next";

type Props = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryConfig = getCountryByCode(country) || getCountryByCode(DEFAULT_COUNTRY);
  const name = countryConfig?.name || "Global";
  const code = (countryConfig?.code || country || "US").toUpperCase();
  const domain = countryConfig?.domain || "amazon.com";

  return {
    title: `Amazon ${code} Price Per Unit Tracker & Storage Deals | realpricedata.com`,
    description: `Compare Amazon ${name} (${domain}) products by their true cost per TB, GB, or unit. Find the best storage deals and hardware savings in ${name} instantly.`,
    alternates: {
      canonical: `https://realpricedata.com/${country.toLowerCase()}`,
      languages: {
        'en-US': 'https://realpricedata.com/us',
        'de-DE': 'https://realpricedata.com/de',
        'en-GB': 'https://realpricedata.com/uk',
      }
    }
  };
}

export default async function CountryHomePage({ params }: Props) {
  const { country } = await params;
  return <HomeContent country={(country || DEFAULT_COUNTRY).toLowerCase()} />;
}
