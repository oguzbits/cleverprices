"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { getCategoryHierarchy } from "@/lib/categories"
import { isValidCountryCode, DEFAULT_COUNTRY } from "@/lib/countries"
import { CategoryCard } from "@/components/ui/category-card"

export default function CategoriesPageWithCountry() {
  const params = useParams()
  const countryCode = params.country as string
  const validCountry = isValidCountryCode(countryCode) ? countryCode : DEFAULT_COUNTRY
  const categoryHierarchy = getCategoryHierarchy()

  return (
    <div className="container pt-6 pb-16 mx-auto px-4">
      {/* Breadcrumb */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href={`/${validCountry}`} className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground font-medium">Categories</li>
        </ol>
      </nav>
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">All Categories</h1>
        <p className="text-xl text-muted-foreground">
          Browse our comprehensive list of tracked product categories.
        </p>
      </div>
      <div className="space-y-16">
        {categoryHierarchy.map((hierarchy) => (
          <section key={hierarchy.parent.slug} aria-labelledby={`${hierarchy.parent.slug}-heading`}>
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <hierarchy.parent.icon className="h-8 w-8 text-primary" aria-hidden="true" />
              <h2 id={`${hierarchy.parent.slug}-heading`} className="text-2xl font-bold">{hierarchy.parent.name}</h2>
              <Badge variant="outline" className="ml-auto">
                {hierarchy.children.length} {hierarchy.children.length === 1 ? 'category' : 'categories'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hierarchy.children.map((category) => (
                <CategoryCard key={category.slug} category={category} country={validCountry} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
