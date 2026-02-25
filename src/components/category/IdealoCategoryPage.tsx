/**
 * Idealo Category Page - Complete Recreation
 *
 * DIRECTLY BASED ON: https://www.idealo.de/preisvergleich/ProductCategory/2520.html
 *
 * Key Idealo classes (with CSS module hashes):
 * - sr-searchResult_e3Q8y - Main container
 * - sr-topBar_iwPzv - Sticky top bar (title, sorting, view switch)
 * - sr-filterBar_t26b_ - Filter sidebar
 * - sr-searchResult__products_momVp - Products container
 * - sr-resultItemTile - Product card
 * - sr-resultListViewSwitch_ANJB0 - Grid/List toggle
 *
 * Layout Breakpoints (from Idealo CSS):
 * - < 840px: Filter hidden, full width products
 * - >= 840px: Filter 33.33%, Products 66.66%
 * - >= 960px: Filter 25%, Products 75%
 */

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Category, getBreadcrumbs, stripCategoryIcon } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";
import { type CountryCode } from "@/lib/countries";
import { type FilterParams } from "@/lib/product-definitions";
import { getCategoryProducts } from "@/lib/server/category-products";
import { cn } from "@/lib/utils";
import { formatTechText } from "@/lib/utils/formatting";
import { connection } from "next/server";

// Sub-components
import { ComponentErrorBoundary } from "@/components/ui/ComponentErrorBoundary";
import { AsyncFilterPanel, AsyncProductList } from "./AsyncComponents";
import { IdealoTopBar } from "./IdealoTopBar";
import { NicheLinks } from "./NicheLinks";

// FAQ components for SEO

import { BreadcrumbSchema } from "@/components/seo/ProductSchema";

interface Props {
  category: Omit<Category, "icon">;
  countryCode: CountryCode;
  searchParams: FilterParams | Promise<FilterParams>;
  lockedFilters?: string[];
}

// Main Category Page - Server Component
// Removed force-dynamic to allow Next.js 16 dynamicIO and "use cache" to work effectively.
// The page will become dynamic if needed through searchParams access, but is otherwise cacheable.

// Main Category Page - Hold-First Pattern (Async Page)
export async function IdealoCategoryPage({
  category,
  countryCode,
  searchParams,
  lockedFilters,
}: Props) {
  // Explicitly wait for the connection and searchParams to trigger the "Hold" behavior.
  // This ensures the browser stays on the current page until the new content is ready.
  await connection();
  const resolvedSearchParams = await searchParams;
  const categorySlug = category.slug;

  const filteredData = await getCategoryProducts(
    categorySlug,
    countryCode,
    resolvedSearchParams,
  );

  const breadcrumbs = getBreadcrumbs(categorySlug).map((crumb) => ({
    ...stripCategoryIcon(crumb),
    Icon: getCategoryIcon(crumb.slug),
  }));

  // Breadcrumb items
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    ...breadcrumbs.map((b) => ({
      name: formatTechText(b.name),
      href: `/${b.slug}`,
    })),
  ];

  return (
    <div className="sr-searchResult bg-secondary min-h-screen">
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="mx-auto max-w-[1280px]">
        {/* Header / Breadcrumbs */}
        <div className="border-border bg-card border-b px-4">
          <div className="sr-breadcrumb py-3">
            <Breadcrumbs
              items={breadcrumbItems}
              className="text-idealo-text-secondary mb-0 text-[14px]"
            />
          </div>
          <ComponentErrorBoundary name="CategoryTopBar">
            <IdealoTopBar
              categoryName={formatTechText(category.name)}
              productCount={filteredData.filteredCount}
              currentView={(resolvedSearchParams.view as any) || "grid"}
              currentSort={(resolvedSearchParams.sort as any) || "popular"}
            />
          </ComponentErrorBoundary>
        </div>

        {/* Main Content */}
        <div
          className={cn(
            "sr-searchResult__products",
            "relative mt-3 mb-[45px] flex flex-row flex-wrap",
          )}
        >
          <ComponentErrorBoundary name="CategoryFilters">
            <AsyncFilterPanel
              category={category}
              filteredData={filteredData}
              lockedFilters={lockedFilters}
            />
          </ComponentErrorBoundary>

          <ComponentErrorBoundary name="CategoryProductList">
            <AsyncProductList
              category={category}
              countryCode={countryCode}
              searchParams={resolvedSearchParams}
              filteredData={filteredData}
            />
          </ComponentErrorBoundary>
        </div>

        {/* SEO NICHES / POPULAR SEARCHES */}
        <NicheLinks categorySlug={category.slug} />
      </div>
    </div>
  );
}
