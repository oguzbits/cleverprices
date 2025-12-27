import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Category } from "@/lib/categories";

import { getCategoryIcon } from "@/lib/category-icons";

import { Breadcrumbs } from "@/components/breadcrumbs";

interface CategoryHeaderProps {
  category: Omit<Category, "icon">;
  countryCode: string;
  breadcrumbs: (Omit<Category, "icon"> & {
    Icon: React.ComponentType<{ className?: string }>;
  })[];
  productCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function CategoryHeader({
  category,
  countryCode,
  breadcrumbs,
  productCount,
  searchValue,
  onSearchChange,
}: CategoryHeaderProps) {
  const Icon = getCategoryIcon(category.slug);

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Categories", href: `/${countryCode}/categories` },
    ...breadcrumbs.map((crumb) => ({
      name: crumb.name,
      href: `/${countryCode}/${crumb.parent ? crumb.parent + "/" : ""}${crumb.slug}`,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={breadcrumbItems} className="mb-0" />

      {/* Header Content */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Icon
              className="text-primary h-6 w-6 shrink-0 sm:h-8 sm:w-8"
              aria-hidden="true"
            />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {category.name}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {productCount > 0
              ? `Showing ${productCount} products`
              : category.description}
          </p>
        </div>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search products..."
              className="bg-card dark:bg-card focus-visible:border-primary pl-8 shadow-sm transition-colors focus-visible:ring-0"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search products"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
