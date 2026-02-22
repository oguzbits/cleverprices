import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import {
  allCategories,
  getBreadcrumbs,
  getCategoryBySlug,
  getChildCategories,
  stripCategoryIcon,
  type Category,
  type CategorySlug,
} from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { getParentCategoryData } from "@/lib/data/parentCategoryData";
import {
  generateKeywords,
  getAlternateLanguages,
  getOpenGraph,
} from "@/lib/metadata";
import { getNonEmptyCategorySlugs } from "@/lib/server/cached-products";
import { FilterParams } from "@/lib/server/category-products";
import { BRAND_DOMAIN } from "@/lib/site-config";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface Props {
  params: Promise<{
    categorySlug: string;
  }>;
  searchParams: Promise<FilterParams>;
}

// Generate static params for categories
// NOTE: During the build phase, the database is excluded to keep Docker images thin.
// We pre-render the top 50 most popular categories to ensure instant TTFB/FCP for 80% of users.
export async function generateStaticParams() {
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";

  if (isBuild) {
    // These categories will be pre-rendered during build.
    // They will serve the static Shell immediately, and stream results via PPR.
    const topCategories = [
      "smartphones",
      "notebooks",
      "tablets",
      "tvs",
      "headphones",
      "gpu",
      "ram",
      "ssds",
      "consoles",
      "elektroartikel",
      "computer",
      "telekommunikation",
      "haushaltselektronik",
      "smartwatches",
      "pc-komponenten",
    ].map((slug) => ({ categorySlug: slug }));

    return [...topCategories, { categorySlug: "build-time-placeholder" }];
  }

  const nonEmptySlugs = await getNonEmptyCategorySlugs();

  // Next.js 16 requirement: return at least one result
  if (
    nonEmptySlugs.length === 1 &&
    nonEmptySlugs[0] === "build-time-placeholder"
  ) {
    return [{ categorySlug: "build-time-placeholder" }];
  }

  const categories = Object.values(allCategories).filter((c) => !c.hidden);

  // Generates all non-empty categories
  return categories
    .filter((c) => {
      const children = getChildCategories(c.slug);
      if (children.length > 0) {
        // Parent: include if any child is non-empty
        return children.some((child) => nonEmptySlugs.includes(child.slug));
      }
      // Child: include if non-empty
      return nonEmptySlugs.includes(c.slug);
    })
    .map((c) => ({ categorySlug: c.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";

  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) {
    return {
      title: "Kategorie nicht gefunden",
      robots: { index: false, follow: false },
    };
  }

  if (isBuild) {
    return { title: `${category.name} | ${BRAND_DOMAIN}` };
  }
  // No searchParams access here to keep the route prerenderable for base URLs

  // 1. Check if category is hidden
  if (category.hidden) {
    return { title: category.name, robots: { index: false, follow: false } };
  }

  // 2. Check if category is empty to set noindex (prevent Soft 404s)
  const nonEmptySlugs = await getNonEmptyCategorySlugs();
  const children = getChildCategories(categorySlug as CategorySlug);
  const isEmpty =
    children.length > 0
      ? !children.some((child) => nonEmptySlugs.includes(child.slug))
      : !nonEmptySlugs.includes(categorySlug);

  // If empty, set noindex to prevent Soft 404s
  if (isEmpty) {
    return {
      title: `${category.name} - Keine Ergebnisse | ${BRAND_DOMAIN}`,
      robots: { index: false, follow: true },
    };
  }

  // If heavy filters are active, we might also want to noindex to prevent crawl waste,
  // but for now let's focus on the Soft 404 (0 results) case.

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

  if (categorySlug === "build-time-placeholder") {
    return null;
  }

  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  // The "Shell": Immediate rendering of the background and basic structural container.
  // This ensures the URL updates instantly and avoids the "frozen" UI feeling.
  // Using bg-secondary to match child category pages, or bg-white for parents.
  // (IdealoCategoryPage uses bg-secondary)
  return (
    <div className="bg-secondary min-h-screen">
      <Suspense fallback={null}>
        <CategoryPageContent
          categorySlug={categorySlug as CategorySlug}
          category={category}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

async function CategoryPageContent({
  categorySlug,
  category,
  searchParams,
}: {
  categorySlug: CategorySlug;
  category: Category;
  searchParams: Promise<FilterParams>;
}) {
  // Check if category is empty to avoid showing empty results pages
  const nonEmptySlugs = await getNonEmptyCategorySlugs();
  const children = getChildCategories(categorySlug);
  const isEmpty =
    children.length > 0
      ? !children.some((child) => nonEmptySlugs.includes(child.slug))
      : !nonEmptySlugs.includes(categorySlug);

  if (isEmpty) notFound();

  const childCategories = children;
  let showNotFound = false;

  // Data for the hub view
  let hubData: {
    bestsellers: any[];
    newProducts: any[];
    deals: any[];
    breadcrumbItems: any[];
  } | null = null;

  if (childCategories.length > 0) {
    try {
      // Fetch products for internal linking sections (Optimized single round trip)
      const { bestsellers, newProducts, deals } = await getParentCategoryData(
        categorySlug,
        DEFAULT_COUNTRY,
      ).catch(() => ({ bestsellers: [], newProducts: [], deals: [] }));

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
        ...getBreadcrumbs(categorySlug).map((crumb) => ({
          name: crumb.name,
          href: crumb.slug === categorySlug ? undefined : `/${crumb.slug}`,
        })),
      ];

      hubData = {
        bestsellers: bestsellers.map(transformProduct),
        newProducts: newProducts.map(transformProduct),
        deals: deals.map(transformProduct),
        breadcrumbItems,
      };
    } catch (error: any) {
      if (
        error?.digest?.startsWith("NEXT_") ||
        error?.digest === "HANGING_PROMISE_REJECTION" ||
        error?.message?.includes("searchParams") ||
        error?.message?.includes("notFound")
      ) {
        throw error;
      }
      console.error(`[Page Error] Category ${categorySlug}:`, error);
      showNotFound = true;
    }
  }

  if (showNotFound) {
    notFound();
  }

  // If it's a hub (has children), show the parent view with product sections
  if (hubData) {
    return (
      <ParentCategoryView
        parentCategory={stripCategoryIcon(category)}
        childCategories={childCategories.map(stripCategoryIcon)}
        bestsellers={hubData.bestsellers}
        newProducts={hubData.newProducts}
        deals={hubData.deals}
        breadcrumbItems={hubData.breadcrumbItems}
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
