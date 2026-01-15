"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatting";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface IdealoProductCardProps {
  title: string;
  price: number;
  currency?: string;
  slug: string;
  image?: string;
  rating?: number; // Community Rating (Stars)
  ratingCount?: number; // Community Review Count
  testRating?: number; // Professional "Note" (e.g. 1.0 - 6.0)
  testCount?: number; // Number of tests
  badgeText?: string;
  categoryName?: string;
  discountRate?: number;
  isBestseller?: boolean;
  variationAttributes?: string;
}

const StarIcon = ({
  className,
  width,
}: {
  className: string;
  width?: string;
}) => (
  <div className="relative h-3 w-3">
    <svg className={cn("absolute inset-0", className)} viewBox="0 0 20 20">
      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
    </svg>
    {width && (
      <div className="absolute inset-0 overflow-hidden" style={{ width }}>
        <svg className="h-3 w-3 fill-[#ff6600]" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      </div>
    )}
  </div>
);

export function IdealoProductCard({
  title,
  price,
  currency = "EUR",
  slug,
  image,
  rating,
  ratingCount,
  testRating,
  testCount,
  badgeText,
  categoryName,
  discountRate,
  isBestseller,
  variationAttributes,
}: IdealoProductCardProps) {
  return (
    <Link
      href={`/p/${slug}`}
      className="group relative flex h-[272px] w-[164px] shrink-0 flex-col bg-white no-underline transition-shadow hover:shadow-lg sm:h-[327px] sm:w-[240px]"
      style={{ border: "1px solid rgb(220, 220, 220)" }}
    >
      {/* Badges Area - top left */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {discountRate && discountRate > 0 ? (
          <div className="rounded-sm bg-[#ff6600] px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            -{discountRate}%
          </div>
        ) : null}
        {badgeText && (!discountRate || discountRate === 0) ? (
          <div className="rounded-sm bg-[#ff6600] px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            {badgeText}
          </div>
        ) : null}
      </div>

      {/* Image Container */}
      <div className="p-[4px_8px] sm:p-[4px_12px]">
        <div className="relative mb-3 h-[115px] w-full overflow-hidden sm:h-[158px]">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 600px) 164px, 240px"
              priority={isBestseller}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
              <span className="text-xs italic">Kein Bild</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col p-[4px_8px] sm:p-[8px_12px]">
        {/* Category Info */}
        <div className="mb-1 flex items-center gap-1.5 overflow-hidden">
          {isBestseller ? (
            <div className="shrink-0 rounded-[2px] bg-[#0066cc] px-2 py-1 text-[14px] font-extrabold tracking-tight text-white">
              Bestseller
            </div>
          ) : null}
          {categoryName ? (
            <span
              className={cn(
                "truncate text-[14px] text-gray-500",
                isBestseller && "font-medium",
              )}
            >
              in {categoryName}
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="mb-1 line-clamp-2 max-h-[44px] text-[16px] leading-tight font-semibold text-gray-900 group-hover:text-[#0066cc]">
          {title}
        </h3>

        {/* Professional Rating (Note) */}
        {typeof testRating === "number" && testRating > 0 ? (
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#00a651]">
            <span>Note Ø {testRating.toFixed(1).replace(".", ",")}</span>
            {testCount ? (
              <span className="text-[10px] font-normal text-gray-400">
                ({testCount} Test{testCount === 1 ? "" : "s"})
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Community Rating (Stars) */}
        {typeof rating === "number" && rating > 0 ? (
          <div className="mb-3 flex items-center gap-1.5 text-[11px]">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => {
                const fillPercent = Math.max(
                  0,
                  Math.min(100, (rating - (i - 1)) * 100),
                );
                return (
                  <StarIcon
                    key={i}
                    className="fill-gray-200"
                    width={fillPercent > 0 ? `${fillPercent}%` : undefined}
                  />
                );
              })}
            </div>
            {ratingCount ? (
              <span className="font-normal text-gray-400">({ratingCount})</span>
            ) : null}
          </div>
        ) : null}

        {/* Price section */}
        <div className="mt-auto flex items-baseline gap-1">
          <span className="text-[12px] font-medium text-gray-500">ab</span>
          <span className="text-[20px] font-bold text-[#ff6600]">
            {formatCurrency(price, "de")}
          </span>
        </div>
      </div>
    </Link>
  );
}
