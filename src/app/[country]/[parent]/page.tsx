"use client"

import Link from "next/link"
import { useParams, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { getCategoryBySlug, getChildCategories } from "@/lib/categories"
import { Button } from "@/components/ui/button"
import { isValidCountryCode, DEFAULT_COUNTRY } from "@/lib/countries"
import { CategoryCard } from "@/components/ui/category-card"

export default function ParentCategoryPageWithCountry() {
  const params = useParams()
  const countryCode = params.country as string
  const parentSlug = params.parent as string
  
  // If country code is invalid (e.g. it's actually a parent category like "electronics"),
  // redirect to the default country URL
  if (!isValidCountryCode(countryCode)) {
    redirect(`/${DEFAULT_COUNTRY}/${countryCode}/${parentSlug}`)
  }
  
  const validCountry = countryCode
  
  const parentCategory = getCategoryBySlug(parentSlug)
  const childCategories = getChildCategories(parentSlug)

  if (!parentCategory) {
    return (
      <div className="container py-12 mx-auto px-4">
        <div className="text-center py-24">
          <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The category you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href={`/${validCountry}`}>Browse All Categories</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 mx-auto px-4">
      {/* Breadcrumb */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/${validCountry}/categories`} className="hover:text-foreground transition-colors">
              Categories
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground font-medium">{parentCategory.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-primary/10 rounded-2xl">
            <parentCategory.icon className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{parentCategory.name}</h1>
            <p className="text-xl text-muted-foreground mt-2">
              {parentCategory.description}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {childCategories.length} {childCategories.length === 1 ? 'Category' : 'Categories'}
        </Badge>
      </div>

      {/* Child Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {childCategories.map((category) => (
          <CategoryCard key={category.slug} category={category} country={validCountry} />
        ))}
      </div>

      {/* Back to Categories */}
      <div className="mt-12 text-center">
        <Button variant="outline" asChild>
          <Link href={`/${validCountry}/categories`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Categories
          </Link>
        </Button>
      </div>
    </div>
  )
}
