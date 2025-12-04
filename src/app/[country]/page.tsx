"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCategoryHierarchy, getCategoryPath } from "@/lib/categories"
import { isValidCountryCode, DEFAULT_COUNTRY } from "@/lib/countries"

export default function CategoriesPage() {
  const params = useParams()
  const countryCode = params.country as string
  const validCountry = isValidCountryCode(countryCode) ? countryCode : DEFAULT_COUNTRY
  
  const categoryHierarchy = getCategoryHierarchy()

  return (
    <div className="container py-12 mx-auto px-4">
      {/* Breadcrumb */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {hierarchy.children.map((category) => (
                <Link 
                  key={category.slug} 
                  className="no-underline" 
                  href={getCategoryPath(category.slug, validCountry)} 
                  aria-label={`Browse ${category.name}: ${category.description}`}
                >
                  <Card className="relative h-full bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all duration-300 cursor-pointer border-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 group">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <category.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                        {category.unitType && (
                          <Badge variant="secondary" className="text-xs">
                            Per {category.unitType}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Compare by {category.unitType || 'unit'}
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
