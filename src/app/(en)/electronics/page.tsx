import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import {
  getCategoryBySlug,
  getChildCategories,
  type CategorySlug,
} from "@/lib/categories";
import { DEFAULT_COUNTRY, type CountryCode } from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const PARENT_SLUG: CategorySlug = "electronics";

export async function generateMetadata(): Promise<Metadata> {
  const parentCategory = getCategoryBySlug(PARENT_SLUG);

  if (!parentCategory) return { title: "Category Not Found" };

  const canonicalUrl = `https://realpricedata.com/${PARENT_SLUG}`;
  const title = `${parentCategory.name} - Amazon ${DEFAULT_COUNTRY.toUpperCase()}`;
  const description = `Track ${parentCategory.name} prices on Amazon ${DEFAULT_COUNTRY.toUpperCase()} by true cost per TB/GB. Compare hardware value and find the best storage deals instantly.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(`/${PARENT_SLUG}`),
    },
    openGraph: getOpenGraph({
      title,
      description,
      url: canonicalUrl,
      locale: `en_${DEFAULT_COUNTRY.toUpperCase()}`,
    }),
  };
}

export default function ElectronicsPage() {
  const parentCategory = getCategoryBySlug(PARENT_SLUG);

  if (!parentCategory) {
    notFound();
  }

  const childCategories = getChildCategories(PARENT_SLUG);

  return (
    <ParentCategoryView
      parentCategory={JSON.parse(JSON.stringify(parentCategory))}
      childCategories={JSON.parse(JSON.stringify(childCategories))}
      countryCode={DEFAULT_COUNTRY as CountryCode}
    />
  );
}
