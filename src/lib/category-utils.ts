import { CATEGORY_MAP } from "./category-definitions";
import { CategoryData, CategorySlug } from "./category-types";

/**
 * Get full URL path for a category
 */
export function getCategoryPath(categorySlug: string): string {
  const category = CATEGORY_MAP[categorySlug as CategorySlug];
  if (!category) return "/";

  return `/${categorySlug}`;
}

/**
 * Check if a category is analytical (price-per-unit)
 */
export function isAnalyticalCategory(category: CategoryData): boolean {
  return category.categoryType === "analytical";
}

/**
 * Get breadcrumb trail for a category (slugs only or data objects)
 */
export function getBreadcrumbSlugs(categorySlug: CategorySlug): CategorySlug[] {
  const breadcrumbs: CategorySlug[] = [];
  let currentSlug: CategorySlug | undefined = categorySlug;

  while (currentSlug) {
    breadcrumbs.unshift(currentSlug);
    const currentData = CATEGORY_MAP[currentSlug] as CategoryData | undefined;
    currentSlug = currentData?.parent;
  }

  return breadcrumbs;
}
