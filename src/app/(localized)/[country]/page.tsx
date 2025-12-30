import HomeContent from "@/components/HomeContent";
import { getCountryByCode, DEFAULT_COUNTRY } from "@/lib/countries";
import { getHomePageMetadata } from "@/lib/metadata";
import { Metadata } from "next";

type Props = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryConfig =
    getCountryByCode(country) || getCountryByCode(DEFAULT_COUNTRY);
  const countryCode = countryConfig?.code || DEFAULT_COUNTRY;
  const countryName = countryConfig?.name || "Global";

  return getHomePageMetadata(countryCode, countryName);
}

export default async function CountryHomePage({ params }: Props) {
  const { country } = await params;
  return <HomeContent country={(country || DEFAULT_COUNTRY).toLowerCase()} />;
}
