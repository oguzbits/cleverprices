import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Category } from "@/lib/categories";

import { getCategoryIcon } from "@/lib/category-icons";

interface CategoryHeaderProps {
  category: Omit<Category, 'icon'>;
  countryCode: string;
  breadcrumbs: (Omit<Category, 'icon'> & { Icon: React.ComponentType<{ className?: string }> })[];
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
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center flex-wrap gap-1.5 gap-y-2 sm:gap-2 text-sm sm:text-base text-muted-foreground leading-normal">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li className="text-muted-foreground/50">/</li>
          <li>
            <Link href={`/${countryCode}/categories`} className="hover:text-foreground transition-colors">
              Categories
            </Link>
          </li>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.slug}>
              <li className="text-muted-foreground/50">/</li>
              <li>
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-foreground font-medium wrap-break-word">{crumb.name}</span>
                ) : (
                  <Link 
                    href={`/${countryCode}/${crumb.parent ? crumb.parent + '/' : ''}${crumb.slug}`} 
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>

      {/* Header Content */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" aria-hidden="true" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{category.name}</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {productCount > 0 ? `Showing ${productCount} products` : category.description}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8 bg-card dark:bg-card shadow-sm focus-visible:ring-0 focus-visible:border-primary transition-colors"
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
