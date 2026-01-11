"use client";

import { Badge } from "@/components/ui/badge";
import { CategoryCard } from "@/components/ui/category-card";
import { Category, CategorySlug, getCategoryPath } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";
import { type CountryCode } from "@/lib/countries";
import Link from "next/link";
import * as React from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import {
  ProductBestsellerGrid,
  type BestsellerProduct,
} from "@/components/category/ProductBestsellerGrid";
import { CategoryHubCard } from "@/components/category/CategoryHubCard";

interface ParentCategoryViewProps {
  parentCategory: Omit<Category, "icon">;
  childCategories: (Omit<Category, "icon"> & {
    popularFilters?: { label: string; params: string }[];
  })[];
  countryCode: CountryCode;
  /** Bestseller products for the grid section */
  bestsellers?: BestsellerProduct[];
  /** New products for the carousel section */
  newProducts?: BestsellerProduct[];
  /** Deal products for the carousel section */
  deals?: BestsellerProduct[];
}

export function ParentCategoryView({
  parentCategory,
  childCategories,
  countryCode,
  bestsellers = [],
  newProducts = [],
  deals = [],
}: ParentCategoryViewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const visibleCategories = isExpanded
    ? childCategories
    : childCategories.slice(0, 8);
  const hasMore = childCategories.length > 8;

  const breadcrumbItems = [
    { name: "Startseite", href: "/" },
    { name: parentCategory.name },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />
      {/* Header Section */}
      <div className="mb-8">
        <div className="mb-6 flex items-center gap-5">
          <div className="rounded-2xl bg-[#e8f4fd] p-4">
            {React.createElement(getCategoryIcon(parentCategory.slug), {
              className: "h-10 w-10 text-[#0066cc]",
              "aria-hidden": "true",
            })}
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#2d2d2d]">
              {parentCategory.name}
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] text-[#666]">
              {parentCategory.description}
            </p>
          </div>
        </div>
      </div>
      {/* Subcategory Hub Cards Grid */}
      <section className="mb-20">
        <h2 className="mb-10 text-[28px] font-bold text-[#2d2d2d]">
          {parentCategory.name}
        </h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {childCategories.map((category, index) => (
            <div
              key={category.slug}
              className={index >= 8 && !isExpanded ? "hidden" : "block"}
              // Always keep in DOM for SEO, but hide visually
              style={{ display: index >= 8 && !isExpanded ? "none" : "block" }}
            >
              <CategoryHubCard
                category={category}
                Icon={getCategoryIcon(category.slug)}
              />
            </div>
          ))}
        </div>

        {/* 'Alle Kategorien' Toggle Button */}
        {hasMore && (
          <div className="mt-20 flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center rounded-[2px] border border-[#0066cc] bg-white px-10 py-3 text-[16px] font-medium text-[#0066cc] transition-all hover:bg-[#e8f4fd]"
            >
              {isExpanded ? "Weniger Kategorien" : "Alle Kategorien"}
            </button>
          </div>
        )}
      </section>
      {/* Bestseller Section - Internal Links to Products */}
      {bestsellers.length > 0 && (
        <ProductBestsellerGrid
          title={`Bestseller in "${parentCategory.name}"`}
          products={bestsellers}
          className="mb-10"
        />
      )}
      {/* New Products Carousel - Internal Links to Products */}
      {newProducts.length > 0 && (
        <section className="mb-10 rounded-lg bg-[#e8f4fd] p-6">
          <IdealoProductCarousel
            title={`Neu in ${parentCategory.name}`}
            products={newProducts.map((p) => ({
              title: p.title,
              price: p.price,
              slug: p.slug,
              image: p.image,
            }))}
          />
        </section>
      )}
      {/* Deals Carousel - Internal Links to Products */}
      {deals.length > 0 && (
        <section className="mb-10 rounded-lg bg-white p-6 shadow-sm">
          <IdealoProductCarousel
            title={`Deals in "${parentCategory.name}"`}
            products={deals.map((p) => ({
              title: p.title,
              price: p.price,
              slug: p.slug,
              image: p.image,
              badgeText: "Deal",
            }))}
          />
        </section>
      )}
    </div>
  );
}
