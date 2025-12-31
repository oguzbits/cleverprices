import { CategoryProductsView } from "@/components/category/CategoryProductsView.server";
import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import {
  getCategoryBySlug,
  getChildCategories,
  type CategorySlug,
} from "@/lib/categories";
import {
  DEFAULT_COUNTRY,
  isValidCountryCode,
  type CountryCode,
} from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { generateParentCategoryParams } from "@/lib/static-params";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{
    country: string;
    parent: string;
  }>;
}

export async function generateStaticParams() {
  return generateParentCategoryParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, parent: parentSlug } = await params;

  // Case 1: Valid country code (local or /us/ prefix)
  if (isValidCountryCode(country as string)) {
    const validCountry = country.toLowerCase() as CountryCode;
    const parentCategory = getCategoryBySlug(parentSlug);

    if (!parentCategory) return { title: "Category Not Found" };

    const canonicalUrl = `https://realpricedata.com/${validCountry !== "us" ? validCountry + "/" : ""}${parentSlug.toLowerCase()}`;
    const title = `${parentCategory.name} - Amazon ${validCountry.toUpperCase()}`;
    const description = `Track ${parentCategory.name} prices on Amazon ${validCountry.toUpperCase()} by true cost per TB/GB. Compare hardware value and find the best storage deals instantly.`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: getAlternateLanguages(`/${parentSlug.toLowerCase()}`),
      },
      openGraph: getOpenGraph({
        title,
        description,
        url: canonicalUrl,
        locale: `en_${validCountry.toUpperCase()}`,
      }),
    };
  }

  // Case 2: Country segment is actually a parent category (e.g. /electronics/hard-drives)
  const parentCategory = getCategoryBySlug(country as string);
  if (parentCategory && !parentCategory.parent) {
    const childCategory = getCategoryBySlug(parentSlug as string);
    if (
      childCategory &&
      (childCategory.parent as string) === (country as string)
    ) {
      // Rendering US child category metadata
      const validCountry = DEFAULT_COUNTRY;
      const title = `${childCategory.name} - Amazon ${validCountry.toUpperCase()}`;
      const description = `Compare ${childCategory.name} on Amazon ${validCountry.toUpperCase()} by true cost per TB/GB. Find the best value on storage and memory deals instantly.`;
      const canonicalUrl = `https://realpricedata.com/${parentCategory.slug}/${childCategory.slug}`;

      return {
        title,
        description,
        alternates: {
          canonical: canonicalUrl,
          languages: getAlternateLanguages(
            `/${parentCategory.slug}/${childCategory.slug}`,
          ),
        },
        openGraph: getOpenGraph({
          title,
          description,
          url: canonicalUrl,
          locale: `en_${validCountry.toUpperCase()}`,
        }),
      };
    }
  }

  return { title: "Category Not Found" };
}

export default async function ParentCategoryPage({ params }: Props) {
  const { country: countryCode, parent: parentSlug } = await params;

  // 1. If valid country code
  if (isValidCountryCode(countryCode)) {
    // Redirect /us/electronics to /electronics
    if (countryCode.toLowerCase() === "us") {
      redirect(`/${parentSlug}`);
    }

    const parentCategory = getCategoryBySlug(parentSlug);

    // If this is actually a child category (e.g. /uk/hard-drives), redirect to localized parent/child nested path
    if (parentCategory?.parent) {
      redirect(`/${countryCode}/${parentCategory.parent}/${parentSlug}`);
    }

    if (!parentCategory) {
      notFound();
    }

    const childCategories = getChildCategories(parentSlug as CategorySlug);

    return (
      <ParentCategoryView
        parentCategory={JSON.parse(JSON.stringify(parentCategory))}
        childCategories={JSON.parse(JSON.stringify(childCategories))}
        countryCode={countryCode as CountryCode}
      />
    );
  }

  // 2. If country code is actually a parent slug (e.g. /electronics/hard-drives)
  const parentCategory = getCategoryBySlug(countryCode as string);
  if (parentCategory && !parentCategory.parent) {
    const childCategory = getCategoryBySlug(parentSlug as string);
    if (
      childCategory &&
      (childCategory.parent as string) === (countryCode as string)
    ) {
      // Render as US Child Category
      return (
        <CategoryProductsView
          category={JSON.parse(JSON.stringify(childCategory))}
          countryCode={DEFAULT_COUNTRY}
          searchParams={{}}
        />
      );
    }
  }

  // 3. Otherwise 404
  notFound();
}
