import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug, getChildCategories } from "@/lib/categories";
import { DEFAULT_COUNTRY, isValidCountryCode } from "@/lib/countries";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    country: string;
    parent: string;
  }>;
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

  return {
    title: `${parentCategory.name} Price Comparison & Deals (${validCountry.toUpperCase()}) | realpricedata.com`,
    description: `Explore ${parentCategory.name} categories on Amazon ${validCountry.toUpperCase()}. Find the best value on hardware with our price per unit comparison.`,
    alternates: {
      canonical: canonicalUrl,
    },
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
