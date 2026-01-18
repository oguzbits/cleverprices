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
import {
  FilterParams,
  getCategoryProducts,
} from "@/lib/server/category-products";
import { cn } from "@/lib/utils";

// Sub-components
import { Suspense } from "react";
import {
  AsyncFilterPanel,
  AsyncProductList,
  AsyncTopBar,
} from "./AsyncComponents";

// FAQ components for SEO

import { BreadcrumbSchema } from "@/components/seo/ProductSchema";

interface Props {
  category: Omit<Category, "icon">;
  countryCode: CountryCode;
  searchParams: FilterParams;
}

/**
 * Main Category Page - Server Component
 */
/**
 * Main Category Page - Server Component
 */
export async function IdealoCategoryPage({
  category,
  countryCode,
  searchParams,
}: Props) {
  const categorySlug = category.slug;
  const breadcrumbs = getBreadcrumbs(categorySlug).map((crumb) => ({
    ...stripCategoryIcon(crumb),
    Icon: getCategoryIcon(crumb.slug),
  }));

  // 1. Start fetching immediately (Waterfall elimination)
  // This Promise is passed to children to unwrap
  const productDataPromise = getCategoryProducts(
    category.slug,
    countryCode,
    searchParams,
  );

  // 2. Fetch "all data" for filters (only if needed)
  const allDataPromise = category.filterGroups
    ? getCategoryProducts(category.slug, countryCode, { fetchAll: true })
    : Promise.resolve(null);

  // Breadcrumb items
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    ...breadcrumbs.map((b) => ({ name: b.name, href: `/${b.slug}` })),
  ];

  return (
    <div className="sr-searchResult min-h-screen bg-[#f6f6f6]">
      <BreadcrumbSchema items={breadcrumbItems} />
      {/* ============================================ */}
      {/* MAIN CONTAINER - max-width 1280px */}
      <div className="mx-auto max-w-[1280px]">
        <div className="border-b border-[#dcdcdc] bg-white px-4">
          {/* ============================================ */}
          {/* BREADCRUMB - sr-breadcrumb */}
          {/* ============================================ */}
          <div className="sr-breadcrumb py-3">
            <Breadcrumbs
              items={breadcrumbItems}
              className="mb-0 text-[14px] text-[#767676]"
            />
          </div>

          {/* ============================================ */}
          {/* TOP BAR - Suspense Wrapper */}
          {/* ============================================ */}
          <Suspense
            fallback={
              <div className="mb-4 flex h-[60px] animate-pulse items-center justify-between rounded bg-gray-100" />
            }
          >
            <AsyncTopBar
              categoryName={category.name}
              searchParams={searchParams}
              productDataPromise={productDataPromise}
            />
          </Suspense>
        </div>

        {/* ============================================ */}
        {/* PRODUCTS + FILTERS CONTAINER */}
        {/* sr-searchResult__products_momVp */}
        {/* ============================================ */}
        <div
          className={cn(
            "sr-searchResult__products",
            "relative mt-3 mb-[45px] flex flex-row flex-wrap",
          )}
        >
          {/* FILTERS (Sidebar) */}
          <Suspense
            fallback={
              <aside className="sr-filterBar hidden w-full min-[840px]:block min-[840px]:max-w-[33.33333%] min-[840px]:basis-[33.33333%] min-[960px]:max-w-[25%] min-[960px]:basis-[25%]">
                <div className="h-[600px] animate-pulse rounded bg-gray-200" />
              </aside>
            }
          >
            <AsyncFilterPanel
              category={category}
              productDataPromise={productDataPromise}
              allDataPromise={allDataPromise}
            />
          </Suspense>

          {/* PRODUCT LIST */}
          <Suspense
            fallback={
              <div className="relative w-full pr-0 pl-0 min-[840px]:max-w-[66.66667%] min-[840px]:basis-[66.66667%] min-[840px]:pl-[15px] min-[960px]:max-w-[75%] min-[960px]:basis-[75%]">
                <div className="grid grid-cols-2 gap-4 min-[640px]:grid-cols-3 min-[1024px]:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="h-[380px] animate-pulse rounded bg-white"
                    />
                  ))}
                </div>
              </div>
            }
          >
            <AsyncProductList
              category={category}
              countryCode={countryCode}
              searchParams={searchParams}
              productDataPromise={productDataPromise}
              allDataPromise={allDataPromise}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
