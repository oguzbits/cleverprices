import { CategoryProductsView } from "@/components/category/CategoryProductsView.server";
import { getCategoryBySlug, getCategoryPath } from "@/lib/categories";
import {
  DEFAULT_COUNTRY,
  isValidCountryCode,
  type CountryCode,
} from "@/lib/countries";
import {
  generateKeywords,
  getAlternateLanguages,
  getOpenGraph,
} from "@/lib/metadata";
import { generateCategoryProductParams } from "@/lib/static-params";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{
    country: string;
    parent: string;
    category: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  return generateCategoryProductParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, parent, category: categorySlug } = await params;
  const validCountry = isValidCountryCode(country)
    ? (country.toLowerCase() as CountryCode)
    : DEFAULT_COUNTRY;
  const category = getCategoryBySlug(categorySlug);

  if (!category) return { title: "Category Not Found" };

  // Use the new getCategoryPath which handles root domain for US
  const canonicalUrl = `https://realpricedata.com${getCategoryPath(category.slug, validCountry)}`;
  const title = `${category.name} - Amazon ${validCountry.toUpperCase()}`;
  const description = `Compare ${category.name} on Amazon ${validCountry.toUpperCase()} by true cost per TB/GB. Find the best value on storage and memory deals instantly.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(
        `/${parent.toLowerCase()}/${categorySlug.toLowerCase()}`,
      ),
    },
    openGraph: getOpenGraph({
      title,
      description,
      url: canonicalUrl,
      locale: `en_${validCountry.toUpperCase()}`,
    }),
    keywords: generateKeywords(category),
  };
}

export default async function CategoryProductsPage({
  params,
  searchParams,
}: Props) {
  const { country, parent, category: categorySlug } = await params;
  const filters = await searchParams;

  // 1. Redirect /us/electronics/hard-drives to /electronics/hard-drives
  if (country.toLowerCase() === "us") {
    redirect(`/${parent}/${categorySlug}`);
  }

  // 2. Handle valid country codes
  if (isValidCountryCode(country)) {
    const category = getCategoryBySlug(categorySlug);
    if (!category) notFound();

    return (
      <CategoryProductsView
        category={JSON.parse(JSON.stringify(category))}
        countryCode={country.toLowerCase() as CountryCode}
        searchParams={filters}
      />
    );
  }

  // 3. Otherwise 404
  notFound();
}
