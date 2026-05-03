/**
 * Shared type definitions for CleverPrices
 * Centralized types to avoid duplication across the codebase
 */

import type { LucideIcon } from "lucide-react";

import type { CategorySlug } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";

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

type SortOrder = "asc" | "desc";

type SortBy = "relevance" | "price" | "pricePerUnit" | "rating" | "capacity";

export type {
  Category,
  CategoryHierarchy,
  CategoryLink,
} from "@/lib/categories";

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
