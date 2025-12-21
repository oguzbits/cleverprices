"use client"

import Link from "next/link"
import { HardDrive, MemoryStick, Zap } from "lucide-react"
import { getCategoryPath } from "@/lib/categories"
import { useCountry } from "@/hooks/use-country"

const categories = [
  { name: "Hard Drives & SSDs", icon: HardDrive, slug: "hard-drives" },
  { name: "RAM & Memory", icon: MemoryStick, slug: "ram" },
  { name: "Power Supplies", icon: Zap, slug: "power-supplies" },
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
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-secondary shadow-sm hover:bg-secondary/80 transition-all no-underline"
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold text-primary group-hover:underline transition-colors">
              {category.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
