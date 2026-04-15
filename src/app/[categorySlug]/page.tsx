import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import {
  allCategories,
  getBreadcrumbs,
  getCategoryBySlug,
  getChildCategories,
  isCategoryNotEmptyRecursive,
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
  truncateTitle,
} from "@/lib/metadata";
import { type FilterParams } from "@/lib/product-definitions";
import { getNonEmptyCategorySlugs } from "@/lib/server/cached-products";
import { BRAND_DOMAIN, SITE_URL } from "@/lib/site-config";
import { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

interface Props {
  params: Promise<{
    categorySlug: string;
  }>;
  searchParams: Promise<FilterParams>;
}

// Generate static params for categories
// NOTE: During the build phase, the database is excluded to keep Docker images thin.
export async function generateStaticParams() {
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILD_PHASE === "1";

  if (isBuild) {
    // Explicitly return a placeholder during build to avoid DB warnings and keep build fast.
    return [{ categorySlug: "build-time-placeholder" }];
  }

  const nonEmptySlugs = await getNonEmptyCategorySlugs();

  const categories = Object.values(allCategories).filter((c) => !c.hidden);

  // Generates alert non-empty categories at runtime
  return categories
    .filter((c) => isCategoryNotEmptyRecursive(c.slug, nonEmptySlugs))
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

  const filters = await searchParams;
  const canonicalUrl = `${SITE_URL}/${category.slug}`;

  // 1. Check if category is hidden
  if (category.hidden) {
    return { title: category.name, robots: { index: false, follow: false } };
  }

  // 2. Check if category is empty to set noindex (prevent Soft 404s)
  const nonEmptySlugs = await getNonEmptyCategorySlugs();
  const isEmpty = !isCategoryNotEmptyRecursive(
    categorySlug as CategorySlug,
    nonEmptySlugs,
  );

  // If empty, set noindex to prevent Soft 404s
  if (isEmpty) {
    return {
      title: `${category.name} - Keine Ergebnisse | ${BRAND_DOMAIN}`,
      robots: { index: false, follow: true },
    };
  }

  // 3. Check for specific filters (Crawl Waste Prevention)
  // If we have brand or other specific filters, we noindex them to focus budget on the main category.
  const hasFilters =
    filters &&
    (filters.brand || filters.technology || filters.condition || filters.sort);
  if (hasFilters) {
    return {
      title: `${category.name} Angebote | ${BRAND_DOMAIN}`,
      alternates: { canonical: canonicalUrl },
      robots: { index: false, follow: true },
    };
  }

  // SEO-optimized title: [Category] | Preisvergleich | Brand
  const baseTitle = `${category.name} | Preisvergleich`;
  const title = truncateTitle(baseTitle, 60) + ` | ${BRAND_DOMAIN}`;

  // Action-oriented description
  const description = category.unitType
    ? `${category.name} Preisvergleich. Beste Angebote nach Preis pro ${category.unitType} filtern & in Deutschland sparen bei ${BRAND_DOMAIN}.`
    : `Günstige ${category.name} von Top-Marken im Preisvergleich. Jetzt Hardware-Angebote finden & sparen bei ${BRAND_DOMAIN}.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(`/${category.slug}`),
    },
    openGraph: getOpenGraph({
      title: `${category.name} Preisvergleich | ${BRAND_DOMAIN}`,
      description,
      url: canonicalUrl,
      locale: "de_DE",
    }),
    keywords: generateKeywords(category),
    // Prevent indexing of empty/hidden categories to avoid "Thin Content" marks from Google
    robots:
      category.hidden || isEmpty ? { index: false, follow: false } : undefined,
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

  return (
    <DedicatedCategoryContent
      categorySlug={categorySlug as CategorySlug}
      searchParams={searchParams}
    />
  );
}

async function DedicatedCategoryContent({
  categorySlug,
  searchParams,
}: {
  categorySlug: CategorySlug;
  searchParams: Promise<FilterParams>;
}) {
  "use cache";
  cacheLife("category");
  const _v = "v208"; // Bust RSC cache when identity/slug logic changes

  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  // Redirect to canonical slug if visited via alias
  if (category.slug !== categorySlug) {
    permanentRedirect(`/${category.slug}`);
  }

  return (
    <CategoryPageContent
      categorySlug={categorySlug}
      category={category}
      searchParams={searchParams}
    />
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
  // 1. Initial checks (Fast, usually cached)
  const nonEmptySlugs = await getNonEmptyCategorySlugs();
  const isEmpty = !isCategoryNotEmptyRecursive(categorySlug, nonEmptySlugs);

  if (isEmpty) notFound();

  // 2. Identify view type
  const activeChildren = getChildCategories(categorySlug).filter((child) =>
    isCategoryNotEmptyRecursive(child.slug, nonEmptySlugs),
  );
  const isParent = activeChildren.length > 0;

  if (isParent) {
    // Parent View Hub
    return (
      <Suspense fallback={null}>
        <ParentCategoryViewLoader
          category={category}
          categorySlug={categorySlug}
          childCategories={activeChildren}
          nonEmptySlugs={nonEmptySlugs}
        />
      </Suspense>
    );
  }

  // 3. Child Category View (Idealo style)
  const resolvedSearchParams = await searchParams;

  return (
    <IdealoCategoryPage
      category={stripCategoryIcon(category)}
      countryCode={DEFAULT_COUNTRY}
      searchParams={resolvedSearchParams}
    />
  );
}

async function ParentCategoryViewLoader({
  category,
  categorySlug,
  childCategories,
  nonEmptySlugs,
}: {
  category: Category;
  categorySlug: CategorySlug;
  childCategories: Category[];
  nonEmptySlugs: string[];
}) {
  const { bestsellers, newProducts, deals } = await getParentCategoryData(
    categorySlug,
    DEFAULT_COUNTRY,
  ).catch(() => ({ bestsellers: [], newProducts: [], deals: [] }));

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

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    ...getBreadcrumbs(categorySlug).map((crumb) => ({
      name: crumb.name,
      href: crumb.slug === categorySlug ? undefined : `/${crumb.slug}`,
    })),
  ];

  // Filter popular filters in children to only show non-empty categories
  const filteredChildren = childCategories.map((child) => {
    const stripped = stripCategoryIcon(child);
    if (stripped.popularFilters) {
      stripped.popularFilters = stripped.popularFilters.filter((filter) => {
        // If it's a direct category link, check if it's empty
        if (filter.href && filter.href.startsWith("/")) {
          const targetSlug = filter.href.substring(1);
          return isCategoryNotEmptyRecursive(
            targetSlug as CategorySlug,
            nonEmptySlugs,
          );
        }
        return true;
      });
    }
    return stripped;
  });

  return (
    <ParentCategoryView
      parentCategory={stripCategoryIcon(category)}
      childCategories={filteredChildren}
      bestsellers={bestsellers.map(transformProduct)}
      newProducts={newProducts.map(transformProduct)}
      deals={deals.map(transformProduct)}
      breadcrumbItems={breadcrumbItems}
    />
  );
}
