"use client"

import Link from "next/link"
import { HardDrive, Dumbbell, Battery, Droplets, Baby } from "lucide-react"
import { getCategoryPath } from "@/lib/categories"
import { useCountry } from "@/hooks/use-country"

const categories = [
  { name: "SSDs", icon: HardDrive, slug: "hard-drives" },
  { name: "Protein", icon: Dumbbell, slug: "protein-powder" },
  { name: "Batteries", icon: Battery, slug: "batteries" },
  { name: "Detergent", icon: Droplets, slug: "laundry-detergent" },
  { name: "Diapers", icon: Baby, slug: "diapers" },
]

export function HeroCategoryPills() {
  const { country } = useCountry()

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-muted-foreground self-center">Popular:</span>
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <Link
            key={category.slug}
            href={getCategoryPath(category.slug, country)}
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 hover:bg-primary/10 hover:border-primary/50 transition-all no-underline shadow-sm hover:shadow-md"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {category.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
