"use client";

import { getCategoryPath, type CategorySlug } from "@/lib/categories";
import {
  Camera,
  ChevronLeft,
  Cpu,
  Grid3X3,
  HardDrive,
  MemoryStick,
  Monitor,
  Printer,
  Video,
  Wifi,
  Zap,
} from "lucide-react";
import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Core PC component categories - prioritized for focus
const categories: {
  slug: CategorySlug | null;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { slug: null, label: "Elektroartikel", icon: Grid3X3 },
  { slug: "cpu", label: "Prozessoren", icon: Cpu },
  { slug: "gpu", label: "Grafikkarten", icon: Video },
  { slug: "ram", label: "Arbeitsspeicher", icon: MemoryStick },
  { slug: "hard-drives", label: "Festplatten", icon: HardDrive },
  { slug: "power-supplies", label: "Netzteile", icon: Zap },
  { slug: "monitors", label: "Monitore", icon: Monitor },
  { slug: "3d-drucker", label: "3D-Drucker", icon: Printer },
  { slug: "cameras", label: "Kameras", icon: Camera },
  { slug: "routers", label: "Router", icon: Wifi },
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
    <div className="z-40 border-b border-white/10 bg-(--sub-header-bg) dark:bg-(--sub-header-bg)">
      <div className="relative mx-auto max-w-[1280px] px-4">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-0 z-10 flex h-full -translate-y-1/2 items-center bg-linear-to-r from-[#27272a] via-[#27272a] to-transparent pr-4 pl-2"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-zinc-400" />
          </button>
        )}

        {/* Categories scroll container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="scrollbar-hide flex h-[80px] items-center justify-center gap-6 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            touchAction: "pan-x",
            overscrollBehavior: "none",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            height: "100%",
          }}
        >
          {/* All Categories Button */}
          <PrefetchLink
            href="/elektroartikel"
            className="flex shrink-0 flex-col items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium text-white/80 no-underline transition-all hover:bg-white/10 hover:text-(--ccc-orange)"
          >
            <Grid3X3 className="h-6 w-6" />
            <span>Elektroartikel</span>
          </PrefetchLink>

          {/* Category Pills - Icons on top */}
          {categories
            .filter((cat) => cat.slug !== null)
            .map((cat) => {
              const Icon = cat.icon;
              return (
                <PrefetchLink
                  key={cat.slug}
                  href={getCategoryPath(cat.slug!)}
                  className="flex shrink-0 flex-col items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium text-white/80 no-underline transition-all hover:bg-white/10 hover:text-(--ccc-orange)"
                >
                  <Icon className="h-6 w-6" />
                  <span className="whitespace-nowrap">{cat.label}</span>
                </PrefetchLink>
              );
            })}
        </div>
      </div>
    </div>
  );
}
