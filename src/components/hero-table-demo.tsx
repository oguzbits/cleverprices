"use client"

import { useState, useEffect, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Search, TrendingUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// Product Type Definitions
type HardDriveProduct = {
  id: string
  name: string
  price: number
  capacity: number
  capacityUnit: string
  pricePerTB: number
  warranty: string
  formFactor: string
  technology: string
  condition: "New" | "Used" | "Renewed"
  brand: string
}

type BatteryProduct = {
  id: string
  name: string
  price: number
  packSize: number
  pricePerUnit: number
  batteryType: "AA" | "AAA" | "C" | "D"
  condition: "New" | "Used" | "Renewed"
  brand: string
  warranty: string
}

type DogFoodProduct = {
  id: string
  name: string
  price: number
  weight: number
  weightUnit: string
  pricePerLb: number
  size: "Small Breed" | "Medium Breed" | "Large Breed"
  type: "Dry" | "Wet"
  ageGroup: "Puppy" | "Adult" | "Senior"
  condition: "New" | "Used" | "Renewed"
  brand: string
}

type ProductCategory = "harddrives" | "batteries" | "dogfood"

// Hard Drive Products
const hardDriveProducts: HardDriveProduct[] = [
  {
    id: "1",
    name: "Seagate Exos X18 18TB",
    price: 202.13,
    capacity: 18.0,
    capacityUnit: "TB",
    pricePerTB: 11.229,
    warranty: "2 years",
    formFactor: "External 2.5\"",
    technology: "HDD",
    condition: "Used" as const,
    brand: "Seagate"
  },
  {
    id: "2",
    name: "Toshiba MG09 18TB",
    price: 215.50,
    capacity: 18.0,
    capacityUnit: "TB",
    pricePerTB: 11.972,
    warranty: "5 years",
    formFactor: "Internal 3.5\"",
    technology: "HDD",
    condition: "New" as const,
    brand: "Toshiba"
  },
  {
    id: "3",
    name: "WD Red Pro 14TB",
    price: 239.99,
    capacity: 14.0,
    capacityUnit: "TB",
    pricePerTB: 17.142,
    warranty: "5 years",
    formFactor: "Internal 3.5\"",
    technology: "HDD",
    condition: "New" as const,
    brand: "Western Digital"
  },
  {
    id: "4",
    name: "Samsung 870 QVO 8TB",
    price: 349.00,
    capacity: 8.0,
    capacityUnit: "TB",
    pricePerTB: 43.625,
    warranty: "3 years",
    formFactor: "Internal 2.5\"",
    technology: "SSD",
    condition: "Used" as const,
    brand: "Samsung"
  },
  {
    id: "5",
    name: "Crucial MX500 4TB",
    price: 179.99,
    capacity: 4.0,
    capacityUnit: "TB",
    pricePerTB: 44.997,
    warranty: "5 years",
    formFactor: "Internal 2.5\"",
    technology: "SSD",
    condition: "New" as const,
    brand: "Crucial"
  }
].sort((a, b) => a.pricePerTB - b.pricePerTB)

// Battery Products
const batteryProducts: BatteryProduct[] = [
  {
    id: "1",
    name: "AmazonBasics AA 48-Pack",
    price: 11.99,
    packSize: 48,
    pricePerUnit: 0.250,
    batteryType: "AA" as const,
    condition: "New" as const,
    brand: "AmazonBasics",
    warranty: "1 year"
  },
  {
    id: "2",
    name: "Energizer AAA 24-Pack",
    price: 8.99,
    packSize: 24,
    pricePerUnit: 0.375,
    batteryType: "AAA" as const,
    condition: "New" as const,
    brand: "Energizer",
    warranty: "2 years"
  },
  {
    id: "3",
    name: "Duracell AA 20-Pack",
    price: 12.99,
    packSize: 20,
    pricePerUnit: 0.650,
    batteryType: "AA" as const,
    condition: "New" as const,
    brand: "Duracell",
    warranty: "5 years"
  },
  {
    id: "4",
    name: "Rayovac C 12-Pack",
    price: 9.99,
    packSize: 12,
    pricePerUnit: 0.833,
    batteryType: "C" as const,
    condition: "New" as const,
    brand: "Rayovac",
    warranty: "3 years"
  },
  {
    id: "5",
    name: "Duracell D 8-Pack",
    price: 11.99,
    packSize: 8,
    pricePerUnit: 1.499,
    batteryType: "D" as const,
    condition: "New" as const,
    brand: "Duracell",
    warranty: "5 years"
  }
].sort((a, b) => a.pricePerUnit - b.pricePerUnit)

// Dog Food Products
const dogFoodProducts: DogFoodProduct[] = [
  {
    id: "1",
    name: "Purina Pro Plan Adult",
    price: 47.99,
    weight: 35,
    weightUnit: "lbs",
    pricePerLb: 1.371,
    size: "Large Breed" as const,
    type: "Dry" as const,
    ageGroup: "Adult" as const,
    condition: "New" as const,
    brand: "Purina"
  },
  {
    id: "2",
    name: "Blue Buffalo Senior",
    price: 54.99,
    weight: 30,
    weightUnit: "lbs",
    pricePerLb: 1.833,
    size: "Medium Breed" as const,
    type: "Dry" as const,
    ageGroup: "Senior" as const,
    condition: "New" as const,
    brand: "Blue Buffalo"
  },
  {
    id: "3",
    name: "Royal Canin Puppy",
    price: 59.99,
    weight: 30,
    weightUnit: "lbs",
    pricePerLb: 2.000,
    size: "Small Breed" as const,
    type: "Dry" as const,
    ageGroup: "Puppy" as const,
    condition: "New" as const,
    brand: "Royal Canin"
  },
  {
    id: "4",
    name: "Hill's Science Diet Adult",
    price: 64.99,
    weight: 30,
    weightUnit: "lbs",
    pricePerLb: 2.166,
    size: "Medium Breed" as const,
    type: "Dry" as const,
    ageGroup: "Adult" as const,
    condition: "New" as const,
    brand: "Hill's"
  },
  {
    id: "5",
    name: "Wellness CORE Grain-Free",
    price: 69.99,
    weight: 26,
    weightUnit: "lbs",
    pricePerLb: 2.692,
    size: "Large Breed" as const,
    type: "Dry" as const,
    ageGroup: "Adult" as const,
    condition: "New" as const,
    brand: "Wellness"
  }
].sort((a, b) => a.pricePerLb - b.pricePerLb)

// Category Configuration
const categoryConfig = {
  harddrives: {
    title: "Disk Price Comparison",
    count: "100 disks",
    url: "bestprices.today/categories/storage",
    unitLabel: "Price/TB",
    insightText: "The 18TB drive is 4x cheaper per TB than the 8TB SSD!",
    filters: {
      filter1: { title: "Condition", options: ["New", "Used", "Renewed"] },
      filter2: { title: "Capacity", options: ["18 TB", "14 TB", "8 TB", "4 TB"] },
      filter3: { title: "Technology", options: ["HDD", "SSD"] }
    }
  },
  batteries: {
    title: "Battery Price Comparison",
    count: "50 packs",
    url: "bestprices.today/categories/batteries",
    unitLabel: "Price/Unit",
    insightText: "AmazonBasics 48-pack is 6x cheaper per battery than Duracell D 8-pack!",
    filters: {
      filter1: { title: "Condition", options: ["New", "Used", "Renewed"] },
      filter2: { title: "Battery Type", options: ["AA", "AAA", "C", "D"] },
      filter3: { title: "Pack Size", options: ["48 pack", "24 pack", "20 pack", "12 pack"] }
    }
  },
  dogfood: {
    title: "Dog Food Price Comparison",
    count: "75 products",
    url: "bestprices.today/categories/pet-supplies",
    unitLabel: "Price/lb",
    insightText: "Purina Pro Plan is 2x cheaper per pound than premium brands!",
    filters: {
      filter1: { title: "Size", options: ["Small Breed", "Medium Breed", "Large Breed"] },
      filter2: { title: "Type", options: ["Dry", "Wet"] },
      filter3: { title: "Age Group", options: ["Puppy", "Adult", "Senior"] }
    }
  }
}

const categories: ProductCategory[] = ["harddrives", "batteries", "dogfood"]

export function HeroTableDemo() {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)
  
  // React Compiler automatically memoizes these - no need for useMemo
  const currentCategory = categories[currentCategoryIndex]
  const config = categoryConfig[currentCategory]

  // Rotation logic - increased to 8s for better performance
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeOut(true)
      setTimeout(() => {
        // Use startTransition for non-urgent state updates
        startTransition(() => {
          setCurrentCategoryIndex((prev) => (prev + 1) % categories.length)
        })
        setFadeOut(false)
      }, 300) // Half of transition duration
    }, 8000) // Increased from 5000ms to 8000ms

    return () => clearInterval(interval)
  }, [])

  // React Compiler automatically memoizes this - no need for useMemo
  const products = 
    currentCategory === "harddrives" ? hardDriveProducts :
    currentCategory === "batteries" ? batteryProducts :
    dogFoodProducts;

  return (
    <div className="relative w-full max-w-5xl mx-auto perspective-1000">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-primary/10 rounded-full blur-[120px] -z-10" />

      <Card className="border-border/50 bg-card shadow-2xl overflow-hidden ring-1 ring-border">
        {/* Top Bar (Browser/App Header) */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="h-4 w-px bg-border shrink-0" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-1">
              <Search className="w-3 h-3 shrink-0" />
              <span className="truncate">{config.url}</span>
            </div>
          </div>
          
          {/* Value Proposition Badge */}
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] animate-pulse shrink-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Sorted by Unit Price
          </Badge>
        </div>

        <div className={cn("flex h-[400px] transition-opacity duration-300", fadeOut && "opacity-50")} style={{ willChange: fadeOut ? 'opacity' : 'auto' }}>
          {/* Sidebar */}
          <div className="w-32 sm:w-48 border-r border-border bg-muted/20 p-2 sm:p-4 hidden sm:block">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-foreground mb-3">{config.filters.filter1.title}</h3>
                <div className="space-y-2">
                  {config.filters.filter1.options.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-[3px] bg-primary/80" />
                      <span className="text-[11px] text-muted-foreground">{option}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-foreground mb-3">{config.filters.filter2.title}</h3>
                <div className="space-y-2">
                  {config.filters.filter2.options.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-[3px] border border-muted-foreground/30" />
                      <span className="text-[11px] text-muted-foreground">{option}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-foreground mb-3">{config.filters.filter3.title}</h3>
                <div className="space-y-2">
                  {config.filters.filter3.options.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-[3px] border border-muted-foreground/30" />
                      <span className="text-[11px] text-muted-foreground">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted/40">
            {/* Page Header */}
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">{config.title}</h2>
                <span className="text-[10px] text-muted-foreground">· {config.count}</span>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden">
              <div className="w-full min-w-[600px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-[10px] font-semibold text-muted-foreground bg-muted/50">
                  <div className="col-span-2 flex items-center gap-1 text-primary">
                    <TrendingUp className="w-3 h-3" />
                    {config.unitLabel}
                  </div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">
                    {currentCategory === "harddrives" && "Capacity"}
                    {currentCategory === "batteries" && "Pack Size"}
                    {currentCategory === "dogfood" && "Weight"}
                  </div>
                  <div className="col-span-2">
                    {currentCategory === "harddrives" && "Warranty"}
                    {currentCategory === "batteries" && "Warranty"}
                    {currentCategory === "dogfood" && "Size"}
                  </div>
                  <div className="col-span-1">
                    {currentCategory === "harddrives" && "Tech"}
                    {currentCategory === "batteries" && "Type"}
                    {currentCategory === "dogfood" && "Type"}
                  </div>
                  <div className="col-span-1">Cond.</div>
                  <div className="col-span-2">Link</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border">
                  {products.map((product: any, idx) => (
                    <div 
                      key={product.id}
                      className={cn(
                        "grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-[11px] transition-colors hover:bg-muted/50",
                        idx === 0 && "bg-primary/10 ring-1 ring-primary/20"
                      )}
                    >
                      <div className="col-span-2 font-mono font-medium text-primary flex items-center gap-2">
                        ${
                          currentCategory === "harddrives" 
                            ? (product as HardDriveProduct).pricePerTB.toFixed(3)
                            : currentCategory === "batteries"
                            ? (product as BatteryProduct).pricePerUnit.toFixed(3)
                            : (product as DogFoodProduct).pricePerLb.toFixed(3)
                        }
                        {idx === 0 && (
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-0 h-4 px-1.5 text-[8px] animate-in zoom-in">
                            Best
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-2 font-medium text-foreground">
                        ${product.price.toFixed(2)}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {currentCategory === "harddrives" && `${(product as HardDriveProduct).capacity} ${(product as HardDriveProduct).capacityUnit}`}
                        {currentCategory === "batteries" && `${(product as BatteryProduct).packSize} pack`}
                        {currentCategory === "dogfood" && `${(product as DogFoodProduct).weight} ${(product as DogFoodProduct).weightUnit}`}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {currentCategory === "harddrives" && (product as HardDriveProduct).warranty}
                        {currentCategory === "batteries" && (product as BatteryProduct).warranty}
                        {currentCategory === "dogfood" && (product as DogFoodProduct).size}
                      </div>
                      <div className="col-span-1 text-muted-foreground">
                        {currentCategory === "harddrives" && (product as HardDriveProduct).technology}
                        {currentCategory === "batteries" && (product as BatteryProduct).batteryType}
                        {currentCategory === "dogfood" && (product as DogFoodProduct).type}
                      </div>
                      <div className="col-span-1">
                        <Badge variant="secondary" className={cn(
                          "h-4 px-1.5 text-[9px] border-0",
                          product.condition === "New" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" :  
                          product.condition === "Used" ? "bg-orange-500/20 text-orange-700 dark:text-orange-400" :
                          "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                        )}>
                          {product.condition}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <span className="text-blue-400 hover:underline cursor-pointer truncate block">
                          {product.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Floating Insight - Always visible */}
      <div className="absolute -right-6 top-1/3 bg-background/90 backdrop-blur-md p-3 rounded-xl border border-primary/30 shadow-xl max-w-[180px] animate-in fade-in slide-in-from-right-4 duration-700">
        <div className="flex items-start gap-2">
          <div className="p-1.5 bg-primary/10 rounded-full shrink-0">
            <Check className="w-3 h-3 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-primary mb-0.5">Hidden Value Found</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {config.insightText}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
