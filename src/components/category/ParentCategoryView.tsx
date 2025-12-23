"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { getCategoryIcon } from "@/lib/category-icons"
import { Category } from "@/lib/categories"
import { Button } from "@/components/ui/button"
import { CategoryCard } from "@/components/ui/category-card"

interface ParentCategoryViewProps {
  parentCategory: Omit<Category, 'icon'>
  childCategories: Omit<Category, 'icon'>[]
  countryCode: string
}

export function ParentCategoryView({ parentCategory, childCategories, countryCode }: ParentCategoryViewProps) {
  return (
    <div className="container py-6 mx-auto px-4">
      {/* Breadcrumb */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-base text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/${countryCode}/categories`} className="hover:text-foreground transition-colors">
              Categories
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground font-medium">{parentCategory.name}</li>
        </ol>
      </nav>

      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-primary/10 rounded-2xl">
            {React.createElement(getCategoryIcon(parentCategory.slug), { className: "h-10 w-10 text-primary", "aria-hidden": "true" })}
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{parentCategory.name}</h1>
            <p className="text-xl text-muted-foreground mt-2">
              {parentCategory.description}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-base">
          {childCategories.length} {childCategories.length === 1 ? 'Category' : 'Categories'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {childCategories.map((category) => (
          <CategoryCard 
            key={category.slug} 
            category={category} 
            Icon={getCategoryIcon(category.slug)} 
            country={countryCode} 
          />
        ))}
      </div>

      {/* Back to Categories */}
      <div className="mt-12 text-center">
        <Button variant="outline" asChild>
          <Link href={`/${countryCode}/categories`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Categories
          </Link>
        </Button>
      </div>
    </div>
  )
}
