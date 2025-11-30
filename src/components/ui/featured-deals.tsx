"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, Zap, HardDrive, Dumbbell, Droplets, Baby, Battery } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Deal {
  id: string
  name: string
  category: string
  categorySlug: string
  originalPrice: number
  bestUnitPrice: number
  unitLabel: string
  savings: number
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  badge?: string
}

const deals: Deal[] = [
  {
    id: "1",
    name: "Samsung 870 EVO 4TB SSD",
    category: "Storage",
    categorySlug: "storage",
    originalPrice: 349.99,
    bestUnitPrice: 87.50,
    unitLabel: "TB",
    savings: 42,
    icon: HardDrive,
    iconColor: "from-muted/50 to-muted",
    badge: "Lowest in 30 days"
  },
  {
    id: "2",
    name: "Optimum Nutrition Whey 5kg",
    category: "Protein Powder",
    categorySlug: "protein-powder",
    originalPrice: 89.99,
    bestUnitPrice: 17.99,
    unitLabel: "kg",
    savings: 35,
    icon: Dumbbell,
    iconColor: "from-muted/50 to-muted"
  },
  {
    id: "3",
    name: "Tide Pods Laundry Detergent",
    category: "Household",
    categorySlug: "laundry-detergent",
    originalPrice: 45.99,
    bestUnitPrice: 0.23,
    unitLabel: "load",
    savings: 28,
    icon: Droplets,
    iconColor: "from-muted/50 to-muted",
    badge: "Hot Deal"
  },
  {
    id: "4",
    name: "Pampers Swaddlers Size 3",
    category: "Baby Care",
    categorySlug: "diapers",
    originalPrice: 54.99,
    bestUnitPrice: 0.18,
    unitLabel: "diaper",
    savings: 31,
    icon: Baby,
    iconColor: "from-muted/50 to-muted"
  },
  {
    id: "5",
    name: "Duracell AA Batteries 48-Pack",
    category: "Batteries",
    categorySlug: "batteries",
    originalPrice: 29.99,
    bestUnitPrice: 0.42,
    unitLabel: "battery",
    savings: 45,
    icon: Battery,
    iconColor: "from-muted/50 to-muted",
    badge: "Best Value"
  }
]

export function FeaturedDeals() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const visibleDeals = 3

  useEffect(() => {
    if (isHovered) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % deals.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isHovered])

  const getVisibleDeals = () => {
    const visible = []
    for (let i = 0; i < visibleDeals; i++) {
      visible.push(deals[(currentIndex + i) % deals.length])
    }
    return visible
  }

  return (
    <section 
      className="container px-4 mx-auto py-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4 border-border text-muted-foreground bg-muted/30">
          Live Data
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Top Value Opportunities</h2>
        <p className="text-muted-foreground">Highest savings by unit price analysis • Updated hourly</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-live="polite" aria-atomic="true">
        {getVisibleDeals().map((deal, idx) => (
          <Link 
            key={`${deal.id}-${idx}`} 
            className="no-underline" 
            href={`/categories/${deal.categorySlug}`}
            aria-label={`${deal.name} in ${deal.category}, $${deal.bestUnitPrice} per ${deal.unitLabel}, ${deal.savings}% savings`}
          >
            <Card className="group relative overflow-hidden bg-card/40 backdrop-blur-xl border-primary/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full">
              {deal.badge && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-primary border-0 text-primary-foreground shadow-lg text-xs">
                    {deal.badge}
                  </Badge>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-4 rounded-lg bg-muted border border-border flex items-center justify-center">
                  <deal.icon className="h-6 w-6 text-foreground/70" />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{deal.category}</p>
                    <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {deal.name}
                    </h3>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground line-through">
                        ${deal.originalPrice}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        ${deal.bestUnitPrice}
                        <span className="text-sm font-normal text-muted-foreground">/{deal.unitLabel}</span>
                      </p>
                    </div>
                    
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-3 py-1">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {deal.savings}%
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center group-hover:text-primary transition-colors">
                      View all {deal.category} deals →
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {deals.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex 
                ? "w-6 bg-primary" 
                : "w-1.5 bg-muted hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
