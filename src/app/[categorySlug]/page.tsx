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

  // SEO-optimized title: [Category] + [Value Prop] + Brand
  const unitSuffix = category.unitType
    ? ` - Günstigster Preis pro ${category.unitType}`
    : " - Günstig kaufen & sparen";
  const title = `${category.name}${unitSuffix} | ${BRAND_DOMAIN}`;

  // Action-oriented description (Modern SEO skill: seo-03-meta-descriptions)
  const description = category.unitType
    ? `Hardware-Preisvergleich: Vergleichen Sie ${category.name} nach Preis pro ${category.unitType}. Finden Sie die besten Angebote in Deutschland und sparen Sie beim Hardware-Kauf.`
    : `Vergleichen Sie Preise für ${category.name} von Top-Marken. Finden Sie jetzt die günstigsten Hardware-Angebote bei ${BRAND_DOMAIN}.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(`/${categorySlug}`),
    },
    openGraph: getOpenGraph({
      title: `${category.name} Preisvergleich | ${BRAND_DOMAIN}`,
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
      // Fetch products for internal linking sections (Sequentially to allow for exclusion)
      const bestsellers = await getCategoryBestsellers(
        categorySlug as CategorySlug,
        24,
        DEFAULT_COUNTRY,
      ).catch(() => []);

      const excludeForNew = bestsellers.map((p: any) => p.id).filter(Boolean);
      const newProducts = await getCategoryNewProducts(
        categorySlug as CategorySlug,
        8,
        DEFAULT_COUNTRY,
        2,
        excludeForNew,
      ).catch(() => []);

      const excludeForDeals = [
        ...excludeForNew,
        ...newProducts.map((p: any) => p.id).filter(Boolean),
      ];
      const deals = await getCategoryDeals(
        categorySlug as CategorySlug,
        8,
        DEFAULT_COUNTRY,
        2,
        excludeForDeals,
      ).catch(() => []);

      // Transform products to LeanProduct format for consistent card styling
      const transformProduct = (p: any) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
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
    if (
      error?.digest?.startsWith("NEXT_") ||
      error?.digest === "HANGING_PROMISE_REJECTION" ||
      error?.message?.includes("searchParams")
    ) {
      throw error;
    }
    console.error(`[Page Error] Category ${categorySlug}:`, error);
    notFound();
  }
}
