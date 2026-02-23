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
  truncateTitle,
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

  // Generates all non-empty categories at runtime
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

  return (
    <CategoryPageContent
      categorySlug={categorySlug as CategorySlug}
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
  const children = getChildCategories(categorySlug);
  const isEmpty =
    children.length > 0
      ? !children.some((child) => nonEmptySlugs.includes(child.slug))
      : !nonEmptySlugs.includes(categorySlug);

  if (isEmpty) notFound();

  // 2. Identify view type
  const isParent = children.length > 0;

  if (isParent) {
    // Parent View Hub
    return (
      <Suspense fallback={null}>
        <ParentCategoryViewLoader
          category={category}
          categorySlug={categorySlug}
          children={children}
        />
      </Suspense>
    );
  }

  // 3. Child Category View (Idealo style)
  // We pass the promise of searchParams down to avoid awaiting it here if we just want to start rendering the shell.
  // Actually, IdealoCategoryPage already does Suspense internally for its heavy parts.
  const filters = await searchParams;

  return (
    <IdealoCategoryPage
      category={stripCategoryIcon(category)}
      countryCode={DEFAULT_COUNTRY}
      searchParams={filters}
    />
  );
}

async function ParentCategoryViewLoader({
  category,
  categorySlug,
  children,
}: {
  category: Category;
  categorySlug: CategorySlug;
  children: Category[];
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

  return (
    <ParentCategoryView
      parentCategory={stripCategoryIcon(category)}
      childCategories={children.map(stripCategoryIcon)}
      bestsellers={bestsellers.map(transformProduct)}
      newProducts={newProducts.map(transformProduct)}
      deals={deals.map(transformProduct)}
      breadcrumbItems={breadcrumbItems}
    />
  );
}
