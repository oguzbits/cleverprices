/**
 * Breadcrumb utility functions
 * Helpers for building breadcrumb trails
 */

import { getCategoryBySlug, getParentCategory, type CategorySlug } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";
import type { BreadcrumbItem } from "@/types";

/**
 * Build breadcrumbs for a category page
 */
export function buildCategoryBreadcrumbs(
  categorySlug: CategorySlug,
  countryCode: CountryCode,
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "Home", href: "/" },
    { name: "Categories", href: `/${countryCode}/categories` },
  ];

  // Add parent category if exists
  const parent = getParentCategory(categorySlug);
  if (parent) {
    breadcrumbs.push({
      name: parent.name,
      href: `/${countryCode}/${parent.slug}`,
    });
  }

  // Add current category
  const category = getCategoryBySlug(categorySlug);
  if (category) {
    breadcrumbs.push({
      name: category.name,
      href: `/${countryCode}/${parent?.slug || category.slug}/${category.slug}`,
    });
  }

  return breadcrumbs;
}

/**
 * Build breadcrumbs for a parent category page
 */
export function buildParentBreadcrumbs(
  parentSlug: CategorySlug,
  countryCode: CountryCode,
): BreadcrumbItem[] {
  const parent = getCategoryBySlug(parentSlug);

  return [
    { name: "Home", href: "/" },
    { name: "Categories", href: `/${countryCode}/categories` },
    { name: parent?.name || parentSlug, href: `/${countryCode}/${parentSlug}` },
  ];
}

/**
 * Build breadcrumbs for categories page
 */
export function buildCategoriesBreadcrumbs(
  countryCode: CountryCode,
): BreadcrumbItem[] {
  return [
    { name: "Home", href: "/" },
    { name: "Categories", href: `/${countryCode}/categories` },
  ];
}
