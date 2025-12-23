"use client"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet"
import { useCategoryProducts } from "@/hooks/use-category-products"
import { useProductFilters } from "@/hooks/use-product-filters"
import { trackSEO } from "@/lib/analytics"
import { Category, getBreadcrumbs, stripCategoryIcon } from "@/lib/categories"
import { getCategoryIcon } from "@/lib/category-icons"
import { getCountryByCode } from "@/lib/countries"
import { Product } from "@/lib/product-registry"
import { Filter, Info, Search } from "lucide-react"
import * as React from "react"

// Extracted Sub-components
import { CategoryHeader } from "@/components/category/CategoryHeader"
import { FilterPanel } from "@/components/category/FilterPanel"
import { ProductTable } from "@/components/category/ProductTable"

interface CategoryProductsViewProps {
  category: Omit<Category, 'icon'>
  countryCode: string
}

export function CategoryProductsView({ category, countryCode }: CategoryProductsViewProps) {
  const categorySlug = category.slug
  const breadcrumbs = getBreadcrumbs(categorySlug).map(crumb => ({
    ...stripCategoryIcon(crumb),
    Icon: getCategoryIcon(crumb.slug)
  }))
  const countryConfig = getCountryByCode(countryCode)

  // 1. State & Logic Hooks
  const { filters, setSearch, toggleArrayFilter, setCapacityRange, setSort, clearAllFilters } = useProductFilters()
  const { 
    products, 
    filteredCount, 
    unitLabel, 
    hasProducts 
  } = useCategoryProducts({ category, filters })

  // 2. Analytics
  React.useEffect(() => {
    trackSEO.categoryView(categorySlug, countryCode)
  }, [categorySlug, countryCode])

  // 3. Shared Handlers
  const formatCurrency = (value: number, fractionDigits = 2) => {
    return new Intl.NumberFormat(countryConfig?.locale || 'en-US', {
      style: 'currency',
      currency: countryConfig?.currency || 'USD',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value)
  }

  const handleAffiliateClick = (product: Product, index: number) => {
    trackSEO.affiliateClick({
      productName: product.title,
      category: categorySlug,
      country: countryCode,
      price: product.price,
      pricePerUnit: product.pricePerUnit || 0,
      position: index + 1,
    })
  }

  const handleFilterChange = (filterName: string, value: string) => {
    toggleArrayFilter(filterName as any, value)
    trackSEO.filterApplied(filterName, value, categorySlug)
  }

  const handleSort = (key: string) => {
    const effectiveKey = !key ? 'pricePerUnit' : key
    const currentSortBy = !filters.sortBy ? 'pricePerUnit' : filters.sortBy
    const newOrder = currentSortBy === effectiveKey && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    
    setSort(key as any, newOrder as 'asc' | 'desc')
    trackSEO.sortChanged(String(effectiveKey), newOrder, categorySlug)
  }

  // 4. Main Render
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        
        <CategoryHeader 
          category={category}
          countryCode={countryCode}
          breadcrumbs={breadcrumbs}
          productCount={filteredCount}
          searchValue={filters.search}
          onSearchChange={setSearch}
        />

        <div className="flex gap-6">
          {hasProducts ? (
            <>
              {/* Desktop Filters */}
              <aside className="hidden lg:block w-60 shrink-0">
                <FilterPanel 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onCapacityChange={setCapacityRange}
                  unitLabel={unitLabel}
                  categorySlug={categorySlug}
                />
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="lg:hidden mb-4 flex justify-end">
                   <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 bg-card">
                        <Filter className="h-4 w-4" /> Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] pt-12">
                      <SheetTitle className="sr-only">Filters</SheetTitle>
                      <FilterPanel 
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onCapacityChange={setCapacityRange}
                        unitLabel={unitLabel}
                        categorySlug={categorySlug}
                      />
                    </SheetContent>
                  </Sheet>
                </div>

                {products.length > 0 ? (
                  <ProductTable 
                    products={products}
                    unitLabel={unitLabel}
                    categorySlug={categorySlug}
                    sortBy={filters.sortBy}
                    sortOrder={filters.sortOrder}
                    onSort={handleSort}
                    formatCurrency={formatCurrency}
                    onAffiliateClick={handleAffiliateClick}
                  />
                ) : (
                  <NoProductsMatchingFilters onClear={clearAllFilters} />
                )}
                
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Prices and availability are subject to change.
                </div>
              </div>
            </>
          ) : (
            <DataComingSoon categoryName={category.name} />
          )}
        </div>
      </div>
    </div>
  )
}

function NoProductsMatchingFilters({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-card/50">
      <div className="bg-muted/30 p-4 rounded-full mb-4"><Search className="h-8 w-8 text-muted-foreground" /></div>
      <h3 className="text-lg font-semibold mb-2">No products found</h3>
      <p className="text-muted-foreground max-w-sm mb-6">We couldn't find any products matching your current filters.</p>
      <Button variant="outline" onClick={onClear}>Clear All Filters</Button>
    </div>
  )
}

function DataComingSoon({ categoryName }: { categoryName: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
      <div className="bg-muted/30 p-6 rounded-full mb-6"><Info className="h-12 w-12 text-muted-foreground" /></div>
      <h2 className="text-2xl font-bold mb-3">Data Coming Soon</h2>
      <p className="text-muted-foreground max-w-md text-lg">
        We are currently aggregating real-time price data for this category. 
        Please check back shortly for the best deals on <span className="font-medium text-foreground">{categoryName}</span>.
      </p>
    </div>
  )
}
