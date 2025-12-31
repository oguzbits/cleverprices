import HomeContent from "@/components/HomeContent";
import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import { getCategoryBySlug, getChildCategories } from "@/lib/categories";
import {
  DEFAULT_COUNTRY,
  isValidCountryCode,
  type CountryCode,
} from "@/lib/countries";
import {
  getAlternateLanguages,
  getHomePageMetadata,
  getOpenGraph,
} from "@/lib/metadata";
import { generateCountryParams } from "@/lib/static-params";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ country: string }>;
};

export async function generateStaticParams() {
  return generateCountryParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;

  // If it's a valid country code (like 'uk', 'ca', etc.)
  if (isValidCountryCode(country)) {
    return getHomePageMetadata(country.toLowerCase());
  }

  // If it's a parent category slug (like 'electronics')
  const category = getCategoryBySlug(country);
  if (category && !category.parent) {
    const validCountry = DEFAULT_COUNTRY;
    const title = `${category.name} - Amazon ${validCountry.toUpperCase()}`;
    const description = `Track ${category.name} prices on Amazon ${validCountry.toUpperCase()} by true cost per TB/GB. Compare hardware value and find the best storage deals instantly.`;
    const canonicalUrl = `https://realpricedata.com/${category.slug}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: getAlternateLanguages(`/${category.slug}`),
      },
      openGraph: getOpenGraph({
        title,
        description,
        url: canonicalUrl,
        locale: `en_${validCountry.toUpperCase()}`,
      }),
    };
  }

  // Fallback
  return getHomePageMetadata(DEFAULT_COUNTRY);
}

export default async function CountryHomePage({ params }: Props) {
  const { country } = await params;

  // 1. Redirect /us to /
  if (country.toLowerCase() === "us") {
    redirect("/");
  }

  // 2. Handle valid country codes
  if (isValidCountryCode(country)) {
    return <HomeContent country={country.toLowerCase() as CountryCode} />;
  }

  // 3. Check if it's a parent category slug (e.g. /electronics)
  const category = getCategoryBySlug(country);
  if (category && !category.parent) {
    const childCategories = getChildCategories(category.slug);
    return (
      <ParentCategoryView
        parentCategory={JSON.parse(JSON.stringify(category))}
        childCategories={JSON.parse(JSON.stringify(childCategories))}
        countryCode={DEFAULT_COUNTRY}
      />
    );
  }

  // 4. Otherwise 404
  notFound();
}
