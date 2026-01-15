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
import {
  Category,
  getBreadcrumbs,
  getChildCategories,
  stripCategoryIcon,
  type CategorySlug,
} from "@/lib/categories";
import { getCategoryFAQs } from "@/lib/category-faqs";
import { getCategoryIcon } from "@/lib/category-icons";
import { type CountryCode } from "@/lib/countries";
import {
  FilterParams,
  getCategoryProducts,
} from "@/lib/server/category-products";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Sub-components
import { IdealoFilterPanel } from "./IdealoFilterPanel";
import { IdealoResultList } from "./IdealoResultList";
import { IdealoTopBar } from "./IdealoTopBar";

// FAQ components for SEO
import { FAQSchema } from "@/components/category/FAQSchema";
import { FAQSection } from "@/components/category/FAQSection";
import { getUniqueFieldValues } from "@/lib/utils/category-utils";
import { X } from "lucide-react";
import { MobileFilterDrawer } from "./MobileFilterDrawer";

interface Props {
  category: Omit<Category, "icon">;
  countryCode: CountryCode;
  searchParams: FilterParams;
}

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
  const viewMode = searchParams.view || "grid";

  // Fetch filtered products and all products (for filter options) in parallel
  // (Vercel Best Practices: async-parallel)
  const [filteredData, allData] = await Promise.all([
    getCategoryProducts(category.slug, countryCode, searchParams),
    category.filterGroups
      ? getCategoryProducts(category.slug, countryCode, {})
      : Promise.resolve(null),
  ]);

  const {
    products: rawFilteredProducts,
    filteredCount,
    unitLabel,
    hasProducts,
    filters,
    lastUpdated,
  } = filteredData;

  // Strip heavy data from products before passing to Client Components (especially features/specifications)
  // (Vercel Best Practices: server-serialization)
  const products = rawFilteredProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    image: p.image,
    price: p.price,
    pricePerUnit: p.pricePerUnit,
    capacity: p.capacity,
    capacityUnit: p.capacityUnit,
    formFactor: p.formFactor,
    brand: p.brand,
    rating: p.rating,
    reviewCount: p.reviewCount,
    salesRank: p.salesRank,
    variationAttributes: p.variationAttributes,
  }));

  // Pre-calculate filter options on the server to avoid passing all products twice/thrice
  const filterGroupOptions: Record<string, string[]> = {};
  if (hasProducts && category.filterGroups && allData) {
    const { products: allCategoryProducts } = allData;

    category.filterGroups.forEach((group) => {
      if (group.options) {
        filterGroupOptions[group.field] = group.options;
      } else {
        filterGroupOptions[group.field] = getUniqueFieldValues(
          allCategoryProducts,
          group.field,
        );
      }
    });
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    ...breadcrumbs.map((b) => ({ name: b.name, href: `/${b.slug}` })),
  ];

  // Related categories
  const relatedCategories = getChildCategories(
    (category.parent as CategorySlug) || ("elektroartikel" as CategorySlug),
  ).filter((c) => c.slug !== categorySlug);

  return (
    <div className="sr-searchResult min-h-screen bg-[#f6f6f6]">
      {/* ============================================ */}
      {/* MAIN CONTAINER - max-width 1280px */}
      {/* ============================================ */}
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
          {/* TOP BAR - sr-topBar_iwPzv */}
          {/* Title, Sort, View Switch */}
          {/* ============================================ */}
          {hasProducts ? (
            <IdealoTopBar
              categoryName={category.name}
              productCount={filteredCount}
              currentView={viewMode}
              currentSort={
                typeof searchParams === "object" && "sort" in searchParams
                  ? (searchParams.sort as string)
                  : "popular"
              }
            />
          ) : null}
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
          {hasProducts ? (
            <>
              {/* ============================================ */}
              {/* FILTER SIDEBAR - sr-filterBar_t26b_ */}
              {/* Hidden < 840px, 33.33% at 840px, 25% at 960px */}
              {/* ============================================ */}
              <aside
                className={cn(
                  "sr-filterBar",
                  "w-full bg-transparent pl-0",
                  // Hidden below 840px
                  "hidden min-[840px]:block",
                  // 33.33% at 840px
                  "min-[840px]:max-w-[33.33333%] min-[840px]:basis-[33.33333%]",
                  // 25% at 960px
                  "min-[960px]:max-w-[25%] min-[960px]:basis-[25%]",
                )}
              >
                <IdealoFilterPanel
                  categorySlug={categorySlug}
                  unitLabel={unitLabel}
                  filterOptions={filterGroupOptions}
                />
              </aside>

              {/* ============================================ */}
              {/* PRODUCT LIST CONTAINER */}
              {/* 100% mobile, 66.66% at 840px, 75% at 960px */}
              {/* ============================================ */}
              <div
                className={cn(
                  "sr-searchResult__resultPanel",
                  "relative w-full pr-0 pl-[15px]",
                  // Width at breakpoints
                  "min-[840px]:max-w-[66.66667%] min-[840px]:basis-[66.66667%]",
                  "min-[960px]:max-w-[75%] min-[960px]:basis-[75%]",
                )}
              >
                {/* Mobile Filter Button */}
                <MobileFilterDrawer
                  categorySlug={categorySlug}
                  unitLabel={unitLabel}
                  categoryName={category.name}
                  productCount={filteredCount}
                  filterOptions={filterGroupOptions}
                />

                {/* ============================================ */}
                {/* PRODUCT GRID/LIST - sr-resultList */}
                {/* Uses new isolated Idealo components */}
                {/* ============================================ */}
                {/* ============================================ */}
                {/* ACTIVE FILTER TAGS */}
                {/* ============================================ */}
                {filteredCount < products.length && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {Object.entries(filters).map(([field, value]) => {
                      if (
                        !value ||
                        (Array.isArray(value) && value.length === 0)
                      )
                        return null;
                      if (
                        [
                          "sortBy",
                          "sortOrder",
                          "search",
                          "minCapacity",
                          "maxCapacity",
                        ].includes(field)
                      )
                        return null;

                      // Display tags for array filters (brand, socket, etc.)
                      if (Array.isArray(value)) {
                        return value.map((v) => (
                          <Link
                            key={`${field}-${v}`}
                            href={{
                              pathname: `/${category.slug}`,
                              query: {
                                ...searchParams,
                                [field]: (
                                  searchParams[
                                    field as keyof FilterParams
                                  ] as string[]
                                )?.filter((val) => val !== v),
                              },
                            }}
                            className="flex items-center gap-1 rounded-[4px] border border-[#B4B4B4] bg-white px-3 py-1 text-[13px] text-[#2d2d2d] no-underline hover:bg-gray-50"
                          >
                            <span>{v}</span>
                            <X className="h-3 w-3 text-[#767676]" />
                          </Link>
                        ));
                      }

                      // Price range tags
                      if (
                        (field === "minPrice" || field === "maxPrice") &&
                        value !== null
                      ) {
                        // Only show one tag for price range
                        if (field === "maxPrice" && filters.minPrice !== null)
                          return null;
                        const label =
                          filters.minPrice !== null && filters.maxPrice !== null
                            ? `${filters.minPrice}€ - ${filters.maxPrice}€`
                            : filters.minPrice !== null
                              ? `ab ${filters.minPrice}€`
                              : `bis ${filters.maxPrice}€`;

                        return (
                          <Link
                            key="price-range"
                            href={{
                              pathname: `/${category.slug}`,
                              query: {
                                ...searchParams,
                                minPrice: undefined,
                                maxPrice: undefined,
                              },
                            }}
                            className="flex items-center gap-1 rounded-[4px] border border-[#B4B4B4] bg-white px-3 py-1 text-[13px] text-[#2d2d2d] no-underline hover:bg-gray-50"
                          >
                            <span>{label}</span>
                            <X className="h-3 w-3 text-[#767676]" />
                          </Link>
                        );
                      }

                      return null;
                    })}

                    <Link
                      href={`/${category.slug}`}
                      className="ml-2 text-[13px] font-bold text-[#0771D0] hover:underline"
                    >
                      Alle zurücksetzen
                    </Link>
                  </div>
                )}

                <IdealoResultList
                  products={products}
                  countryCode={countryCode}
                  viewMode={viewMode as "grid" | "list"}
                />

                {/* ============================================ */}
                {/* DISCLAIMER */}
                {/* ============================================ */}
                <div className="mt-4 text-center text-[12px] text-[#767676]">
                  * Preise inkl. MwSt., ggf. zzgl. Versand. Preise und
                  Verfügbarkeit können sich ändern.
                  {lastUpdated ? (
                    <span className="mt-1 block">
                      Zuletzt aktualisiert:{" "}
                      {new Date(lastUpdated).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </div>

                {/* ============================================ */}
                {/* RELATED CATEGORIES - sr-relatedCategories */}
                {/* ============================================ */}
                <div className="sr-relatedCategories mt-8 border-t border-[#b4b4b4] pt-4">
                  <h3 className="mb-3 text-[16px] font-bold text-[#2d2d2d]">
                    Ähnliche Kategorien
                  </h3>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {relatedCategories.map((related) => {
                      const Icon = getCategoryIcon(related.slug);
                      return (
                        <Link
                          key={related.slug}
                          href={`/${related.slug}`}
                          className="flex items-center gap-2 py-1.5 text-[14px] text-[#0771d0] hover:underline"
                        >
                          <Icon className="h-4 w-4 text-[#767676]" />
                          <span>{related.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* FAQ Section */}
                {getCategoryFAQs(categorySlug).length > 0 && (
                  <>
                    <FAQSchema faqs={getCategoryFAQs(categorySlug)} />
                    <FAQSection
                      faqs={getCategoryFAQs(categorySlug)}
                      categoryName={category.name}
                    />
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
              <h2 className="mb-3 text-2xl font-bold text-[#2d2d2d]">
                Daten folgen
              </h2>
              <p className="text-[14px] text-[#767676]">
                Wir aggregieren derzeit Preisdaten für{" "}
                <span className="font-medium">{category.name}</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
