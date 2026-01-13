"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatting";
import Image from "next/image";
import Link from "next/link";

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
}

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
}: IdealoProductCardProps) {
  return (
    <Link
      href={`/p/${slug}`}
      className="group relative flex h-[380px] w-[224px] shrink-0 flex-col bg-white p-4 no-underline transition-shadow hover:shadow-lg"
      style={{ border: "1px solid rgb(220, 220, 220)" }}
    >
      {/* Badges Area - top left */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {discountRate && discountRate > 0 && (
          <div className="rounded-sm bg-[#ff6600] px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            -{discountRate}%
          </div>
        )}
        {badgeText && (!discountRate || discountRate === 0) && (
          <div className="rounded-sm bg-[#ff6600] px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            {badgeText}
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative mb-3 h-[140px] w-full overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="224px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
            <span className="text-xs italic">Kein Bild</span>
          </div>
        )}
      </div>

      {/* Category Info */}
      <div className="mb-1 flex items-center gap-1.5 overflow-hidden">
        {!!isBestseller && (
          <div className="shrink-0 rounded-[2px] bg-[#0066cc] px-2 py-1 text-[14px] font-extrabold tracking-tight text-white">
            Bestseller
          </div>
        )}
        {categoryName && (
          <span
            className={cn(
              "truncate text-[14px] text-gray-500",
              isBestseller && "font-medium",
            )}
          >
            in {categoryName}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-2 line-clamp-3 min-h-[54px] text-[16px] leading-tight font-semibold text-gray-900">
        {title}
      </h3>

      {/* Professional Rating (Note) */}
      {typeof testRating === "number" && testRating > 0 && (
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#00a651]">
          <span>Note Ø {testRating.toFixed(1).replace(".", ",")}</span>
          {testCount && (
            <span className="text-[10px] font-normal text-gray-400">
              ({testCount} Test{testCount === 1 ? "" : "s"})
            </span>
          )}
        </div>
      )}

      {/* Community Rating (Stars) */}
      {typeof rating === "number" && rating > 0 && (
        <div className="mb-3 flex items-center gap-1.5 text-[11px]">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => {
              const fillPercent = Math.max(
                0,
                Math.min(100, (rating - (i - 1)) * 100),
              );
              return (
                <div key={i} className="relative h-3 w-3">
                  {/* Background Star */}
                  <svg
                    className="absolute inset-0 fill-gray-200"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  {/* Foreground Star */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${fillPercent}%` }}
                  >
                    <svg className="h-3 w-3 fill-[#ff6600]" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
          {ratingCount && (
            <span className="font-normal text-gray-400">({ratingCount})</span>
          )}
        </div>
      )}

      {/* Price section */}
      <div className="mt-auto flex items-baseline gap-1">
        <span className="text-[12px] font-medium text-gray-500">ab</span>
        <span className="text-[20px] font-bold text-[#ff6600]">
          {formatCurrency(price, "de")}
        </span>
      </div>
    </Link>
  );
}
