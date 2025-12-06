"use client"

import { TrendingDown, HardDrive } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { getCountryByCode } from "@/lib/countries"

interface Deal {
  id: string
  name: string
  category: string
  categorySlug: string
  parentSlug: string
  originalPrice: number
  bestUnitPrice: number
  unitLabel: string
  savings: number
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  badge?: string
  priceHistory: number[] // Last 7 data points
  lastChecked: string
}

const deals: Deal[] = [
  {
    id: "101",
    name: "SAMSUNG 990 PRO SSD 2TB NVMe M.2 PCIe Gen4",
    category: "Hard Drives & SSDs",
    categorySlug: "hard-drives",
    parentSlug: "electronics",
    originalPrice: 197.99,
    bestUnitPrice: 98.99,
    unitLabel: "TB",
    savings: 0,
    icon: HardDrive,
    iconColor: "from-muted/50 to-muted",
    badge: "Most Viewed",
    priceHistory: [160, 155, 158, 140, 120, 100, 94.99],
    lastChecked: "2 mins ago"
  },
  {
    id: "102",
    name: "Seagate Exos X18 18TB Enterprise HDD",
    category: "Hard Drives & SSDs",
    categorySlug: "hard-drives",
    parentSlug: "electronics",
    originalPrice: 319.99,
    bestUnitPrice: 17.77,
    unitLabel: "TB",
    savings: 94,
    icon: HardDrive,
    iconColor: "from-muted/50 to-muted",
    badge: "Best Value",
    priceHistory: [280, 275, 260, 255, 240, 250, 249.99], // Price history of the Unit Total, or per Unit? Let's assume Unit Total for graph usually.
    lastChecked: "Just now"
  },
  {
    id: "103",
    name: "WD_BLACK 2TB SN850X NVMe Internal Gaming SSD",
    category: "Hard Drives & SSDs",
    categorySlug: "hard-drives",
    parentSlug: "electronics",
    originalPrice: 176.90,
    bestUnitPrice: 88.45,
    unitLabel: "TB",
    savings: 0,
    icon: HardDrive,
    iconColor: "from-muted/50 to-muted",
    priceHistory: [180, 180, 180, 180, 180, 180, 180], // Flat line
    lastChecked: "1 hour ago"
  }
]

// Simple SVG Sparkline Component
function Sparkline({ data, color = "currentColor", className }: { data: number[], color?: string, className?: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  // Create SVG path
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((d - min) / range) * 100
    return `${x},${y}`
  }).join(" ")

  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function FeaturedDeals({ country = "us" }: { country?: string }) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Get country configuration
  const countryConfig = getCountryByCode(country)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(countryConfig?.locale || 'en-US', {
      style: 'currency',
      currency: countryConfig?.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Show all 3 deals
  const getVisibleDeals = () => {
    return deals.slice(0, 3) 
  }

  return (
    <section 
      id="top-value-opportunities"
      className="container px-4 mx-auto py-4 sm:py-10 scroll-mt-20 sm:scroll-mt-32"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-end mb-4 border-b border-border pb-2">
         <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            Top Value <span className="text-muted-foreground font-normal text-sm hidden xs:inline">/ Low Unit Price</span>
         </h2>
         <Link href={`/${country}/categories`} className="text-xs font-medium text-primary hover:underline whitespace-nowrap">
          View All
        </Link>
      </div>

      <div className="w-full text-sm overflow-hidden rounded-lg border border-border/50">
        {/* Table Header */}
        <div className="grid grid-cols-[1.5rem_1fr_5rem_3.5rem] sm:grid-cols-[3rem_1fr_8rem_6rem_6rem] gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/20 border-b border-border/50">
           <div className="text-center">#</div>
           <div>Product</div>
           <div className="hidden sm:block">Category</div>
           <div className="text-right">Unit Price</div>
           <div className="text-right">Trend</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/50">
          {getVisibleDeals().map((deal, idx) => (
            <Link 
              key={`${deal.id}-${idx}`} 
              className="grid grid-cols-[1.5rem_1fr_5rem_3.5rem] sm:grid-cols-[3rem_1fr_8rem_6rem_6rem] gap-2 sm:gap-4 px-2 sm:px-3 py-3 items-center hover:bg-muted/30 transition-colors group no-underline text-foreground"
              href={`/${country}/${deal.parentSlug}/${deal.categorySlug}`}
            >
              {/* Rank */}
              <div className="text-center font-mono font-medium text-muted-foreground group-hover:text-primary text-xs sm:text-sm">
                {idx + 1}
              </div>

              {/* Product */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
                <div className="flex-shrink-0 w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hidden xs:flex">
                   <deal.icon className="h-3.5 w-3.5" />
                </div>
                <div className="truncate font-medium group-hover:text-primary transition-colors text-sm">
                  {deal.name}
                  <div className="sm:hidden text-[10px] text-muted-foreground font-normal truncate">{deal.category}</div>
                </div>
                {idx === 0 && (
                   <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:block" />
                )}
              </div>

              {/* Category (Desktop) */}
              <div className="hidden sm:block text-xs text-muted-foreground truncate">
                {deal.category}
              </div>

              {/* Price */}
              <div className="text-right font-mono font-bold tracking-tight text-foreground text-xs sm:text-sm">
                {formatCurrency(deal.bestUnitPrice)}
                <span className="text-[10px] text-muted-foreground font-sans ml-0.5 text-normal block sm:inline">/{deal.unitLabel}</span>
              </div>

              {/* Trend */}
              <div className="text-right text-xs">
                {deal.savings > 0 ? (
                  <span className="text-emerald-600 font-medium inline-flex items-center justify-end gap-0.5 sm:gap-1">
                    <span className="hidden sm:inline">Drop</span>
                    <TrendingDown className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="text-muted-foreground">Stable</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
