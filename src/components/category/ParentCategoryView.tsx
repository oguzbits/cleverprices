import { Badge } from "@/components/ui/badge";
import { CategoryCard } from "@/components/ui/category-card";
import { Category, CategorySlug, getCategoryPath } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";
import { type CountryCode } from "@/lib/countries";
import Link from "next/link";
import * as React from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";

interface ParentCategoryViewProps {
  parentCategory: Omit<Category, "icon">;
  childCategories: (Omit<Category, "icon"> & {
    popularFilters?: { label: string; params: string }[];
  })[];
  countryCode: CountryCode;
}

export function ParentCategoryView({
  parentCategory,
  childCategories,
  countryCode,
}: ParentCategoryViewProps) {
  const breadcrumbItems = [
    { name: "Home", href: countryCode === "us" ? "/" : `/${countryCode}` },
    { name: parentCategory.name },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-12">
        <div className="mb-8 flex items-center gap-6">
          <div className="bg-primary/10 rounded-3xl p-5">
            {React.createElement(getCategoryIcon(parentCategory.slug), {
              className: "h-12 w-12 text-primary",
              "aria-hidden": "true",
            })}
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tight">
              {parentCategory.name}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-xl leading-relaxed">
              {parentCategory.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 text-sm font-bold">
              {childCategories.length}{" "}
              {childCategories.length === 1 ? "Category" : "Categories"}
            </Badge>
          </div>

          {/* Popular Filter Pills for SEO/UX */}
          {childCategories.some(
            (cat) => cat.popularFilters && cat.popularFilters.length > 0,
          ) && (
            <div className="bg-muted/30 flex flex-wrap items-center gap-3 rounded-2xl border px-6 py-4">
              <span className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                Popular:
              </span>
              <div className="flex flex-wrap gap-2">
                {childCategories.flatMap((cat) =>
                  (cat.popularFilters || []).map((filter) => {
                    const categoryPath = getCategoryPath(
                      cat.slug as CategorySlug,
                      countryCode,
                    );
                    return (
                      <Link
                        key={`${cat.slug}-${filter.params}`}
                        href={`${categoryPath}?${filter.params}`}
                        className="bg-card hover:bg-muted text-muted-foreground hover:text-primary rounded-full border px-3 py-1 text-xs font-bold transition-all hover:no-underline"
                      >
                        {filter.label}
                      </Link>
                    );
                  }),
                )}
              </div>
            </div>
          )}
        </div>
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
    </div>
  );
}
