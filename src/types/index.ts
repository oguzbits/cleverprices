/**
 * Shared type definitions for CleverPrices
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
  id?: number;
  asin: string;
  slug: string;
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
interface FilterState {
  search: string;
  condition: string[] | null;
  technology: string[] | null;
  formFactor: string[] | null;
  minCapacity: number | null;
  maxCapacity: number | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

type SortOrder = "asc" | "desc";

type SortBy = "relevance" | "price" | "pricePerUnit" | "rating" | "capacity";

/**
 * Product condition types
 */
type Condition = "New" | "Used" | "Renewed";

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
  singularName?: string;
  unitType?: UnitType;
  hidden?: boolean;
}

interface CategoryHierarchy {
  parent: Category;
  children: Category[];
}

interface CategoryLink {
  name: string;
  slug: CategorySlug;
  icon: LucideIcon;
}

/**
 * Country types
 */
interface Country {
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
interface AffiliateClickParams {
  productName: string;
  category: CategorySlug;
  country: CountryCode;
  price: number;
  pricePerUnit?: number;
  position?: number;
}

interface FilterAppliedParams {
  filter: string;
  value: string | string[];
  category: CategorySlug;
}

interface SortChangedParams {
  sortBy: SortBy;
  order: SortOrder;
  category: CategorySlug;
}
