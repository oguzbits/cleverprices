/**
 * Idealo Product Carousel Component
 *
 * Reusable product carousel section for bestsellers, new products, etc.
 * Uses the existing IdealoProductCard component for individual cards.
 *
 * Based on Idealo's bestseller/newProducts modules.
 */

"use client";

import { type CountryCode } from "@/lib/countries";
import { IdealoProductCard } from "@/components/landing/IdealoProductCard";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface CarouselProduct {
  title: string;
  price: number;
  slug: string;
  image?: string;
  rating?: number;
  ratingCount?: number;
  testRating?: number;
  testCount?: number;
  badgeText?: string;
  categoryName?: string;
  discountRate?: number;
  isBestseller?: boolean;
  variationAttributes?: string;
}

interface IdealoProductCarouselProps {
  title?: string;
  products: CarouselProduct[];
  className?: string;
  countryCode?: CountryCode;
  /** Enable priority loading for first 4 images (for above-the-fold carousels) */
  priorityImages?: boolean;
}

export function IdealoProductCarousel({
  title,
  products,
  className,
  countryCode,
  priorityImages = false,
}: IdealoProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [needsScrolling, setNeedsScrolling] = useState(false);

  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      setNeedsScrolling(hasOverflow);
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft <
          container.scrollWidth - container.clientWidth - 10,
      );
    }
  };

  // Check on mount and when products change
  useEffect(() => {
    checkScrollState();
    // Also check after a short delay to ensure layout is complete
    const timer = setTimeout(checkScrollState, 100);
    return () => clearTimeout(timer);
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      // Scroll by the visible width of the container (page-based scrolling)
      const scrollAmount = container.clientWidth;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScrollState, 300);
    }
  };

  if (products.length === 0) {
    return (
      <div className={cn("cn-productCarousel", "mb-8", className)}>
        {title && (
          <div className="cn-productCarousel__header mb-4">
            <h2 className="text-[20px] font-bold text-[#2d2d2d]">{title}</h2>
          </div>
        )}
        <div className="flex items-center justify-center rounded bg-[#f9f9f9] py-12 text-center">
          <p className="text-sm text-[#999]">Keine Produkte verfügbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("cn-productCarousel", "mb-8", className)}>
      {/* Section Header */}
      {title && (
        <div className="cn-productCarousel__header mb-4">
          <h2 className="text-[20px] font-bold text-[#2d2d2d]">{title}</h2>
        </div>
      )}

      {/* Product Carousel with Navigation */}
      <div className="group/carousel relative">
        {/* Left Navigation Button */}
        {needsScrolling && canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className={cn(
              "absolute top-1/2 left-0 z-10 -translate-y-1/2",
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
              "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right Navigation Button */}
        {needsScrolling && canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className={cn(
              "absolute top-1/2 right-0 z-10 -translate-y-1/2",
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
              "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollState}
          className={cn(
            "cn-productCarousel__container",
            "scrollbar-hide flex gap-4 overflow-x-auto",
          )}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            touchAction: "pan-x",
            overscrollBehavior: "none",
          }}
        >
          {products.map((product, index) => (
            <IdealoProductCard
              key={product.slug}
              title={product.title}
              price={product.price}
              slug={product.slug}
              image={product.image}
              rating={product.rating}
              ratingCount={product.ratingCount}
              testRating={product.testRating}
              testCount={product.testCount}
              badgeText={product.badgeText}
              categoryName={product.categoryName}
              discountRate={product.discountRate}
              isBestseller={
                product.isBestseller || (priorityImages && index < 4)
              }
              variationAttributes={product.variationAttributes}
              countryCode={countryCode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
