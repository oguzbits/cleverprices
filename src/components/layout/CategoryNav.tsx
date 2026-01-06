"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCategoryPath, type CategorySlug } from "@/lib/categories";
import { type CountryCode } from "@/lib/countries";
import { HardDrive, MemoryStick, Zap, Grid3X3 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const categories: {
  slug: CategorySlug;
  label: string;
  icon: typeof HardDrive;
}[] = [
  { slug: "hard-drives", label: "Hard Drives & SSDs", icon: HardDrive },
  { slug: "ram", label: "RAM & Memory", icon: MemoryStick },
  { slug: "power-supplies", label: "Power Supplies", icon: Zap },
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

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  // Don't render if not on landing page
  if (!isLandingPage) {
    return null;
  }

  return (
    <div className="sticky top-16 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative container mx-auto px-4">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-0 z-10 flex h-full -translate-y-1/2 items-center bg-linear-to-r from-white via-white to-transparent pr-4 pl-2 dark:from-zinc-900 dark:via-zinc-900"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        )}

        {/* Categories scroll container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="scrollbar-hide flex items-center justify-center gap-6 overflow-x-auto py-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* All Categories Button */}
          <Link
            href={country === "us" ? "/categories" : `/${country}/categories`}
            className="flex shrink-0 flex-col items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white no-underline transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--header-bg)" }}
            prefetch={true}
          >
            <Grid3X3 className="h-8 w-8" />
            <span>All Categories</span>
          </Link>

          {/* Category Pills - Icons on top */}
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={getCategoryPath(cat.slug, country as CountryCode)}
                className="flex shrink-0 flex-col items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 no-underline transition-all hover:bg-zinc-100 hover:text-(--ccc-orange) dark:text-zinc-300 dark:hover:bg-zinc-800"
                prefetch={true}
              >
                <Icon className="h-8 w-8" />
                <span className="whitespace-nowrap">{cat.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute top-1/2 right-0 z-10 flex h-full -translate-y-1/2 items-center bg-linear-to-l from-white via-white to-transparent pr-2 pl-4 dark:from-zinc-900 dark:via-zinc-900"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        )}
      </div>
    </div>
  );
}
