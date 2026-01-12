import type { Category, CategorySlug } from "@/lib/categories";
import { getCategoryPath } from "@/lib/categories";
import { type CountryCode } from "@/lib/countries";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface CategoryCardProps {
  category: Omit<Category, "icon">;
  Icon: React.ComponentType<{ className?: string }>;
  country: CountryCode;
}

export function CategoryCard({ category, Icon, country }: CategoryCardProps) {
  return (
    <Link
      className="group no-underline"
      href={getCategoryPath(category.slug as CategorySlug)}
      aria-label={`Browse ${category.name}: ${category.description}`}
      prefetch={true}
    >
      <div className="hover:border-primary/30 flex items-center rounded-lg border border-gray-200 bg-white p-3 transition-all hover:bg-gray-50">
        <div className="group-hover:text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 transition-colors">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="group-hover:text-primary truncate text-base font-medium text-gray-900 transition-colors">
              {category.name}
            </h3>
            {category.unitType && (
              <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-sm font-medium tracking-wider text-gray-500 uppercase">
                /{category.unitType}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-gray-500">
            {category.description}
          </p>
        </div>
        <ArrowRight className="group-hover:text-primary ml-2 h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
