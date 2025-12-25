import { AllCategoriesView } from "@/components/category/AllCategoriesView";
import { getCategoryHierarchy } from "@/lib/categories";
import { DEFAULT_COUNTRY, isValidCountryCode } from "@/lib/countries";
import { getAlternateLanguages } from "@/lib/metadata";
import { Metadata } from "next";

interface Props {
  params: Promise<{
    country: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const validCountry = isValidCountryCode(country) ? country : DEFAULT_COUNTRY;

  const canonicalUrl = `https://realpricedata.com/${validCountry.toLowerCase()}/categories`;

  return {
    title: `All Product Categories - Amazon ${validCountry.toUpperCase()} | realpricedata.com`,
    description: `Browse all tracked product categories on Amazon ${validCountry.toUpperCase()}. Compare HDD, SSD, RAM and more by price per unit.`,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages("/categories"),
    },
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
      countryCode={validCountry}
    />
  );
}
