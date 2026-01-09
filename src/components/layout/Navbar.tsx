import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_COUNTRY } from "@/lib/countries";

import { CategoryNav } from "@/components/layout/CategoryNav";
import { Logo } from "@/components/layout/Logo";
import { SearchButton } from "@/components/layout/SearchButton";
import { SearchManager } from "@/components/layout/SearchManager";

export function Navbar({ country: propCountry }: { country?: string }) {
  const country = propCountry || DEFAULT_COUNTRY;

  return (
    <>
      <header className="z-50 w-full bg-(--header-bg) shadow-md">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-4 px-4">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Logo />
          </div>

          {/* Center Search - Only on Desktop */}
          <div className="relative hidden h-full max-w-4xl flex-1 items-center justify-center sm:flex">
            <SearchButton mode="desktop" />
          </div>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-6">
            <SearchButton mode="mobile" />
          </div>
        </div>
        <SearchManager />
      </header>

      {/* Category Nav - Simplified */}
      <CategoryNav country={country} />
    </>
  );
}
