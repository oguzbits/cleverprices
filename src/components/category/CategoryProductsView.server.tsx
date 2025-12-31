import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/ui/category-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Category, getBreadcrumbs, getChildCategories, stripCategoryIcon } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";
import { getCountryByCode, type CountryCode } from "@/lib/countries";
import { FilterParams, getCategoryProducts } from "@/lib/server/category-products";
import { Filter, Info, Search } from "lucide-react";

// Client components
import { CategoryHeader } from "@/components/category/CategoryHeader";
import { FilterPanelClient } from "@/components/category/FilterPanelClient";
import { ProductTable } from "@/components/category/ProductTable";

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

  // SERVER-SIDE FILTERING - This is the key optimization!
  const { products, filteredCount, unitLabel, hasProducts, filters } =
    await getCategoryProducts(category, countryCode, searchParams);

  const formatCurrency = (value: number, fractionDigits = 2) => {
    return new Intl.NumberFormat(countryConfig?.locale || "en-US", {
      style: "currency",
      currency: countryConfig?.currency || "USD",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  };

  // Mobile filter sheet (client component for interactivity)
  const mobileFilterTrigger = (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-card h-10 gap-2 border shadow-sm"
        >
          <Filter className="h-4 w-4" /> Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="border-b px-6 py-4 text-left">
          <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
        </SheetHeader>
        <div className="px-6 py-4">
          <FilterPanelClient
            categorySlug={categorySlug}
            unitLabel={unitLabel}
            initialFilters={filters}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  // Main render
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        <CategoryHeader
          category={category}
          countryCode={countryCode}
          breadcrumbs={breadcrumbs}
          productCount={filteredCount}
          filterTrigger={mobileFilterTrigger}
        />

        <div className="flex gap-6">
          {hasProducts ? (
            <>
              {/* Desktop Filters - CLIENT COMPONENT */}
              <aside className="hidden w-60 shrink-0 lg:block">
                <div className="bg-card sticky top-24 rounded-lg border p-4 shadow-sm">
                  <FilterPanelClient
                    categorySlug={categorySlug}
                    unitLabel={unitLabel}
                    initialFilters={filters}
                  />
                </div>
              </aside>

              {/* Main Content - SERVER RENDERED */}
              <div className="min-w-0 flex-1">
                {products.length > 0 ? (
                  <ProductTable
                    products={products}
                    unitLabel={unitLabel}
                    categorySlug={categorySlug}
                    sortBy={filters.sortBy}
                    sortOrder={filters.sortOrder}
                    formatCurrency={formatCurrency}
                  />
                ) : (
                  <NoProductsMatchingFilters />
                )}

                <div className="text-muted-foreground mt-4 text-center text-sm">
                  Prices and availability are subject to change.
                </div>

                {/* Related Categories for SEO/PR */}
                <div className="mt-12 border-t pt-8">
                  <h3 className="mb-6 text-lg font-bold">Popular Categories</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {getChildCategories(category.parent || "electronics")
                      .filter((c) => c.slug !== categorySlug)
                      .map((related) => (
                        <CategoryCard
                          key={related.slug}
                          category={related}
                          Icon={getCategoryIcon(related.slug)}
                          country={countryCode}
                        />
                      ))}
                  </div>
                </div>
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
    <div className="bg-card/50 flex flex-col items-center justify-center rounded-md border py-12 text-center">
      <div className="bg-muted/30 mb-4 rounded-full p-4">
        <Search className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No products found</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        We couldn&apos;t find any products matching your current filters.
        Try adjusting your filters or search term.
      </p>
    </div>
  );
}

function DataComingSoon({ categoryName }: { categoryName: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="bg-muted/30 mb-6 rounded-full p-6">
        <Info className="text-muted-foreground h-12 w-12" />
      </div>
      <h2 className="mb-3 text-2xl font-bold">Data Coming Soon</h2>
      <p className="text-muted-foreground max-w-md text-lg">
        We are currently aggregating real-time price data for this category.
        Please check back shortly for the best deals on{" "}
        <span className="text-foreground font-medium">{categoryName}</span>.
      </p>
    </div>
  );
}
