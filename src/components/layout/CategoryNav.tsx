"use client";

import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { type CategorySlug } from "@/lib/category-types";
import { getCategoryPath } from "@/lib/category-utils";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Grid3X3,
  HardDrive,
  MemoryStick,
  Monitor,
  Percent,
  Smartphone,
  Video,
  Zap,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Core PC component categories - prioritized for focus
const categories: {
  slug: CategorySlug | null | "deals";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { slug: "elektroartikel", label: "Elektroartikel", icon: Grid3X3 },
  { slug: "prozessoren", label: "Prozessoren", icon: Cpu },
  { slug: "grafikkarten", label: "Grafikkarten", icon: Video },
  { slug: "arbeitsspeicher", label: "Arbeitsspeicher", icon: MemoryStick },
  { slug: "ssds", label: "SSDs", icon: HardDrive },
  { slug: "netzteile", label: "Netzteile", icon: Zap },
  { slug: "monitore", label: "Monitore", icon: Monitor },
  { slug: "mainboards", label: "Mainboards", icon: CircuitBoard },
  { slug: "smartphones", label: "Smartphones", icon: Smartphone },
];

export function CategoryNav({ country }: { country: string }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Only show on landing pages (root path for each country)
  const isLandingPage =
    pathname === "/" ||
    pathname === `/${country}` ||
    pathname === `/${country}/`;

  const checkScroll = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const { scrollWidth, clientWidth } = container;

      // Threshold 5 to ignore tiny overflow rounding
      const hasOverflow = scrollWidth > clientWidth + 5;
      setIsOverflowing(hasOverflow);

      if (!hasOverflow) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      // Check scroll position for chevrons
      const { scrollLeft } = container;
      // 5px tolerance
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;

    // Use ResizeObserver for perfect accuracy on mount and resize
    const observer = new ResizeObserver(() => {
      checkScroll();
    });

    observer.observe(container);

    // Initial check
    checkScroll();

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    // Reset scroll on navigation
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      checkScroll();
    }
  }, [pathname]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.6;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      // Small timeout to check scroll after animation finishes
      setTimeout(checkScroll, 500);
    }
  };

  // Don't render if not on landing page
  if (!isLandingPage) {
    return null;
  }

  return (
    <div className="z-40 h-[80px] border-b border-white/10 bg-(--sub-header-bg) dark:bg-(--sub-header-bg)">
      <div className="group/nav relative mx-auto h-full max-w-[1280px]">
        {/* Categories scroll container with CSS Scroll Snap */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="scrollbar-hide relative flex h-full w-full items-center overflow-x-auto overflow-y-hidden"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            touchAction: "pan-x",
            overscrollBehavior: "contain",
            scrollPaddingLeft: "16px",
            scrollPaddingRight: "16px",
          }}
        >
          <div className="mx-auto flex w-fit shrink-0 items-center gap-4 px-8 md:gap-6 md:px-12">
            {/* Deals Button (First) */}
            <PrefetchLink
              href="/deals"
              className="flex shrink-0 snap-start flex-col items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium text-white/80 no-underline transition-all hover:bg-white/10 hover:text-(--ccc-orange)"
            >
              <Percent className="h-6 w-6" />
              <span>Deals</span>
            </PrefetchLink>

            {/* Category Pills - Icons on top */}
            {categories
              .filter((cat) => cat.slug !== null)
              .map((cat) => {
                const Icon = cat.icon;
                return (
                  <PrefetchLink
                    key={cat.slug}
                    href={getCategoryPath(cat.slug as CategorySlug)}
                    className="flex shrink-0 snap-start flex-col items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium text-white/80 no-underline transition-all hover:bg-white/10 hover:text-(--ccc-orange)"
                  >
                    <Icon className="h-6 w-6" />
                    <span className="whitespace-nowrap">{cat.label}</span>
                  </PrefetchLink>
                );
              })}
          </div>
        </div>

        {/* Navigation Buttons - Using div wrapper to prevent hit-test blocking */}
        {/* Left scroll button overlay */}
        <div
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-30 flex h-full items-center bg-linear-to-r from-(--sub-header-bg) to-transparent pr-16 pl-2 transition-opacity duration-300",
            canScrollLeft ? "opacity-100" : "opacity-0",
          )}
        >
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white shadow-sm ring-1 ring-white/10 transition-all hover:scale-105 hover:bg-white/25 active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Right scroll button overlay */}
        <div
          className={cn(
            "pointer-events-none absolute top-0 right-0 z-30 flex h-full items-center bg-linear-to-l from-(--sub-header-bg) to-transparent pr-2 pl-16 transition-opacity duration-300",
            canScrollRight ? "opacity-100" : "opacity-0",
          )}
        >
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white shadow-sm ring-1 ring-white/10 transition-all hover:scale-105 hover:bg-white/25 active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
