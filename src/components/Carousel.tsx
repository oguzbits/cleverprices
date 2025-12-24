"use client";

import React, { useRef, useImperativeHandle, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  onScrollStateChange?: (state: {
    canScrollLeft: boolean;
    canScrollRight: boolean;
  }) => void;
  ref?: React.Ref<CarouselRef>;
}

export interface CarouselRef {
  scrollLeft: () => void;
  scrollRight: () => void;
}

export const Carousel = ({
  children,
  className,
  itemClassName,
  onScrollStateChange,
  ref,
}: CarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;

      const newState = {
        canScrollLeft: Math.round(scrollLeft) > 2,
        canScrollRight: Math.round(scrollLeft + clientWidth) < scrollWidth - 2,
      };

      setScrollState(newState);
      onScrollStateChange?.(newState);
    };

    // Initial check and listeners
    const frame = requestAnimationFrame(update);
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [children, onScrollStateChange]);

  useImperativeHandle(ref, () => ({
    scrollLeft: () => {
      if (scrollContainerRef.current) {
        const cardWidth = scrollContainerRef.current.offsetWidth * 0.8;
        scrollContainerRef.current.scrollBy({
          left: -cardWidth,
          behavior: "smooth",
        });
      }
    },
    scrollRight: () => {
      if (scrollContainerRef.current) {
        const cardWidth = scrollContainerRef.current.offsetWidth * 0.8;
        scrollContainerRef.current.scrollBy({
          left: cardWidth,
          behavior: "smooth",
        });
      }
    },
  }));

  return (
    <div className="group/carousel relative w-full">
      <div
        ref={scrollContainerRef}
        className={cn(
          "scrollbar-hide -mb-4 flex snap-x snap-mandatory items-stretch gap-2 overflow-x-auto px-4 pb-8 sm:px-0",
          className,
        )}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollPaddingLeft: "1rem",
          scrollPaddingRight: "1rem",
        }}
      >
        {React.Children.map(children, (child) => (
          <div
            className={cn(
              "flex-none shrink-0 snap-start snap-always",
              itemClassName,
            )}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Mobile visual indicator for scroll */}
      <div className="bg-muted/20 absolute right-0 bottom-0 left-0 h-1 overflow-hidden rounded-full sm:hidden">
        <div
          className="bg-primary/20 h-full rounded-full transition-all duration-300"
          style={{
            width: "33%",
            transform: `translateX(${scrollState.canScrollLeft ? (scrollState.canScrollRight ? "100%" : "200%") : "0%"})`,
          }}
        />
      </div>
    </div>
  );
};

Carousel.displayName = "Carousel";
