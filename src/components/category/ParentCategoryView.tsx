"use client";

import { Category } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";
import * as React from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryHubCard } from "@/components/category/CategoryHubCard";
import { ProductBestsellerGrid } from "@/components/category/ProductBestsellerGrid";
import { IdealoProductCarousel } from "@/components/IdealoProductCarousel";
import { type LeanProduct } from "@/lib/types";

interface ParentCategoryViewProps {
  parentCategory: Omit<Category, "icon">;
  childCategories: (Omit<Category, "icon"> & {
    popularFilters?: { label: string; params?: string; href?: string }[];
  })[];
  /** Bestseller products for the grid section */
  bestsellers?: LeanProduct[];
  /** New products for the carousel section */
  newProducts?: LeanProduct[];
  deals?: LeanProduct[];
  breadcrumbItems?: { name: string; href?: string }[];
}

export function ParentCategoryView({
  parentCategory,
  childCategories,
  bestsellers = [],
  newProducts = [],
  deals = [],
  breadcrumbItems = [],
}: ParentCategoryViewProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-3">
        <Breadcrumbs items={breadcrumbItems} />
        {/* Subcategory Hub Cards Grid */}
        <section className="mb-20">
          <h2 className="mb-10 text-[28px] font-bold text-[#2d2d2d]">
            {parentCategory.name}
          </h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
            {childCategories.map((category) => (
              <div key={category.slug}>
                <CategoryHubCard
                  category={category}
                  Icon={getCategoryIcon(category.slug)}
                />
              </div>
            ))}
          </div>
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
          <section className="mb-10 rounded-lg bg-[#e8f4fd] px-6 py-3">
            <IdealoProductCarousel
              title={`Neu in ${parentCategory.name}`}
              products={newProducts.map((p) => ({
                title: p.title,
                price: p.price,
                slug: p.slug,
                image: p.image,
                rating: p.rating,
                ratingCount: p.reviewCount,
                categoryName: p.category,
                discountRate: p.savings
                  ? Math.round(p.savings * 100)
                  : undefined,
                isBestseller: (p.salesRank ?? 0) > 0 && p.salesRank! < 10000,
                variationAttributes: p.variationAttributes,
              }))}
            />
          </section>
        )}
        {/* Deals Carousel - Internal Links to Products */}
        {deals.length > 0 && (
          <section className="mb-10 rounded-lg bg-white px-6 py-3 shadow-sm">
            <IdealoProductCarousel
              title={`Deals in "${parentCategory.name}"`}
              products={deals.map((p) => ({
                title: p.title,
                price: p.price,
                slug: p.slug,
                image: p.image,
                rating: p.rating,
                ratingCount: p.reviewCount,
                categoryName: p.category,
                discountRate: p.savings
                  ? Math.round(p.savings * 100)
                  : undefined,
                isBestseller: (p.salesRank ?? 0) > 0 && p.salesRank! < 10000,
                variationAttributes: p.variationAttributes,
                badgeText: p.savings && p.savings > 0.05 ? undefined : "Deal", // Only show "Deal" if no discount badge
              }))}
            />
          </section>
        )}
      </div>
    </div>
  );
}
