/**
 * Category data for the Idealo-styled categories page.
 * Uses the actual categories from lib/categories.ts
 */

import type { CategoryData } from "@/components/categories/IdealoCategoryOverview";
import { allCategories, getCategoryHierarchy } from "@/lib/categories";

/**
 * Get all visible child categories for the categories page.
 * Derives data directly from allCategories to stay in sync.
 */
export function getCategoriesForDisplay(): CategoryData[] {
  return Object.values(allCategories)
    .filter((category) => category.parent && !category.hidden) // Only child categories that aren't hidden
    .map((category) => ({
      title: category.name,
      slug: category.slug,
      // Only pass imageUrl if explicitly defined - don't generate fallbacks to avoid 404s
      imageUrl: category.imageUrl,
      popularLinks: category.popularFilters?.slice(0, 10).map((filter) => ({
        title: filter.label,
        href: `/${category.slug}?${filter.params}`,
      })),
    }));
}

/**
 * Get category hierarchy for display (parent with children)
 */
export function getCategoryHierarchyForDisplay() {
  return getCategoryHierarchy();
}
