import HomeContent from "@/components/HomeContent";
import { DEFAULT_COUNTRY, getCountryByCode, type CountryCode } from "@/lib/countries";
import { getHomePageMetadata } from "@/lib/metadata";
import { generateCountryParams } from "@/lib/static-params";
import { Metadata } from "next";

type Props = {
  params: Promise<{ country: string }>;
};

export async function generateStaticParams() {
  return generateCountryParams();
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryConfig =
    getCountryByCode(country) || getCountryByCode(DEFAULT_COUNTRY);
  const countryCode = countryConfig?.code || DEFAULT_COUNTRY;

  return getHomePageMetadata(countryCode);
}

export default async function CountryHomePage({ params }: Props) {
  const { country } = await params;
  return <HomeContent country={(country || DEFAULT_COUNTRY).toLowerCase() as CountryCode} />;
}
