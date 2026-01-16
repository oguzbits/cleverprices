import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import {
  getCategoryBySlug,
  getChildCategories,
  getBreadcrumbs,
  stripCategoryIcon,
  allCategories,
  type CategorySlug,
} from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import {
  getCategoryBestsellers,
  getCategoryNewProducts,
  getCategoryDeals,
} from "@/lib/data/parentCategoryData";
import {
  generateKeywords,
  getAlternateLanguages,
  getOpenGraph,
} from "@/lib/metadata";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    categorySlug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  return Object.values(allCategories)
    .filter((c) => !c.hidden)
    .map((c) => ({ categorySlug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const validCountry = DEFAULT_COUNTRY;
  const category = getCategoryBySlug(categorySlug);
  if (!category) return { title: "Kategorie nicht gefunden" };

  const canonicalUrl = `https://cleverprices.com/${category.slug}`;

  // German SEO-optimized title with low-competition keywords
  const unitSuffix = category.unitType
    ? ` - Preis pro ${category.unitType}`
    : "";
  const title = `${category.name} günstig kaufen${unitSuffix}`;

  // German description highlighting value proposition
  const description = category.unitType
    ? `${category.name} Preisvergleich: Finden Sie die günstigste ${category.name} nach Preis pro ${category.unitType}. Vergleichen Sie Top-Marken und sparen Sie bis zu 50%.`
    : `${category.name} Preisvergleich: Vergleichen Sie Preise von Top-Marken und finden Sie die besten Angebote in Deutschland.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(`/${categorySlug}`),
    },
    openGraph: getOpenGraph({
      title,
      description,
      url: canonicalUrl,
      locale: "de_DE",
    }),
    keywords: generateKeywords(category),
  };
}

export default async function DedicatedCategoryPage({
  params,
  searchParams,
}: Props) {
  const { categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) notFound();

  const childCategories = getChildCategories(categorySlug as CategorySlug);

  // If it's a hub (has children), show the parent view with product sections
  if (childCategories.length > 0) {
    const childCategories = getChildCategories(categorySlug as CategorySlug);

    // Fetch products for internal linking sections (in parallel)
    const [bestsellers, newProducts, deals] = await Promise.all([
      getCategoryBestsellers(categorySlug as CategorySlug, 12, DEFAULT_COUNTRY),
      getCategoryNewProducts(categorySlug as CategorySlug, 8, DEFAULT_COUNTRY),
      getCategoryDeals(categorySlug as CategorySlug, 8, DEFAULT_COUNTRY),
    ]);

    // Transform products to LeanProduct format for consistent card styling
    const transformProduct = (p: {
      title: string;
      slug: string;
      image?: string;
      brand: string;
      category: string;
      prices: Record<string, number>;
      rating?: number;
      reviewCount?: number;
      salesRank?: number;
      capacity?: number;
      capacityUnit?: string;
      formFactor?: string;
      listPrice?: Record<string, number>;
      savings?: number;
      pricePerUnit?: number;
      variationAttributes?: string;
    }) => ({
      slug: p.slug,
      title: p.title,
      image: p.image,
      price: p.prices[DEFAULT_COUNTRY] || 0,
      pricePerUnit: p.pricePerUnit,
      capacity: p.capacity,
      capacityUnit: p.capacityUnit,
      formFactor: p.formFactor,
      brand: p.brand,
      rating: p.rating,
      reviewCount: p.reviewCount,
      salesRank: p.salesRank,
      variationAttributes: p.variationAttributes,
      category: p.category,
      listPrice: p.listPrice?.[DEFAULT_COUNTRY],
      savings: p.savings,
    });

    // Build breadcrumbs for the parent view
    const breadcrumbItems = [
      { name: "Home", href: "/" },
      ...getBreadcrumbs(categorySlug as CategorySlug).map((crumb) => ({
        name: crumb.name,
        href: crumb.slug === categorySlug ? undefined : `/${crumb.slug}`,
      })),
    ];

    return (
      <ParentCategoryView
        parentCategory={stripCategoryIcon(category)}
        childCategories={childCategories.map(stripCategoryIcon)}
        bestsellers={bestsellers.map(transformProduct)}
        newProducts={newProducts.map(transformProduct)}
        deals={deals.map(transformProduct)}
        breadcrumbItems={breadcrumbItems}
      />
    );
  }

  // If it's a child category, show the NEW Idealo-style products view
  const filters = await searchParams;
  return (
    <IdealoCategoryPage
      category={stripCategoryIcon(category)}
      countryCode={DEFAULT_COUNTRY}
      searchParams={filters}
    />
  );
}
