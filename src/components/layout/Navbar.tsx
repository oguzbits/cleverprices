import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_COUNTRY } from "@/lib/countries";

import { CountrySelector } from "@/components/country-selector";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { Logo } from "@/components/layout/Logo";
import { SearchButton } from "@/components/layout/SearchButton";
import { SearchManager } from "@/components/layout/SearchManager";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Navbar({ country: propCountry }: { country?: string }) {
  const country = propCountry || DEFAULT_COUNTRY;

  return (
    <>
      {/* Main Header */}
      <header
        className="sticky top-0 z-50 w-full border-b border-white/10"
        style={{ backgroundColor: "var(--header-bg)" }}
      >
        <div className="relative container mx-auto flex h-20 items-center justify-between px-4">
          {/* Left: Logo */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-6">
            <Logo country={country} />
          </div>

          {/* Center: Global Search Button */}
          <SearchButton mode="desktop" />

          {/* Right: Controls */}
          <TooltipProvider>
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <SearchButton mode="mobile" />
              <CountrySelector currentCountryCode={country} variant="dark" />
              <ThemeToggle variant="dark" />
            </div>
          </TooltipProvider>
        </div>
        {/* Centralized Search Manager handles the single Modal instance */}
        <SearchManager />
      </header>

      {/* Category Navigation Strip - Self-manages visibility based on pathname */}
      <CategoryNav country={country} />
    </>
  );
}
