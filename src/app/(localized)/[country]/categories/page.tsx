import { AllCategoriesView } from "@/components/category/AllCategoriesView";
import { getCategoryHierarchy } from "@/lib/categories";
import {
  DEFAULT_COUNTRY,
  isValidCountryCode,
  type CountryCode,
} from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { generateCountryParams } from "@/lib/static-params";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

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
  const isUS = country.toLowerCase() === "us";
  const validCountry = isValidCountryCode(country)
    ? (country.toLowerCase() as CountryCode)
    : DEFAULT_COUNTRY;

  const canonicalUrl = isUS
    ? "https://realpricedata.com/categories"
    : `https://realpricedata.com/${validCountry}/categories`;

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

  if (country.toLowerCase() === "us") {
    redirect("/categories");
  }

  if (!isValidCountryCode(country)) {
    notFound();
  }

  const hierarchyRaw = getCategoryHierarchy();
  const categoryHierarchy = JSON.parse(JSON.stringify(hierarchyRaw));

  return (
    <AllCategoriesView
      categoryHierarchy={categoryHierarchy}
      countryCode={country.toLowerCase() as CountryCode}
    />
  );
}
