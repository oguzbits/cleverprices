/**
 * Shared type definitions for RealPriceData
 * Centralized types to avoid duplication across the codebase
 */

import type { LucideIcon } from "lucide-react";

/**
 * Product types
 */
export interface Product {
  asin: string;
  title: string;
  price: {
    amount: number;
    currency: string;
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
  sortBy: string;
  sortOrder: SortOrder;
}

export type SortOrder = "asc" | "desc";

/**
 * Product condition types
 */
export type Condition = "New" | "Used" | "Renewed";

/**
 * Category types
 */
export interface Category {
  name: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  parent?: string;
  metaTitle?: string;
  metaDescription?: string;
  unitType?: string;
  hidden?: boolean;
}

export interface CategoryHierarchy {
  parent: Category;
  children: Category[];
}

export interface CategoryLink {
  name: string;
  slug: string;
  icon: LucideIcon;
}

/**
 * Country types
 */
export interface Country {
  code: string;
  name: string;
  currency: string;
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
}

/**
 * Analytics event types
 */
export interface AffiliateClickParams {
  productName: string;
  category: string;
  country: string;
  price: number;
  pricePerUnit?: number;
  position?: number;
}

export interface FilterAppliedParams {
  filter: string;
  value: string | string[];
  category: string;
}

export interface SortChangedParams {
  sortBy: string;
  order: SortOrder;
  category: string;
}
