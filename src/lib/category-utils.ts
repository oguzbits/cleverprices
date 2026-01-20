import { CATEGORY_MANIFEST, CategoryManifestEntry } from "./category-manifest";
import { CategoryData, CategorySlug } from "./category-types";

/**
 * Get full URL path for a category
 */
export function getCategoryPath(categorySlug: string): string {
  const category = CATEGORY_MANIFEST[categorySlug as CategorySlug];
  if (!category) return "/";

  return `/${categorySlug}`;
}

/**
 * Check if a category is analytical (price-per-unit)
 * NOTE: This requires full CategoryData, so should be used with care in client.
 */
export function isAnalyticalCategory(category: CategoryData): boolean {
  return category.categoryType === "analytical";
}

/**
 * Get breadcrumb trail for a category (slugs only)
 */
export function getBreadcrumbSlugs(categorySlug: CategorySlug): CategorySlug[] {
  const breadcrumbs: CategorySlug[] = [];
  let current: CategorySlug | undefined = categorySlug;

  while (current) {
    breadcrumbs.unshift(current);
    const entry: CategoryManifestEntry | undefined = CATEGORY_MANIFEST[current];
    current = entry?.parent;
  }

  return breadcrumbs;
}

/**
 * Get unique values for a field from a set of products
 */
export function getUniqueFieldValues(products: any[], field: string): string[] {
  if (!products) return [];
  const values = new Set<string>();
  products.forEach((p) => {
    const val = p[field];
    if (val) {
      if (Array.isArray(val)) {
        val.forEach((v) => values.add(v));
      } else {
        values.add(val);
      }
    }
  });
  return Array.from(values).sort();
}
