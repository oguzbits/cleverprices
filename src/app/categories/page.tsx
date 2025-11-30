"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Coffee, Home, ShoppingCart, Dog, HardDrive, Usb, Battery, Utensils, Wheat, Milk, Trash2, Droplets } from "lucide-react"

const categoryGroups = [
  {
    name: "Tech",
    icon: Smartphone,
    subcategories: [
      { name: "Hard Drives", description: "HDD and SSD storage solutions", count: "1,240", slug: "hard-drives", icon: HardDrive },
      { name: "MicroSD Cards", description: "Expandable storage for devices", count: "320", slug: "microsd-cards", icon: Smartphone },
      { name: "USB Drives", description: "Portable file storage", count: "450", slug: "usb-drives", icon: Usb },
      { name: "Batteries", description: "AA, AAA, and coin cells", count: "890", slug: "batteries", icon: Battery },
    ]
  },
  {
    name: "Food",
    icon: Coffee,
    subcategories: [
      { name: "Coffee", description: "Whole bean, ground, and pods", count: "2,100", slug: "coffee", icon: Coffee },
      { name: "Protein Powder", description: "Whey, casein, and plant-based", count: "560", slug: "protein-powder", icon: Milk },
      { name: "Rice & Pasta", description: "Bulk grains and noodles", count: "1,400", slug: "rice-pasta", icon: Wheat },
      { name: "Snacks", description: "Chips, nuts, and bars", count: "3,200", slug: "snacks", icon: Utensils },
    ]
  },
  {
    name: "Household",
    icon: Home,
    subcategories: [
      { name: "Detergent", description: "Liquid, powder, and pods", count: "450", slug: "detergent", icon: Home },
      { name: "Paper Products", description: "Toilet paper and paper towels", count: "320", slug: "paper-products", icon: Home },
      { name: "Trash Bags", description: "Kitchen and outdoor bags", count: "210", slug: "trash-bags", icon: Trash2 },
      { name: "Dishwasher Tabs", description: "Pods and tablets", count: "180", slug: "dishwasher-tabs", icon: Droplets },
    ]
  },
]

export default function CategoriesPage() {
  return (
    <div className="container py-12 mx-auto px-4">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">All Categories</h1>
        <p className="text-xl text-muted-foreground">
          Browse our comprehensive list of tracked product categories.
        </p>
      </div>

      <div className="space-y-16">
        {categoryGroups.map((group) => (
          <section key={group.name} aria-labelledby={`${group.name.toLowerCase()}-heading`}>
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <group.icon className="h-8 w-8 text-primary" aria-hidden="true" />
              <h2 id={`${group.name.toLowerCase()}-heading`} className="text-2xl font-bold">{group.name}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {group.subcategories.map((sub) => (
                <Link key={sub.slug} className="no-underline" href={`/categories/${sub.slug}`} aria-label={`Browse ${sub.name}: ${sub.description}, ${sub.count} items`}>
                  <Card className="relative h-full bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all duration-300 cursor-pointer border-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 group">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <sub.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                        <Badge variant="secondary" className="text-xs">
                          {sub.count} items
                        </Badge>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">{sub.name}</CardTitle>
                      <CardDescription>{sub.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Last updated: 2 hours ago
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
