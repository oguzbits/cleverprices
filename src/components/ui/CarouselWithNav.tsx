"use client";

import { Carousel, CarouselRef } from "@/components/Carousel";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useRef, useState } from "react";

interface CarouselWithNavProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function CarouselWithNav({
  children,
  className,
  itemClassName,
}: CarouselWithNavProps) {
  const carouselRef = useRef<CarouselRef>(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  return (
    <div className="group/carousel relative">
      {/* Left Navigation Button */}
      <button
        onClick={() => carouselRef.current?.scrollLeft()}
        disabled={!scrollState.canScrollLeft}
        className={cn(
          "absolute top-1/2 left-0 z-10 -translate-y-1/2",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
          "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
          !scrollState.canScrollLeft && "pointer-events-none opacity-0!",
        )}
        aria-label="Vorherige"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Right Navigation Button */}
      <button
        onClick={() => carouselRef.current?.scrollRight()}
        disabled={!scrollState.canScrollRight}
        className={cn(
          "absolute top-1/2 right-0 z-10 -translate-y-1/2",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
          "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
          !scrollState.canScrollRight && "pointer-events-none opacity-0!",
        )}
        aria-label="Nächste"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <Carousel
        ref={carouselRef}
        onScrollStateChange={setScrollState}
        className={cn("px-6", className)}
        itemClassName={itemClassName}
      >
        {children}
      </Carousel>
    </div>
  );
}
