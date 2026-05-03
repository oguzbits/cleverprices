import { LucideIcon } from "lucide-react";
import { cache } from "react";

import { CATEGORY_MAP } from "./category-definitions";
import {
  Category as BaseCategory,
  CategoryData as BaseCategoryData,
  CategoryHierarchy as BaseCategoryHierarchy,
  CategoryLink as BaseCategoryLink,
  CategorySlug,
  UnitType,
} from "./category-types";
import { getCategoryPath as _getCategoryPath } from "./category-utils";

// Export types for consumers
export type { CategorySlug, UnitType };

export interface Category extends BaseCategory {
  icon?: LucideIcon;
}

export interface CategoryHierarchy extends BaseCategoryHierarchy<Category> {}
export interface CategoryLink extends BaseCategoryLink {
  icon: LucideIcon;
}

// Re-export constants for backward compatibility
export { CATEGORY_MAP };

import { CATEGORY_MANIFEST } from "./category-manifest";

// All categories in a flat structure with slug added (Icon removed to prevent client bloating)
export const allCategories: Record<CategorySlug, Category> = Object.entries(
  CATEGORY_MAP,
).reduce(
  (acc, [slug, data]) => {
    const manifestEntry = CATEGORY_MANIFEST[slug as CategorySlug] || {};
    acc[slug as CategorySlug] = {
      ...manifestEntry,
      ...(data as BaseCategoryData),
      slug: slug as CategorySlug,
    } as Category;
    return acc;
  },
  {} as Record<CategorySlug, Category>,
);

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// Get category hierarchy (parent with children)
export function getCategoryHierarchy(): CategoryHierarchy[] {
  return _cachedHierarchy;
}

// Cached version for use in pages (complying with "Only use use cache in the lib/server layer" rule)
export async function getCategoryHierarchyCached(): Promise<
  CategoryHierarchy[]
> {
  return getCategoryHierarchy();
}

export const getCategoryBySlug = cache(
  async (
    slug: string,
  ): Promise<(Category & { breadcrumbs: Category[] }) | undefined> => {
    // 1. Try direct lookup (fastest)
    let category: Category | undefined = allCategories[slug as CategorySlug];

    // 2. Try alias lookup if not found
    if (!category) {
      category = _cachedAllCategories.find((cat) =>
        cat.aliases?.includes(slug),
      );
    }

    if (!category) return undefined;

    // Enhance with breadcrumbs
    return {
      ...category,
      breadcrumbs: getBreadcrumbs(category.slug),
    };
  },
);

// Get parent category for a given category
export function getParentCategory(
  categorySlug: CategorySlug,
): Category | undefined {
  const category = allCategories[categorySlug];
  if (!category?.parent) return undefined;
  return allCategories[category.parent];
}

// Get children of a parent category - O(1) via pre-computed Map
export function getChildCategories(parentSlug: CategorySlug): Category[] {
  return _childrenByParent.get(parentSlug) || [];
}

// Get breadcrumb trail for a category
export function getBreadcrumbs(categorySlug: CategorySlug): Category[] {
  const breadcrumbs: Category[] = [];
  let current: Category | undefined = allCategories[categorySlug];

  while (current) {
    breadcrumbs.unshift(current);
    if (current.parent) {
      current = allCategories[current.parent];
    } else {
      current = undefined;
    }
  }

  return breadcrumbs;
}

// Get full URL path for a category
export function getCategoryPath(categorySlug: CategorySlug): string {
  return _getCategoryPath(categorySlug);
}

// Return a copy of the category without the icon function (for serialization)
export function stripCategoryIcon(category: Category): Omit<Category, "icon"> {
  const { icon, ...rest } = category;
  return JSON.parse(JSON.stringify(rest));
}

/**
 * Check if a category is analytical (price-per-unit)
 */
function isAnalyticalCategory(category: Category): boolean {
  return category.categoryType === "analytical";
}

/**
 * Get all analytical categories (price-per-unit categories) - O(1) via cache
 */
function getAnalyticalCategories(): Category[] {
  return _cachedAnalyticalCategories;
}

/**
 * Get all categories
 */
function getAllCategories(): Category[] {
  return _cachedAllCategories;
}

/**
 * Get all standard categories (regular price comparison) - O(1) via cache
 */
function getStandardCategories(): Category[] {
  return _cachedStandardCategories;
}

// =====================================================
// PRE-COMPUTED CACHES (Module-level initialization)
// =====================================

// Cache: All categories as array
const _cachedAllCategories = Object.values(allCategories);

// Cache: Children by parent slug for O(1) lookup
const _childrenByParent = new Map<CategorySlug, Category[]>();
for (const cat of _cachedAllCategories) {
  if (cat.parent && !cat.hidden) {
    const existing = _childrenByParent.get(cat.parent) || [];
    existing.push(cat);
    _childrenByParent.set(cat.parent, existing);
  }
}

// Cache: Full hierarchy
const _cachedHierarchy: CategoryHierarchy[] = [];
for (const cat of _cachedAllCategories) {
  if (!cat.parent && !cat.hidden) {
    _cachedHierarchy.push({
      parent: stripCategoryIcon(cat) as Category,
      children: (_childrenByParent.get(cat.slug) || []).map(
        stripCategoryIcon,
      ) as Category[],
    });
  }
}

// Cache: Analytical categories
const _cachedAnalyticalCategories = _cachedAllCategories.filter(
  (cat) => cat.categoryType === "analytical" && !cat.hidden,
);

// Cache: Standard categories
export const _cachedStandardCategories = _cachedAllCategories.filter(
  (cat) => cat.categoryType === "standard" && !cat.hidden,
);

/**
 * Recursively check if a category or any of its children (and their children)
 * have products according to the provided list of non-empty category slugs.
 */
export function isCategoryNotEmptyRecursive(
  categorySlug: CategorySlug,
  nonEmptySlugs: string[] | Set<string>,
): boolean {
  const slugSet =
    nonEmptySlugs instanceof Set ? nonEmptySlugs : new Set(nonEmptySlugs);

  // 1. Check if the category itself has products
  if (slugSet.has(categorySlug)) {
    return true;
  }

  // 2. Check if any children have products
  const children = getChildCategories(categorySlug);
  if (children.length === 0) {
    return false;
  }

  return children.some((child) =>
    isCategoryNotEmptyRecursive(child.slug, slugSet),
  );
}
