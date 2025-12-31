import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug, getChildCategories, type CategorySlug } from "@/lib/categories";
import { DEFAULT_COUNTRY, isValidCountryCode, type CountryCode } from "@/lib/countries";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { generateParentCategoryParams } from "@/lib/static-params";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    country: CountryCode;
    parent: CategorySlug;
  }>;
}

export async function generateStaticParams() {
  return generateParentCategoryParams();
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, parent: parentSlug } = await params;
  const validCountry = isValidCountryCode(country) ? country : DEFAULT_COUNTRY;
  const parentCategory = getCategoryBySlug(parentSlug);

  if (!parentCategory) {
    return {
      title: "Category Not Found",
    };
  }

  const canonicalUrl = `https://realpricedata.com/${validCountry.toLowerCase()}/${parentSlug.toLowerCase()}`;
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

export default async function ParentCategoryPage({ params }: Props) {
  const { country: countryCode, parent: parentSlug } = await params;

  // If country code is invalid (e.g. it's actually a parent category like "electronics"),
  // redirect to the default country URL
  if (!isValidCountryCode(countryCode)) {
    redirect(`/${DEFAULT_COUNTRY}/${countryCode}/${parentSlug}`);
  }

  const parentCategory = getCategoryBySlug(parentSlug);
  const childCategories = getChildCategories(parentSlug);

  if (!parentCategory) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="py-24 text-center">
          <h1 className="mb-4 text-4xl font-bold">Category Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The category you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href={`/${countryCode}`}>Browse All Categories</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ParentCategoryView
      parentCategory={JSON.parse(JSON.stringify(parentCategory))}
      childCategories={JSON.parse(JSON.stringify(childCategories))}
      countryCode={countryCode}
    />
  );
}
