import { AllCategoriesView } from "@/components/category/AllCategoriesView";
import { getCategoryHierarchy } from "@/lib/categories";
import { DEFAULT_COUNTRY, isValidCountryCode, type CountryCode } from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { generateCountryParams } from "@/lib/static-params";
import { Metadata } from "next";

interface Props {
  params: Promise<{
    country: string;
  }>;
}

export async function generateStaticParams() {
  return generateCountryParams();
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const validCountry = isValidCountryCode(country) ? country : DEFAULT_COUNTRY;

  const canonicalUrl = `https://realpricedata.com/${validCountry.toLowerCase()}/categories`;

  const title = `All Categories - Amazon ${validCountry.toUpperCase()}`;
  const description = `Browse all tracked product categories on Amazon ${validCountry.toUpperCase()}. Compare hardware prices by true cost per TB/GB to find the best value deals.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages("/categories"),
    },
    openGraph: getOpenGraph({
      title,
      description,
      url: canonicalUrl,
      locale: `en_${validCountry.toUpperCase()}`,
    }),
  };
}

export default async function CategoriesPage({ params }: Props) {
  const { country } = await params;
  const validCountry = isValidCountryCode(country) ? country : DEFAULT_COUNTRY;
  const hierarchyRaw = getCategoryHierarchy();
  const categoryHierarchy = JSON.parse(JSON.stringify(hierarchyRaw));

  return (
    <AllCategoriesView
      categoryHierarchy={categoryHierarchy}
      countryCode={validCountry as CountryCode}
    />
  );
}
