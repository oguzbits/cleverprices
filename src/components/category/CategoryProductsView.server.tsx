import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/ui/category-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Category,
  getBreadcrumbs,
  getChildCategories,
  stripCategoryIcon,
} from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";
import { getCategoryFAQs } from "@/lib/category-faqs";
import { getCategoryContent } from "@/lib/category-content";
import { getCountryByCode, type CountryCode } from "@/lib/countries";
import {
  FilterParams,
  getCategoryProducts,
} from "@/lib/server/category-products";
import { Filter, Info, Search } from "lucide-react";

// FAQ components for SEO
import { FAQSchema } from "@/components/category/FAQSchema";
import { FAQSection } from "@/components/category/FAQSection";

// Product views
import { IdealoProductGrid } from "@/components/category/IdealoProductGrid";
import { ProductTable } from "@/components/category/ProductTable";
import { ViewControls } from "@/components/category/ViewControls";

// Client components
import { Breadcrumbs } from "@/components/breadcrumbs";
import { IdealoFilterPanel } from "@/components/category/IdealoFilterPanel";

interface CategoryProductsViewProps {
  category: Omit<Category, "icon">;
  countryCode: CountryCode;
  searchParams: FilterParams;
}

/**
 * SERVER COMPONENT - Filters and renders products on the server
 * This is much faster than client-side filtering and better for SEO
 */
export async function CategoryProductsView({
  category,
  countryCode,
  searchParams,
}: CategoryProductsViewProps) {
  const categorySlug = category.slug;
  const breadcrumbs = getBreadcrumbs(categorySlug).map((crumb) => ({
    ...stripCategoryIcon(crumb),
    Icon: getCategoryIcon(crumb.slug),
  }));
  const countryConfig = getCountryByCode(countryCode);
  const content = getCategoryContent(categorySlug);

  // Get view mode from search params
  const viewMode = searchParams.view || "grid";

  /*
   * SERVER-SIDE FILTERING - This is the key optimization!
   * Refactored to pass primitive arguments (slug) for better caching and stability.
   */
  const { products, filteredCount, unitLabel, hasProducts, filters } =
    await getCategoryProducts(category.slug, countryCode, searchParams);

  const formatCurrency = (value: number, fractionDigits = 2) => {
    return new Intl.NumberFormat(countryConfig?.locale || "de-DE", {
      style: "currency",
      currency: countryConfig?.currency || "EUR",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  };

  const formatPricePerUnit = (value: number) => {
    return new Intl.NumberFormat(countryConfig?.locale || "de-DE", {
      style: "currency",
      currency: countryConfig?.currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Breadcrumb items for display
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    ...breadcrumbs.map((b) => ({ name: b.name, href: `/${b.slug}` })),
  ];

  // Mobile filter sheet (client component for interactivity)
  const mobileFilterTrigger = (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-zinc-200 bg-white shadow-sm lg:hidden"
        >
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="border-b px-6 py-4 text-left">
          <SheetTitle className="text-lg font-bold">Filter</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-4">
          <IdealoFilterPanel
            categorySlug={categorySlug}
            categoryName={category.name}
            productCount={products.length}
            unitLabel={unitLabel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  // Main render - Idealo style layout
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={breadcrumbItems}
          className="mb-4 text-[14px] text-zinc-400"
        />

        {/* Top bar with title and controls - Idealo style */}
        {hasProducts && (
          <div className="mr-[15px] mb-2 flex flex-col justify-between md:flex-row md:items-center">
            <h1 className="text-lg font-bold text-zinc-900">
              {category.name}
              <span className="ml-1.5 text-[14px] font-normal text-zinc-400">
                ({filteredCount.toLocaleString("de-DE")})*
              </span>
            </h1>
            <ViewControls
              productCount={filteredCount}
              categoryName={category.name}
            />
          </div>
        )}

        {/* Main content area - Idealo style flex-wrap layout */}
        <div className="relative mb-[45px] flex flex-row flex-wrap">
          {hasProducts ? (
            <>
              {/* Desktop Filters Sidebar - Idealo responsive widths */}
              <aside
                className="hidden w-full md:block md:max-w-[33.33333%] md:flex-[0_0_33.33333%] lg:max-w-[25%] lg:flex-[0_0_25%]"
                style={{
                  containerType: "inline-size",
                  containerName: "filter-sidebar",
                }}
              >
                <IdealoFilterPanel
                  categorySlug={categorySlug}
                  categoryName={category.name}
                  productCount={products.length}
                  unitLabel={unitLabel}
                />
              </aside>

              {/* Main Content - takes remaining space */}
              <div className="relative w-full md:max-w-[66.66667%] md:flex-[0_0_66.66667%] md:px-[15px] lg:max-w-[75%] lg:flex-[0_0_75%]">
                {/* Mobile filter trigger */}
                <div className="mb-4 md:hidden">{mobileFilterTrigger}</div>

                {products.length > 0 ? (
                  <div>
                    {viewMode === "grid" ? (
                      <IdealoProductGrid
                        products={products}
                        countryCode={countryCode}
                      />
                    ) : (
                      <ProductTable
                        products={products}
                        unitLabel={unitLabel}
                        categorySlug={categorySlug}
                        countryCode={countryCode}
                        sortBy={filters.sortBy}
                        sortOrder={filters.sortOrder}
                        formatCurrency={formatCurrency}
                        formatPricePerUnit={formatPricePerUnit}
                      />
                    )}
                  </div>
                ) : (
                  <NoProductsMatchingFilters />
                )}

                <div className="mt-4 text-center text-[14px] text-zinc-400">
                  Preise inkl. MwSt., ggf. zzgl. Versand. Preise und
                  Verfügbarkeit können sich ändern.
                </div>

                {/* Related Categories for SEO/PR */}
                <div className="mt-8 border-t border-zinc-200 pt-4">
                  <h3 className="mb-3 text-base font-bold text-zinc-900">
                    Ähnliche Kategorien
                  </h3>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {getChildCategories(category.parent || "electronics")
                      .filter((c) => c.slug !== categorySlug)
                      .map((related) => {
                        const Icon = getCategoryIcon(related.slug);
                        return (
                          <a
                            key={related.slug}
                            href={`/${related.slug}`}
                            className="flex items-center gap-2 px-1 py-1.5 text-base text-zinc-600 transition-colors hover:text-[#0066cc]"
                          >
                            <Icon className="h-4 w-4 text-zinc-400" />
                            <span>{related.name}</span>
                          </a>
                        );
                      })}
                  </div>
                </div>

                {/* Intro & Buying Guide for SEO */}
                {content && (
                  <div className="mt-8 border-t border-zinc-200 pt-6">
                    <h2 className="mb-4 text-lg font-bold text-zinc-900">
                      {content.title || `Über ${category.name}`}
                    </h2>

                    {content.intro && (
                      <p className="mb-6 text-[14px] leading-relaxed text-zinc-600">
                        {content.intro}
                      </p>
                    )}

                    {content.guide && content.guide.length > 0 && (
                      <div className="grid gap-6 md:grid-cols-2">
                        {content.guide.map((section, idx) => (
                          <div key={idx} className="space-y-2">
                            <h3 className="text-[14px] font-semibold text-zinc-900">
                              {section.title}
                            </h3>
                            <p className="text-[13px] leading-relaxed text-zinc-600">
                              {section.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* FAQ Section for SEO */}
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
            <DataComingSoon categoryName={category.name} />
          )}
        </div>
      </div>
    </div>
  );
}

function NoProductsMatchingFilters() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[6px] border border-[#dcdcdc] bg-white py-12 text-center">
      <div className="mb-4 rounded-full bg-zinc-100 p-4">
        <Search className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-900">
        Keine Produkte gefunden
      </h3>
      <p className="max-w-sm text-[13px] text-zinc-500">
        Wir konnten keine Produkte mit den aktuellen Filtern finden. Bitte passe
        deine Filter an.
      </p>
    </div>
  );
}

function DataComingSoon({ categoryName }: { categoryName: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 rounded-full bg-zinc-100 p-6">
        <Info className="h-12 w-12 text-zinc-400" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-zinc-900">Daten folgen</h2>
      <p className="max-w-md text-[14px] text-zinc-500">
        Wir aggregieren derzeit Preisdaten für diese Kategorie. Bitte schaue
        später für die besten Angebote für{" "}
        <span className="font-medium text-zinc-700">{categoryName}</span>{" "}
        vorbei.
      </p>
    </div>
  );
}
