"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trackSEO } from "@/lib/analytics";
import { Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { CountrySelector } from "@/components/country-selector";
import dynamic from "next/dynamic";

const SearchModal = dynamic(
  () => import("@/components/SearchModal").then((mod) => mod.SearchModal),
  {
    ssr: true,
  },
);

export function Navbar() {
  const { setTheme, theme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    // Observe hero search wrapper to show/hide navbar search
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When hero search is NOT visible, show navbar search
        setShowSearch(!entry.isIntersecting);
      },
      {
        threshold: 0.5, // Trigger when 50% of search is out of view
        rootMargin: "0px",
      },
    );

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const heroSearchElement = document.querySelector(
        ".search-with-animated-border",
      );
      if (heroSearchElement) {
        observer.observe(heroSearchElement);
        // Check initial state
        setShowSearch(
          !heroSearchElement.getBoundingClientRect().top ||
            heroSearchElement.getBoundingClientRect().top < 0,
        );
      } else {
        // No hero element found - show navbar search by default
        setShowSearch(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const heroSearchElement = document.querySelector(
        ".search-with-animated-border",
      );
      if (heroSearchElement) {
        observer.unobserve(heroSearchElement);
      }
    };
  }, [pathname]); // Re-run when route changes

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Left: Logo */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-6">
          <Link
            href="/"
            className="flex items-center space-x-2 no-underline"
            title="Amazon Price Per Unit Tracker, Storage Deals & True Value"
            aria-label="Real Price Data Home - Amazon Price Per Unit Tracker"
          >
            <Image
              src="/icon-192.png"
              alt="Real Price Data Logo"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <h3 className="text-lg font-black tracking-tight">
              <span className="text-(--ccc-red)">real</span>
              <span className="text-(--ccc-orange)">price</span>
              <span className="text-(--ccc-yellow)">data</span>
            </h3>
          </Link>
        </div>

        {/* Center: Global Search Button - shows when hero is scrolled out */}
        <div
          className={`flex flex-1 justify-center px-4 ${showSearch ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}
        >
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="border-border bg-card hover:bg-card/80 hover:border-primary/50 hidden w-full max-w-[320px] cursor-pointer items-center gap-3 rounded-md border px-4 py-2 shadow-sm sm:flex lg:max-w-[400px]"
            aria-label="Search all products"
          >
            <Search className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground flex-1 text-left text-base">
              Search all products...
            </span>
            <kbd className="bg-background/80 text-muted-foreground hidden items-center gap-1 rounded border px-2 py-0.5 text-sm font-medium lg:inline-flex">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Controls */}
        <TooltipProvider>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Mobile Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative cursor-pointer sm:hidden"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                >
                  <div className="bg-primary/10 absolute inset-0 rounded-md blur-sm" />
                  <Search className="text-primary relative z-10 h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Search products</p>
              </TooltipContent>
            </Tooltip>

            <CountrySelector />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => {
                    const newTheme = theme === "light" ? "dark" : "light";
                    setTheme(newTheme);
                    // Track theme change for SEO analytics
                    trackSEO.themeChanged(newTheme as "light" | "dark");
                  }}
                  aria-label={
                    mounted
                      ? `Switch to ${theme === "light" ? "dark" : "light"} mode`
                      : "Toggle theme"
                  }
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      )}
    </header>
  );
}
