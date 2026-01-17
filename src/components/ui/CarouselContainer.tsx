"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CarouselContainer({ children }: { children: React.ReactNode }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 10);
      setCanScrollRight(
        container.scrollLeft <
          container.scrollWidth - container.clientWidth - 10,
      );
    }
  };

  useEffect(() => {
    checkScroll();
    // Use an IntersectionObserver or MutationObserver if content is dynamic,
    // but for static server-rendered content, resize is enough.
    window.addEventListener("resize", checkScroll);

    // Check again after a short delay for dynamic layouts
    const timer = setTimeout(checkScroll, 500);

    return () => {
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const amount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="group/carousel relative">
      {/* Scrollable Container with native CSS scroll snap */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className={cn(
          "scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth",
          "snap-x snap-mandatory",
        )}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      {/* Navigation Controls - Hidden if not needed or on touch devices (optional) */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className={cn(
            "absolute top-1/2 left-0 z-10 -translate-y-1/2",
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
            "hidden opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100 md:flex",
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className={cn(
            "absolute top-1/2 right-0 z-10 -translate-y-1/2",
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
            "hidden opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100 md:flex",
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
