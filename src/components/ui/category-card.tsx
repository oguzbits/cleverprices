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
      href={getCategoryPath(category.slug as CategorySlug, country)}
      aria-label={`Browse ${category.name}: ${category.description}`}
      prefetch={true}
    >
      <div className="border-border/50 bg-card/40 hover:bg-muted/40 hover:border-primary/30 flex items-center rounded-lg border p-3 transition-all">
        <div className="bg-muted/50 text-muted-foreground group-hover:text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground group-hover:text-primary truncate text-base font-medium transition-colors">
              {category.name}
            </h3>
            {category.unitType && (
              <span className="bg-muted text-muted-foreground inline-flex items-center rounded px-1.5 py-0.5 text-sm font-medium tracking-wider uppercase">
                /{category.unitType}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-sm">
            {category.description}
          </p>
        </div>
        <ArrowRight className="text-muted-foreground/30 group-hover:text-primary ml-2 h-4 w-4 transition-all group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
