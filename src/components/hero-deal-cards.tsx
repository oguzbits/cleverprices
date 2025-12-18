"use client"

import { Badge } from "@/components/ui/badge"
import { useCountry } from "@/hooks/use-country"
import { getCountryByCode } from "@/lib/countries"
import { type ProductUIModel } from "@/lib/amazon-api"
import { ProductCard } from "@/components/product-card"

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

// Mock data for highlighted deals
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

  const highlightedDeals = getTopDeals()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {highlightedDeals.map((product) => (
          <ProductCard
            key={product.id}
            title={product.name}
            price={product.price}
            oldPrice={product.price * (1 + product.discount / 100)}
            currency={countryConfig?.currency || "USD"}
            url={product.affiliateLink}
            pricePerUnit={`${countryConfig?.currency || "$"}${product.pricePerTB.toFixed(2)}/TB`}
            countryCode={country}
            badgeText={product.condition === 'New' ? "Good Deal" : product.condition}
            badgeColor={product.condition === 'New' ? "blue" : "amber"}
            discountPercentage={product.discount}
          />
        ))}
      </div>
  )
}
