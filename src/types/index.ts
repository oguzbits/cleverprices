/**
 * Shared type definitions for RealPriceData
 * Centralized types to avoid duplication across the codebase
 */

import type { CategorySlug, UnitType } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";
import type { LucideIcon } from "lucide-react";

/**
 * Common types
 */
export type Currency = "USD" | "GBP" | "CAD" | "EUR";

/**
 * Product types
 */
export interface Product {
  asin: string;
  title: string;
  price: {
    amount: number;
    currency: Currency;
    displayAmount: string;
  };
  image: string;
  url: string;
  category: string;
  capacity: string;
  pricePerUnit?: string;
  rating?: number;
  reviewCount?: number;
  isPrime?: boolean;
}

/**
 * Filter state types
 */
export interface FilterState {
  search: string;
  condition: string[] | null;
  technology: string[] | null;
  formFactor: string[] | null;
  minCapacity: number | null;
  maxCapacity: number | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export type SortOrder = "asc" | "desc";

export type SortBy = "relevance" | "price" | "pricePerUnit" | "rating" | "capacity";

/**
 * Product condition types
 */
export type Condition = "New" | "Used" | "Renewed";

/**
 * Category types
 */
export interface Category {
  name: string;
  slug: CategorySlug;
  description: string;
  icon: LucideIcon;
  parent?: CategorySlug;
  metaTitle?: string;
  metaDescription?: string;
  unitType?: UnitType;
  hidden?: boolean;
}

export interface CategoryHierarchy {
  parent: Category;
  children: Category[];
}

export interface CategoryLink {
  name: string;
  slug: CategorySlug;
  icon: LucideIcon;
}

/**
 * Country types
 */
export interface Country {
  code: CountryCode;
  name: string;
  currency: Currency;
  locale: string;
  flag: string;
  comingSoon?: boolean;
}

/**
 * Breadcrumb types
 */
export interface BreadcrumbItem {
  name: string;
  href?: string;
  icon?: LucideIcon;
  suffix?: string;
}

/**
 * Analytics event types
 */
export interface AffiliateClickParams {
  productName: string;
  category: CategorySlug;
  country: CountryCode;
  price: number;
  pricePerUnit?: number;
  position?: number;
}

export interface FilterAppliedParams {
  filter: string;
  value: string | string[];
  category: CategorySlug;
}

export interface SortChangedParams {
  sortBy: SortBy;
  order: SortOrder;
  category: CategorySlug;
}
