"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { Category } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/ui/category-card";

import { Breadcrumbs } from "@/components/breadcrumbs";

interface ParentCategoryViewProps {
  parentCategory: Omit<Category, "icon">;
  childCategories: Omit<Category, "icon">[];
  countryCode: string;
}

export function ParentCategoryView({
  parentCategory,
  childCategories,
  countryCode,
}: ParentCategoryViewProps) {
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Categories", href: `/${countryCode}/categories` },
    { name: parentCategory.name },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-12">
        <div className="mb-4 flex items-center gap-4">
          <div className="bg-primary/10 rounded-2xl p-4">
            {React.createElement(getCategoryIcon(parentCategory.slug), {
              className: "h-10 w-10 text-primary",
              "aria-hidden": "true",
            })}
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {parentCategory.name}
            </h1>
            <p className="text-muted-foreground mt-2 text-xl">
              {parentCategory.description}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-base">
          {childCategories.length}{" "}
          {childCategories.length === 1 ? "Category" : "Categories"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}
