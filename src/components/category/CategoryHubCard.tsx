"use client";

import Link from "next/link";
import { getCategoryPath, type CategorySlug } from "@/lib/categories";
import { ChevronRight } from "lucide-react";
import * as React from "react";

interface CategoryHubCardProps {
  category: {
    name: string;
    slug: string;
    description: string;
    imageUrl?: string;
    popularFilters?: { label: string; params?: string; href?: string }[];
  };
  Icon: React.ComponentType<{ className?: string }>;
}

/**
 * CategoryHubCard - Pixel-perfect Idealo-style category block.
 * Priorities: Real image -> Lucide Icon fallback.
 */
export function CategoryHubCard({ category, Icon }: CategoryHubCardProps) {
  const categoryPath = getCategoryPath(category.slug as CategorySlug);
  const imagePath =
    category.imageUrl || `/images/category/${category.slug}.jpg`;

  // State to handle image loading errors and fallback to Icon
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="flex h-full flex-col bg-transparent">
      {/* 1. Large Visual Area */}
      <Link href={categoryPath} className="group mb-4 block no-underline">
        <div className="mb-6 flex h-[100px] w-full items-center justify-center overflow-hidden bg-transparent">
          {!imageError ? (
            <img
              src={imagePath}
              alt={category.name}
              className="h-full w-auto object-contain transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <Icon className="h-20 w-20 text-[#ccc]/40 transition-colors" />
          )}
        </div>

        {/* 2. Headline Area */}
        <div className="flex items-center justify-between border-b border-[#d2d2d2] pb-1.5">
          <h3 className="truncate py-1 text-[20px] leading-tight font-bold text-[#2d2d2d] transition-colors">
            {category.name}
          </h3>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#2d2d2d] transition-colors" />
        </div>
      </Link>

      {/* 3. Subcategory Links */}
      <div className="flex flex-col gap-2">
        {(category.popularFilters || []).slice(0, 10).map((filter) => (
          <Link
            key={`${category.slug}-${filter.label}`}
            href={
              filter.href ||
              (filter.params
                ? `${categoryPath}?${filter.params}`
                : categoryPath)
            }
            className="text-[14px] leading-snug text-[#2d2d2d] no-underline hover:text-[#0066cc] hover:underline"
          >
            {filter.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
