"use client";

import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { type CategorySlug } from "@/lib/category-types";
import { getCategoryPath } from "@/lib/category-utils";
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
  { slug: "cpu", label: "Prozessoren", icon: Cpu },
  { slug: "gpu", label: "Grafikkarten", icon: Video },
  { slug: "ram", label: "Arbeitsspeicher", icon: MemoryStick },
  { slug: "ssds", label: "SSDs", icon: HardDrive },
  { slug: "power-supplies", label: "Netzteile", icon: Zap },
  { slug: "monitors", label: "Monitore", icon: Monitor },
  { slug: "motherboards", label: "Mainboards", icon: CircuitBoard },
  { slug: "smartphones", label: "Smartphones", icon: Smartphone },
];

export function CategoryNav({ country }: { country: string }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Only show on landing pages (root path for each country)
  const isLandingPage =
    pathname === "/" ||
    pathname === `/${country}` ||
    pathname === `/${country}/`;

  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    // Force scroll to start on mount/pathname change
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      // Small delay to ensure layout is ready before checking scroll
      const timer = setTimeout(checkScroll, 100);
      // Second check after images/layout might have shifted
      const timer2 = setTimeout(checkScroll, 1000);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [pathname]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const { scrollWidth, clientWidth } = container;
      // Threshold 10 to ignore tiny overflow rounding
      const overflow = scrollWidth > clientWidth + 10;
      setIsOverflowing(overflow);

      if (!overflow) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      // Visual detection: Check if the first and last items are truly visible
      // This is immune to scroll snap offsets or hidden offsets
      const items = container.querySelectorAll("a");
      if (items.length > 0) {
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        const containerRect = container.getBoundingClientRect();
        const firstRect = firstItem.getBoundingClientRect();
        const lastRect = lastItem.getBoundingClientRect();

        // 10px tolerance for rounding
        setCanScrollLeft(firstRect.left < containerRect.left - 10);
        setCanScrollRight(lastRect.right > containerRect.right + 10);
      }
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      // Allow time for the smooth scroll plus snap-alignment to settle
      setTimeout(checkScroll, 600);
    }
  };

  // Don't render if not on landing page
  if (!isLandingPage) {
    return null;
  }

  return (
    <div className="z-40 border-b border-white/10 bg-(--sub-header-bg) dark:bg-(--sub-header-bg)">
      <div className="group/nav relative mx-auto max-w-[1280px]">
        {/* Categories scroll container with CSS Scroll Snap */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="scrollbar-hide relative flex h-[80px] w-full snap-x snap-mandatory items-center justify-start overflow-x-auto scroll-smooth md:justify-center"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            touchAction: "pan-x",
            overscrollBehavior: "none",
            overflowY: "hidden",
            scrollPaddingLeft: "0px",
            scrollPaddingRight: "0px",
          }}
        >
          <div className="flex shrink-0 items-center gap-4 px-4 md:gap-6 md:px-8">
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

        {/* Navigation Buttons - Placed after scroll container for consistent stacking context */}
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="pointer-events-none absolute top-0 left-0 z-30 hidden h-full items-center bg-linear-to-r from-[#27272a] to-transparent pr-12 pl-2 md:flex"
            aria-label="Scroll left"
          >
            <div className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:scale-105 hover:bg-white/20 active:scale-95">
              <ChevronLeft className="h-5 w-5" />
            </div>
          </button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="pointer-events-none absolute top-0 right-0 z-30 hidden h-full items-center bg-linear-to-l from-[#27272a] to-transparent pr-2 pl-12 md:flex"
            aria-label="Scroll right"
          >
            <div className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:scale-105 hover:bg-white/20 active:scale-95">
              <ChevronRight className="h-5 w-5" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
