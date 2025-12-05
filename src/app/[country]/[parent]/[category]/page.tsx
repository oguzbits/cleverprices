"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getCategoryBySlug, getBreadcrumbs, getCategoryPath } from "@/lib/categories"
import { isValidCountryCode, DEFAULT_COUNTRY } from "@/lib/countries"
import { useProductFilters } from "@/hooks/use-product-filters"
import { trackSEO } from "@/lib/analytics"

// Types
type Product = {
  id: number
  name: string
  price: number
  capacity: number // in GB
  capacityUnit: 'GB' | 'TB'
  pricePerTB: number
  warranty: string
  formFactor: string
  technology: 'HDD' | 'SSD' | 'SAS'
  condition: 'New' | 'Used' | 'Renewed'
  affiliateLink: string
  brand: string
}

// Authentic storage products data
const authenticStorageProducts: Product[] = [
  {
    id: 101,
    name: "SAMSUNG 990 PRO SSD 2TB NVMe M.2 PCIe Gen4",
    price: 189.99,
    capacity: 2000,
    capacityUnit: 'TB',
    pricePerTB: 94.995,
    warranty: "5 years",
    formFactor: "M.2 NVMe",
    technology: "SSD",
    condition: "New",
    affiliateLink: "https://www.amazon.com/SAMSUNG-Internal-Expansion-MZ-V9P2T0B-AM/dp/B0BHJJ9Y77?_encoding=UTF8&pf_rd_r=8RW5ZQHVDEMVZYN3DV84&pf_rd_p=4e1b46a8-daf9-4433-b97e-d6df97cf3699&pd_rd_i=B0BHJJ9Y77&pd_rd_w=TGoZk&pd_rd_wg=vgfV0&pd_rd_r=9b70e2b3-98b0-4579-ac1c-fdba45c66fff&content-id=amzn1.sym.4e1b46a8-daf9-4433-b97e-d6df97cf3699&th=1",
    brand: "Samsung"
  },
  {
    id: 102,
    name: "Seagate Exos X18 18TB Enterprise HDD",
    price: 249.99,
    capacity: 18000,
    capacityUnit: 'TB',
    pricePerTB: 13.89,
    warranty: "5 years",
    formFactor: "Internal 3.5\"",
    technology: "HDD",
    condition: "Renewed",
    affiliateLink: "https://www.amazon.com/Seagate-ST18000NM000J-Internal-Drive-7200RPM/dp/B08L5GQR5V?dib=eyJ2IjoiMSJ9.HStqLltVfroQv5S02r6rJ4Zh7a28_EPWbdPk3teR1ux_ReoDsvzRZ3reYDyhllExSZatn972TwRfVo_WXJUkcMckEbiUzezGASy5Oza0l4iwVhr5kmEhMotQosqE7o8KdKP59H4gl-p3__TgQPbt9dcKPlgZl0rrQhdH54ZU9lheEXhpTrDtTc0R5zwcP_ff_2wszycvxarKHdDFmIgpv0sVcs_PPXTbkKAcW_tKz40.oSjhdbUp95Y47EqamjbBfstTcwqoR9Z7CPGMhsUqYQI&dib_tag=se&keywords=Seagate+Exos+X18+18TB+Enterprise+HDD&qid=1764701501&sr=8-1",
    brand: "Seagate"
  },
  {
    id: 103,
    name: "WD_BLACK 2TB SN850X NVMe Internal Gaming SSD",
    price: 189.99,
    capacity: 2000,
    capacityUnit: 'TB',
    pricePerTB: 94.995,
    warranty: "5 years",
    formFactor: "M.2 NVMe",
    technology: "SSD",
    condition: "New",
    affiliateLink: "https://www.amazon.com/dp/B0B7CMZ3QH",
    brand: "Western Digital"
  },
  {
    id: 104,
    name: "Crucial MX500 2TB 3D NAND SATA 2.5 Inch Internal SSD",
    price: 179.99,
    capacity: 2000,
    capacityUnit: 'TB',
    pricePerTB: 89.995,
    warranty: "5 years",
    formFactor: "Internal 2.5\"",
    technology: "SSD",
    condition: "Used",
    affiliateLink: "https://www.amazon.com/dp/B003J5JB12",
    brand: "Crucial"
  },
  {
    id: 105,
    name: "SanDisk 1TB Extreme Portable SSD",
    price: 119.99,
    capacity: 1000,
    capacityUnit: 'TB',
    pricePerTB: 119.99,
    warranty: "3 years",
    formFactor: "External 2.5\"",
    technology: "SSD",
    condition: "New",
    affiliateLink: "https://www.amazon.com/dp/B08GTYFC37",
    brand: "SanDisk"
  }
];

export default function CategoryProductsPage() {
  const params = useParams()
  const countryCode = params.country as string
  const parentSlug = params.parent as string
  const categorySlug = params.category as string
  
  // Validate country code
  const validCountry = isValidCountryCode(countryCode) ? countryCode : DEFAULT_COUNTRY
  
  const category = getCategoryBySlug(categorySlug)
  const breadcrumbs = getBreadcrumbs(categorySlug)

  // Use nuqs for URL-synchronized filters
  const { filters, setSearch, toggleArrayFilter, setCapacityRange, setSort, clearAllFilters } = useProductFilters()

  // Determine if this category has products (for now, only hard-drives)
  const hasProducts = categorySlug === 'hard-drives' || categorySlug === 'storage'
  const currentProducts = hasProducts ? authenticStorageProducts : []
  
  // Apply filters
  let filteredProducts = [...currentProducts]

  if (filters.search) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(filters.search.toLowerCase()))
  }

  if (filters.condition && filters.condition.length > 0) {
    filteredProducts = filteredProducts.filter(p => filters.condition!.includes(p.condition))
  }

  if (filters.technology && filters.technology.length > 0) {
    filteredProducts = filteredProducts.filter(p => filters.technology!.includes(p.technology))
  }

  if (filters.formFactor && filters.formFactor.length > 0) {
    filteredProducts = filteredProducts.filter(p => filters.formFactor!.includes(p.formFactor))
  }

  if (filters.minCapacity !== null && filters.minCapacity !== undefined) {
    filteredProducts = filteredProducts.filter(p => (p.capacity / 1000) >= filters.minCapacity!)
  }

  if (filters.maxCapacity !== null && filters.maxCapacity !== undefined) {
    filteredProducts = filteredProducts.filter(p => (p.capacity / 1000) <= filters.maxCapacity!)
  }

  // Sorting
  filteredProducts.sort((a, b) => {
    const key = filters.sortBy as keyof Product
    const aValue = a[key]
    const bValue = b[key]

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }

    if (String(aValue) < String(bValue)) return filters.sortOrder === 'asc' ? -1 : 1
    if (String(aValue) > String(bValue)) return filters.sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: keyof Product) => {
    const newOrder = filters.sortBy === key && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    setSort(key, newOrder as 'asc' | 'desc')
  }

  const getSortIcon = (key: keyof Product) => {
    if (filters.sortBy !== key) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />
    return filters.sortOrder === 'asc'
      ? <ChevronUp className="ml-1 h-3 w-3" />
      : <ChevronDown className="ml-1 h-3 w-3" />
  }

  // Track category view on page load
  React.useEffect(() => {
    if (category) {
      trackSEO.categoryView(categorySlug, validCountry)
    }
  }, [categorySlug, validCountry, category])

  // Track affiliate clicks (MOST IMPORTANT METRIC!)
  const handleAffiliateClick = (product: Product, index: number) => {
    trackSEO.affiliateClick({
      productName: product.name,
      category: categorySlug,
      country: validCountry,
      price: product.price,
      pricePerUnit: product.pricePerTB,
      position: index + 1,
    })
  }

  // Track filter changes
  const handleFilterChange = (filterName: string, value: string) => {
    toggleArrayFilter(filterName as any, value)
    trackSEO.filterApplied(filterName, value, categorySlug)
  }

  // Track sort changes
  const handleSortWithTracking = (key: keyof Product) => {
    const newOrder = filters.sortBy === key && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    setSort(key, newOrder as 'asc' | 'desc')
    trackSEO.sortChanged(String(key), newOrder, categorySlug)
  }

  if (!category) {
    return (
      <div className="container py-12 mx-auto px-4">
        <div className="text-center py-24">
          <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The category you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href={`/${validCountry}`}>Browse All Categories</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-1.5 gap-y-2 sm:gap-2 text-xs sm:text-sm text-muted-foreground leading-normal">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li className="text-muted-foreground/50">/</li>
            <li>
              <Link href={`/${validCountry}/categories`} className="hover:text-foreground transition-colors">
                Categories
              </Link>
            </li>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.slug}>
                <li className="text-muted-foreground/50">/</li>
                <li>
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-foreground font-medium break-words">{crumb.name}</span>
                  ) : (
                    <Link 
                      href={getCategoryPath(crumb.slug, validCountry)} 
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <category.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" aria-hidden="true" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{category.name}</h1>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {hasProducts ? `Showing ${filteredProducts.length} products` : category.description}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8 bg-card dark:bg-card shadow-sm focus-visible:ring-0 focus-visible:border-primary transition-colors"
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search products"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden bg-card dark:bg-card hover:bg-card dark:hover:bg-card" aria-label="Open filters">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] px-4 pb-4 pt-12">
                <SheetTitle className="sr-only">Filters</SheetTitle>
                <div className="h-full overflow-y-auto">
                  <FilterPanel 
                    filters={filters}
                    toggleArrayFilter={handleFilterChange}
                    setCapacityRange={setCapacityRange}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-6">
          {hasProducts ? (
            <>
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-60 shrink-0">
                <div>
                  <FilterPanel 
                    filters={filters}
                    toggleArrayFilter={handleFilterChange}
                    setCapacityRange={setCapacityRange}
                  />
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {filteredProducts.length > 0 ? (
                  <div className="rounded-md border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" 
                            onClick={() => handleSortWithTracking('pricePerTB')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleSortWithTracking('pricePerTB')
                              }
                            }}
                            tabIndex={0}
                            aria-sort={filters.sortBy === 'pricePerTB' ? (filters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                            role="columnheader"
                          >
                            <div className="flex items-center">Price/TB {getSortIcon('pricePerTB')}</div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" 
                            onClick={() => handleSortWithTracking('price')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleSortWithTracking('price')
                              }
                            }}
                            tabIndex={0}
                            aria-sort={filters.sortBy === 'price' ? (filters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                            role="columnheader"
                          >
                            <div className="flex items-center">Price {getSortIcon('price')}</div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" 
                            onClick={() => handleSortWithTracking('capacity')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleSortWithTracking('capacity')
                              }
                            }}
                            tabIndex={0}
                            aria-sort={filters.sortBy === 'capacity' ? (filters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                            role="columnheader"
                          >
                            <div className="flex items-center">Capacity {getSortIcon('capacity')}</div>
                          </TableHead>
                          <TableHead className="hidden md:table-cell">Warranty</TableHead>
                          <TableHead className="hidden sm:table-cell">Form Factor</TableHead>
                          <TableHead className="hidden sm:table-cell">Tech</TableHead>
                          <TableHead className="hidden sm:table-cell">Condition</TableHead>
                          <TableHead>Product</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id} className="group">
                            <TableCell className="font-medium">
                              ${product.pricePerTB.toFixed(3)}
                            </TableCell>
                            <TableCell>
                              ${product.price.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {product.capacityUnit === 'TB' ? (product.capacity / 1000).toFixed(1) : product.capacity} {product.capacityUnit}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {product.warranty}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                              {product.formFactor}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                              {product.technology}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge 
                                className={cn(
                                  "text-xs font-medium border-0 px-2 py-0.5",
                                  product.condition === 'New' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30",
                                  product.condition === 'Renewed' && "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30",
                                  product.condition === 'Used' && "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30"
                                )}
                              >
                                {product.condition}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <a 
                                href={product.affiliateLink} 
                                onClick={() => handleAffiliateClick(product, filteredProducts.indexOf(product))}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary underline text-sm line-clamp-2 block"
                              >
                                {product.name}
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-card/50">
                    <div className="bg-muted/30 p-4 rounded-full mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No products found</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                      We couldn't find any products matching your current filters. Try adjusting your search or filters.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
                
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  Prices and availability are subject to change.
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
              <div className="bg-muted/30 p-6 rounded-full mb-6">
                <Info className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Data Coming Soon</h2>
              <p className="text-muted-foreground max-w-md text-lg">
                We are currently aggregating real-time price data for this category. 
                Please check back shortly for the best deals on <span className="font-medium text-foreground">{category.name}</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FilterPanelProps {
  filters: ReturnType<typeof useProductFilters>['filters']
  toggleArrayFilter: ReturnType<typeof useProductFilters>['toggleArrayFilter']
  setCapacityRange: ReturnType<typeof useProductFilters>['setCapacityRange']
}

function FilterPanel({
  filters,
  toggleArrayFilter,
  setCapacityRange
}: FilterPanelProps) {
  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <h2 className="sr-only">Filters</h2>
        <Accordion type="multiple" defaultValue={["condition", "capacity", "technology", "form-factor"]} className="w-full">
          <AccordionItem value="condition" className="border-b">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline pb-3 pt-0">Condition</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1 pb-3">
                {["New", "Used", "Renewed"].map((condition) => (
                  <div key={condition} className="flex items-center space-x-3 py-1.5">
                    <Checkbox
                      id={`condition-${condition}`}
                      checked={filters.condition?.includes(condition) || false}
                      onCheckedChange={() => toggleArrayFilter('condition', condition)}
                    />
                    <Label htmlFor={`condition-${condition}`} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{condition}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="capacity" className="border-b">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Capacity (TB)</AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center gap-2 pt-1 pb-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minCapacity ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null
                      setCapacityRange(val, filters.maxCapacity ?? null)
                    }}
                    className="w-full pr-8 bg-white dark:bg-secondary/40 shadow-sm focus-visible:ring-0 focus-visible:border-primary transition-colors"
                    aria-label="Minimum capacity in TB"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">TB</span>
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxCapacity ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null
                      setCapacityRange(filters.minCapacity ?? null, val)
                    }}
                    className="w-full pr-8 bg-white dark:bg-secondary/40 shadow-sm focus-visible:ring-0 focus-visible:border-primary transition-colors"
                    aria-label="Maximum capacity in TB"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">TB</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="technology" className="border-b">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Technology</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1 pb-3">
                {["HDD", "SSD", "SAS"].map((tech) => (
                  <div key={tech} className="flex items-center space-x-3 py-1.5">
                    <Checkbox
                      id={`tech-${tech}`}
                      checked={filters.technology?.includes(tech) || false}
                      onCheckedChange={() => toggleArrayFilter('technology', tech)}
                    />
                    <Label htmlFor={`tech-${tech}`} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{tech}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="form-factor" className="border-none">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Form Factor</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1 pb-3">
                {["Internal 3.5\"", "Internal 2.5\"", "External 3.5\"", "External 2.5\"", "M.2 NVMe", "M.2 SATA"].map((ff) => (
                  <div key={ff} className="flex items-center space-x-3 py-1.5">
                    <Checkbox
                      id={`ff-${ff}`}
                      checked={filters.formFactor?.includes(ff) || false}
                      onCheckedChange={() => toggleArrayFilter('formFactor', ff)}
                    />
                    <Label htmlFor={`ff-${ff}`} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{ff}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
