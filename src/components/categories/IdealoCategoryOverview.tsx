/**
 * Idealo Category Overview Component
 *
 * Main category grid matching Idealo's categoryOverviewModule design.
 * Displays a responsive grid of category cards with images and popular links.
 *
 * Layout Breakpoints:
 * - Mobile: 1-2 columns
 * - Tablet: 2-3 columns
 * - Desktop: 4 columns
 *
 * Based on: https://www.idealo.de/preisvergleich/SubProductCategory/30311.html
 */

import { cn } from "@/lib/utils";
import { IdealoCategoryCard } from "./IdealoCategoryCard";

export interface CategoryData {
  title: string;
  slug: string;
  imageUrl?: string;
  popularLinks?: { title: string; href: string }[];
}

interface IdealoCategoryOverviewProps {
  categories: CategoryData[];
  className?: string;
}

export function IdealoCategoryOverview({
  categories,
  className,
}: IdealoCategoryOverviewProps) {
  return (
    <div className={cn("cn-categoryOverview", "w-full", className)}>
      {/* Category Grid */}
      <div
        className={cn(
          "cn-categoryOverview__grid",
          "grid",
          // Responsive grid columns
          "grid-cols-1",
          "min-[480px]:grid-cols-2",
          "min-[768px]:grid-cols-3",
          "min-[1024px]:grid-cols-4",
        )}
      >
        {categories.map((category) => (
          <IdealoCategoryCard
            key={category.slug}
            title={category.title}
            href={`/${category.slug}`}
            imageUrl={category.imageUrl}
            popularLinks={category.popularLinks}
          />
        ))}
      </div>
    </div>
  );
}
