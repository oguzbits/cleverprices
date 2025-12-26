import { CategoryProductsView } from "@/components/category/CategoryProductsView";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug } from "@/lib/categories";
import { DEFAULT_COUNTRY, isValidCountryCode } from "@/lib/countries";
import { getAlternateLanguages, generateKeywords } from "@/lib/metadata";
import { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{
    country: string;
    parent: string;
    category: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, parent, category: categorySlug } = await params;
  const validCountry = isValidCountryCode(country) ? country : DEFAULT_COUNTRY;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  const canonicalUrl = `https://realpricedata.com/${validCountry.toLowerCase()}/${parent.toLowerCase()}/${categorySlug.toLowerCase()}`;

  return {
    title: `${category.name} Unit Price Tracker (${validCountry.toUpperCase()}) | realpricedata.com`,
    description: `Compare ${category.name} on Amazon ${validCountry.toUpperCase()} by true cost per TB/GB. Find the best value on storage and memory deals instantly.`,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(
        `/${parent.toLowerCase()}/${categorySlug.toLowerCase()}`
      ),
    },
    keywords: generateKeywords(category),
  };
}

export default async function CategoryProductsPage({ params }: Props) {
  const { country, category: categorySlug } = await params;
  const validCountry = isValidCountryCode(country) ? country : DEFAULT_COUNTRY;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="py-24">
          <h1 className="mb-4 text-4xl font-bold">Category Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The category you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href={`/${validCountry}`}>Browse All Categories</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CategoryProductsView
      category={JSON.parse(JSON.stringify(category))}
      countryCode={validCountry}
    />
  );
}
