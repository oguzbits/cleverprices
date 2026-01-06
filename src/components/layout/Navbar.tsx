import { TooltipProvider } from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_COUNTRY } from "@/lib/countries";

import { CountrySelector } from "@/components/country-selector";
import { SearchButton } from "@/components/layout/SearchButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SearchManager } from "@/components/layout/SearchManager";

export function Navbar({ country: propCountry }: { country?: string }) {
  const country = propCountry || DEFAULT_COUNTRY;

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="relative container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-6">
          <Link
            href={country === "us" ? "/" : `/${country}`}
            className="flex items-center space-x-2 no-underline"
            title="Amazon Price Per Unit Tracker, Storage Deals & True Value"
            aria-label="CleverPrices Home - Amazon Price Per Unit Tracker"
            prefetch={true}
          >
            <Image
              src="/icon-192.png"
              alt="CleverPrices Logo"
              width={28}
              height={28}
              className="h-7 w-7"
              priority
            />
            <h3 className="text-lg font-black tracking-tight">
              <span className="text-(--ccc-red)">clever</span>
              <span className="text-(--ccc-orange)">prices</span>
            </h3>
          </Link>
        </div>

        {/* Center: Global Search Button */}
        <SearchButton mode="desktop" />

        {/* Right: Controls */}
        <TooltipProvider>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <SearchButton mode="mobile" />
            <CountrySelector currentCountryCode={country} />
            <ThemeToggle />
          </div>
        </TooltipProvider>
      </div>
      {/* Centralized Search Manager handles the single Modal instance */}
      <SearchManager />
    </header>
  );
}
