"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

import { Carousel, CarouselRef } from "@/components/Carousel";
import { cn } from "@/lib/utils";

interface CarouselContainerProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function CarouselContainer({
  title,
  children,
  className,
}: CarouselContainerProps) {
  const carouselRef = useRef<CarouselRef>(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  return (
    <div
      className={cn("cn-productCarousel group/carousel relative", className)}
    >
      {/* Section Header */}
      {title && (
        <div className="cn-productCarousel__header mb-4">
          <h2 className="text-idealo-text-primary text-[20px] font-bold">
            {title}
          </h2>
        </div>
      )}

      {/* Navigation Buttons */}
      <button
        onClick={() => carouselRef.current?.scrollLeft()}
        disabled={!scrollState.canScrollLeft}
        className={cn(
          "absolute top-1/2 left-0 z-10 -translate-y-1/2",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
          "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
          !scrollState.canScrollLeft && "pointer-events-none opacity-0!",
          title ? "mt-4" : "",
        )}
        style={{ marginTop: title ? "24px" : "0" }}
        aria-label="Vorherige"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={() => carouselRef.current?.scrollRight()}
        disabled={!scrollState.canScrollRight}
        className={cn(
          "absolute top-1/2 right-0 z-10 -translate-y-1/2",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
          "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
          !scrollState.canScrollRight && "pointer-events-none opacity-0!",
          title ? "mt-4" : "",
        )}
        style={{ marginTop: title ? "24px" : "0" }}
        aria-label="Nächste"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Product Carousel */}
      <Carousel
        ref={carouselRef}
        onScrollStateChange={setScrollState}
        className="-mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {children}
      </Carousel>
    </div>
  );
}
