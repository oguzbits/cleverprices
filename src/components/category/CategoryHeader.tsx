import { Breadcrumbs } from "@/components/breadcrumbs";
import { Category } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";
import * as React from "react";
import { SearchInput } from "./SearchInput";

interface CategoryHeaderProps {
  category: Omit<Category, "icon">;
  countryCode: string;
  breadcrumbs: (Omit<Category, "icon"> & {
    Icon: React.ComponentType<{ className?: string }>;
  })[];
  productCount: number;
  filterTrigger?: React.ReactNode;
}

export function CategoryHeader({
  category,
  countryCode,
  breadcrumbs,
  filterTrigger,
}: CategoryHeaderProps) {
  const Icon = getCategoryIcon(category.slug);

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Categories", href: `/${countryCode}/categories` },
    ...breadcrumbs.map((crumb, idx) => ({
      name: crumb.name,
      href: `/${countryCode}/${crumb.parent ? crumb.parent + "/" : ""}${crumb.slug}`,
      icon: idx === breadcrumbs.length - 1 ? Icon : undefined,
      suffix: idx === breadcrumbs.length - 1 ? `on Amazon ${countryCode.toUpperCase()}` : undefined,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Breadcrumbs (includes H1) + Search / Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Breadcrumbs items={breadcrumbItems} className="mb-0" />

        <div className="hidden md:flex items-center gap-2">
          <SearchInput />
          <div className="lg:hidden">
            {filterTrigger}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Controls (Below MD) */}
      <div className="flex items-center gap-2 md:hidden">
        <SearchInput />
        {filterTrigger}
      </div>
    </div>
  );
}
