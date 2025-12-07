"use client"

import { Badge } from "@/components/ui/badge"
import { TrendingDown } from "lucide-react"
import { useCountry } from "@/hooks/use-country"
import { getCountryByCode } from "@/lib/countries"

// Real product data - imported from the actual products list
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

type ProductWithDiscount = Product & {
  discount: number
}

// Authentic storage products data - same as in the products page
const authenticStorageProducts: Product[] = [
  {
    id: 101,
    name: "SAMSUNG 990 PRO SSD 2TB NVMe M.2 PCIe Gen4",
    price: 197.99,
    capacity: 2000,
    capacityUnit: 'TB',
    pricePerTB: 98.995,
    warranty: "5 years",
    formFactor: "M.2 NVMe",
    technology: "SSD",
    condition: "New",
    affiliateLink: "https://amzn.to/48yJXRZ",
    brand: "Samsung"
  },
  {
    id: 102,
    name: "Seagate Exos X18 18TB Enterprise HDD",
    price: 319.99,
    capacity: 18000,
    capacityUnit: 'TB',
    pricePerTB: 17.77,
    warranty: "5 years",
    formFactor: "Internal 3.5\"",
    technology: "HDD",
    condition: "Used",
    affiliateLink: "https://amzn.to/4a1mQ50",
    brand: "Seagate"
  },
  {
    id: 103,
    name: "WD_BLACK 2TB SN850X NVMe Internal Gaming SSD",
    price: 176.90,
    capacity: 2000,
    capacityUnit: 'TB',
    pricePerTB: 88.45,
    warranty: "5 years",
    formFactor: "M.2 NVMe",
    technology: "SSD",
    condition: "New",
    affiliateLink: "https://amzn.to/4oFAfUa",
    brand: "Western Digital"
  },
  {
    id: 104,
    name: "Crucial MX500 2TB 3D NAND SATA 2.5 Inch Internal SSD",
    price: 134.99,
    capacity: 2000,
    capacityUnit: 'TB',
    pricePerTB: 67.495,
    warranty: "5 years",
    formFactor: "Internal 2.5\"",
    technology: "SSD",
    condition: "New",
    affiliateLink: "https://amzn.to/4pQefqv",
    brand: "Crucial"
  },
  {
    id: 105,
    name: "SanDisk 1TB Extreme Portable SSD",
    price: 109.99,
    capacity: 1000,
    capacityUnit: 'TB',
    pricePerTB: 109.99,
    warranty: "3 years",
    formFactor: "External 2.5\"",
    technology: "SSD",
    condition: "New",
    affiliateLink: "https://amzn.to/3KGJYeO",
    brand: "SanDisk"
  }
]

// Calculate discount percentage based on market average or typical retail price
// For demo purposes, we'll use a simple calculation based on pricePerTB
const calculateDiscount = (product: Product): number => {
  // Typical market prices per TB for different technologies
  const marketPrices = {
    'SSD': 120, // Average $/TB for SSDs
    'HDD': 25,  // Average $/TB for HDDs
    'SAS': 30   // Average $/TB for SAS
  }
  
  const marketPrice = marketPrices[product.technology]
  const discount = Math.round(((marketPrice - product.pricePerTB) / marketPrice) * 100)
  return Math.max(0, Math.min(discount, 99)) // Clamp between 0-99%
}

// Get the top 3 deals based on discount percentage
const getTopDeals = (): ProductWithDiscount[] => {
  return authenticStorageProducts
    .map(product => ({
      ...product,
      discount: calculateDiscount(product)
    }))
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 3)
}

export function HeroDealCards() {
  const { country } = useCountry()
  const countryConfig = getCountryByCode(country)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(countryConfig?.locale || "de-DE", {
      style: "currency",
      currency: countryConfig?.currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const topDeals = getTopDeals()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {topDeals.map((product) => {
        const wasPrice = product.price / (1 - product.discount / 100)
        
        return (
          <a
            key={product.id}
            href={product.affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 hover:border-primary/30 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 no-underline"
          >
            {/* Discount Badge */}
            <div className="absolute -top-2 -right-2 z-10">
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg px-2 py-1 text-xs font-bold">
                <TrendingDown className="h-3 w-3 mr-1" />
                -{product.discount}%
              </Badge>
            </div>

            {/* Condition Badge */}
            <div className="absolute top-3 left-3 z-10">
              <Badge 
                className={
                  product.condition === 'New' 
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs border-0"
                    : product.condition === 'Renewed'
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 text-xs border-0"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 text-xs border-0"
                }
              >
                {product.condition}
              </Badge>
            </div>

            {/* Product Image Placeholder */}
            <div className="w-full aspect-square bg-muted/30 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
              <div className="text-4xl text-muted-foreground/30">📦</div>
            </div>

            {/* Product Name */}
            <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {/* Price */}
            <div className="mt-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(wasPrice)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(product.pricePerTB)}/TB
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}
