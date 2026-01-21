import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import {
  allCategories,
  getBreadcrumbs,
  getCategoryBySlug,
  getChildCategories,
  stripCategoryIcon,
  type CategorySlug,
} from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import {
  getCategoryBestsellers,
  getCategoryDeals,
  getCategoryNewProducts,
} from "@/lib/data/parentCategoryData";
import {
  generateKeywords,
  getAlternateLanguages,
  getOpenGraph,
} from "@/lib/metadata";
import { BRAND_DOMAIN } from "@/lib/site-config";
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
  const category = getCategoryBySlug(categorySlug);
  if (!category) return { title: "Kategorie nicht gefunden" };

  const canonicalUrl = `https://${BRAND_DOMAIN}/${category.slug}`;

  // SEO-optimized title: [Category] + [Value Prop] + Brand (Modern SEO skill: seo-02-title-tags)
  const unitSuffix = category.unitType
    ? ` - Preis pro ${category.unitType}`
    : "";
  const title = `${category.name}${unitSuffix} - CleverPrices`;

  // Action-oriented description (Modern SEO skill: seo-03-meta-descriptions)
  const description = category.unitType
    ? `Vergleichen Sie ${category.name} nach Preis pro ${category.unitType}. Finden Sie die günstigsten Angebote von Top-Marken und sparen Sie bis zu 50%.`
    : `Vergleichen Sie ${category.name} Preise von Top-Marken. Finden Sie die besten Angebote in Deutschland bei CleverPrices.`;

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
    // Prevent indexing of empty/hidden categories to avoid "Thin Content" marks from Google
    robots: category.hidden ? { index: false, follow: false } : undefined,
  };
}

export default async function DedicatedCategoryPage({
  params,
  searchParams,
}: Props) {
  const { categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) notFound();

  try {
    const childCategories = getChildCategories(categorySlug as CategorySlug);

    // If it's a hub (has children), show the parent view with product sections
    if (childCategories.length > 0) {
      // Fetch products for internal linking sections (in parallel)
      const [bestsellers, newProducts, deals] = await Promise.all([
        getCategoryBestsellers(
          categorySlug as CategorySlug,
          24,
          DEFAULT_COUNTRY,
        ),
        getCategoryNewProducts(
          categorySlug as CategorySlug,
          8,
          DEFAULT_COUNTRY,
        ),
        getCategoryDeals(categorySlug as CategorySlug, 8, DEFAULT_COUNTRY),
      ]).catch((err) => {
        console.error(
          `[DB Error] Parent category products ${categorySlug}:`,
          err,
        );
        return [[], [], []]; // Fallback to empty lists if DB fails
      });

      // Transform products to LeanProduct format for consistent card styling
      const transformProduct = (p: any) => ({
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
        monthlySold: p.monthlySold,
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
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_")) {
      throw error;
    }
    console.error(`[Page Error] Category ${categorySlug}:`, error);
    notFound();
  }
}
