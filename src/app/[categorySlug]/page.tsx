import { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
/* eslint-disable react-hooks/error-boundaries */

import { IdealoCategoryPage } from "@/components/category/IdealoCategoryPage";
import { ParentCategoryView } from "@/components/category/ParentCategoryView";
import { ServerBusy } from "@/components/ui/ServerBusy";
import { DatabaseBusyError } from "@/db/utils";
import {
  allCategories,
  type Category,
  type CategorySlug,
  getBreadcrumbs,
  getChildCategories,
  isCategoryNotEmptyRecursive,
  stripCategoryIcon,
} from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import {
  generateKeywords,
  getAlternateLanguages,
  getOpenGraph,
} from "@/lib/metadata";
import { type FilterParams, type Product } from "@/lib/product-definitions";
import {
  getCachedNonEmptyCategorySlugs,
  getCachedParentCategoryData,
  getCategoryOrchestrationData,
  getCategoryRenderData,
} from "@/lib/server/cached-products";
import { BRAND_DOMAIN, SITE_URL } from "@/lib/site-config";
import { serializeSafe } from "@/lib/utils/serialization";

interface Props {
  params: Promise<{
    categorySlug: string;
  }>;
  searchParams: Promise<FilterParams>;
}

/**
 * Static params generation for ISR
 */
export async function generateStaticParams() {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (isBuild) return [{ categorySlug: "build-time-placeholder" }];

  try {
    const nonEmptySlugs = await getCachedNonEmptyCategorySlugs();
    const categories = Object.values(allCategories).filter((c) => !c.hidden);
    return categories
      .filter((c) => isCategoryNotEmptyRecursive(c.slug, nonEmptySlugs))
      .map((c) => ({ categorySlug: c.slug }));
  } catch {
    return [];
  }
}

/**
 * Metadata generation
 */
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";

  // 1. Resolve Params first
  const { categorySlug } = await params;

  // 2. Early Guard (BEFORE searchParams)
  if (!categorySlug || categorySlug === "build-time-placeholder") {
    return { title: BRAND_DOMAIN };
  }

  // 3. Resolve Dynamic Context
  const filters = await searchParams;

  // 4. Resolve Category & Non-Empty State (Cached)
  const { category, nonEmptySlugs } =
    await getCategoryOrchestrationData(categorySlug);

  if (!category) {
    return {
      title: "Kategorie nicht gefunden",
      robots: { index: false, follow: false },
    };
  }

  if (isBuild) {
    return { title: `${category.name} | ${BRAND_DOMAIN}` };
  }

  const canonicalUrl = `${SITE_URL}/${category.slug}`;

  // Check if empty/hidden
  const isEmpty = !isCategoryNotEmptyRecursive(
    categorySlug as CategorySlug,
    nonEmptySlugs,
  );

  const isParent = getChildCategories(category.slug).length > 0;
  if (category.hidden || (isEmpty && !isParent)) {
    return {
      title: `${category.name} - Keine Ergebnisse | ${BRAND_DOMAIN}`,
      robots: { index: false, follow: true },
    };
  }

  // Handle filtered pages (Noindex crawl waste)
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

  const description = category.unitType
    ? `${category.name} Preisvergleich. Beste Angebote nach Preis pro ${category.unitType} filtern & in Deutschland sparen bei ${BRAND_DOMAIN}.`
    : `Günstige ${category.name} von Top-Marken im Preisvergleich. Jetzt Hardware-Angebote finden & sparen bei ${BRAND_DOMAIN}.`;

  return {
    title: `${category.name} | Preisvergleich | ${BRAND_DOMAIN}`,
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
  };
}

/**
 * Error Boundary Component
 */
const CategoryError = ({ error, slug }: { error: any; slug: string }) => {
  console.error(`[Category Error] Critical failure for ${slug}:`, error);
  return (
    <div className="mx-auto flex min-h-[600px] max-w-4xl flex-col items-center justify-center space-y-6 px-4 py-20 text-center">
      <div className="rounded-full bg-red-50 p-4">
        <svg
          className="h-12 w-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Hoppla! Etwas ist schief gelaufen.
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md">
          Wir konnten die Seite für <strong>{slug}</strong> gerade nicht laden.
          Unser Team wurde benachrichtigt.
        </p>
      </div>
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-red-100 bg-red-50/50 p-4 text-left">
        <p className="mb-2 text-xs font-semibold tracking-wider text-red-500 uppercase">
          Fehlerdetails für Support
        </p>
        <pre className="overflow-x-auto text-sm whitespace-pre-wrap text-red-800">
          {error instanceof Error ? error.message : String(error)}
          {"\n"}
          {error?.stack?.split("\n").slice(0, 3).join("\n")}
        </pre>
      </div>
      <Link
        href="."
        className="rounded-lg bg-red-600 px-6 py-2.5 font-semibold text-white shadow-md transition hover:bg-red-700 active:scale-95"
      >
        Erneut versuchen
      </Link>
    </div>
  );
};

/**
 * Child Category View (Direct listing)
 */
async function ChildCategoryView({
  category,
  categorySlug,
  searchParams,
}: {
  category: Category;
  categorySlug: CategorySlug;
  searchParams: FilterParams;
}) {
  try {
    const data = await getCategoryRenderData(
      categorySlug,
      DEFAULT_COUNTRY,
      JSON.parse(JSON.stringify(searchParams)),
    );

    if (data && "isBusy" in data && data.isBusy) {
      return <ServerBusy />;
    }

    return (
      <IdealoCategoryPage
        category={stripCategoryIcon(category)}
        countryCode={DEFAULT_COUNTRY}
        searchParams={searchParams}
        initialData={data}
      />
    );
  } catch (error) {
    return <CategoryError error={error} slug={categorySlug} />;
  }
}

/**
 * Parent Category View (Hub/Landing)
 */
async function ParentCategoryLoader({
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
  try {
    const { bestsellers, newProducts, deals } =
      await getCachedParentCategoryData(categorySlug, DEFAULT_COUNTRY);

    const transformProduct = (p: Product) => ({
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

    const filteredChildren = childCategories.map((child) => {
      const stripped = stripCategoryIcon(child);
      if (stripped.popularFilters) {
        stripped.popularFilters = stripped.popularFilters.filter((filter) => {
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
        bestsellers={serializeSafe(bestsellers.map(transformProduct))}
        newProducts={serializeSafe(newProducts.map(transformProduct))}
        deals={serializeSafe(deals.map(transformProduct))}
        breadcrumbItems={breadcrumbItems}
      />
    );
  } catch (error) {
    return <CategoryError error={error} slug={categorySlug} />;
  }
}

/**
 * MAIN PAGE COMPONENT
 */
export default async function DedicatedCategoryPage({
  params,
  searchParams,
}: Props) {
  // 1. Resolve Params first
  const { categorySlug } = await params;

  // 2. Build-time safety: Prevent prerendering from hitting dynamic request data
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    !categorySlug ||
    categorySlug === "build-time-placeholder"
  ) {
    return <div className="h-screen w-full bg-gray-50" />;
  }

  // 3. Resolve Dynamic Context
  const searchParamsResolved = await searchParams;

  // 4. Resolve Category & Metadata (Cached Orchestrator)
  const { category, nonEmptySlugs } =
    await getCategoryOrchestrationData(categorySlug);

  if (!category) notFound();

  // 2. Handle Aliases
  if (category.slug !== categorySlug) {
    permanentRedirect(`/${category.slug}`);
  }

  try {
    // 3. Determine View Type (Parent vs Child)
    const isEmpty = !isCategoryNotEmptyRecursive(
      categorySlug as CategorySlug,
      nonEmptySlugs,
    );

    const activeChildren = getChildCategories(categorySlug).filter((child) =>
      isCategoryNotEmptyRecursive(child.slug, nonEmptySlugs),
    );
    const isParent = activeChildren.length > 0;

    if (isEmpty && !isParent) {
      notFound();
    }

    if (isParent) {
      return (
        <ParentCategoryLoader
          category={category}
          categorySlug={categorySlug as CategorySlug}
          childCategories={activeChildren}
          nonEmptySlugs={nonEmptySlugs}
        />
      );
    }

    // 4. Listing View
    return (
      <ChildCategoryView
        category={category}
        categorySlug={categorySlug as CategorySlug}
        searchParams={searchParamsResolved}
      />
    );
  } catch (error) {
    if (
      error instanceof DatabaseBusyError ||
      (typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as Error).name === "DatabaseBusyError")
    ) {
      return <ServerBusy />;
    }
    return <CategoryError error={error} slug={categorySlug} />;
  }
}
