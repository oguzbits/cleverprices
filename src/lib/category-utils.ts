import { CATEGORY_MAP } from "./category-definitions";
import { CATEGORY_MANIFEST, CategoryManifestEntry } from "./category-manifest";
import { CategoryData, CategorySlug } from "./category-types";

/**
 * Get full URL path for a category
 */
export function getCategoryPath(categorySlug: string): string {
  // 1. Direct manifest lookup (canonical slug)
  if (CATEGORY_MANIFEST[categorySlug as CategorySlug]) {
    return `/${categorySlug}`;
  }

  // 2. Alias lookup (check CATEGORY_MAP for aliases)
  const canonicalSlug = Object.keys(CATEGORY_MAP).find((slug) =>
    CATEGORY_MAP[slug as CategorySlug]?.aliases?.includes(categorySlug),
  );

  if (canonicalSlug) {
    return `/${canonicalSlug}`;
  }

  return "/";
}

/**
 * Check if a category is analytical (price-per-unit)
 * NOTE: This requires full CategoryData, so should be used with care in client.
 */
function isAnalyticalCategory(category: CategoryData): boolean {
  return category.categoryType === "analytical";
}

/**
 * Get breadcrumb trail for a category (slugs only)
 */
function getBreadcrumbSlugs(categorySlug: CategorySlug): CategorySlug[] {
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
function getUniqueFieldValues(products: any[], field: string): string[] {
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
