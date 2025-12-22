"use client";

import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export interface CarouselRef {
  scrollLeft: () => void;
  scrollRight: () => void;
}

export const Carousel = forwardRef<CarouselRef, CarouselProps>(
  ({ children, className, itemClassName }, ref) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      <div className="relative group/carousel w-full">
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex items-stretch overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-2 pb-8 -mb-4 px-4 sm:px-0",
            className
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {React.Children.map(children, (child) => (
            <div className={cn("flex-none shrink-0 snap-start snap-always", itemClassName)}>
              {child}
            </div>
          ))}
        </div>
        
        {/* Mobile visual indicator for scroll */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/20 rounded-full overflow-hidden sm:hidden">
          <div className="h-full bg-primary/20 w-1/3 rounded-full" />
        </div>
      </div>
    );
  }
);

Carousel.displayName = "Carousel";
