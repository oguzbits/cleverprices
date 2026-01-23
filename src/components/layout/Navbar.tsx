import { DEFAULT_COUNTRY } from "@/lib/countries";

import { Logo } from "@/components/layout/Logo";
import { SearchButton } from "@/components/layout/SearchButton";
import { SearchManager } from "@/components/layout/SearchManager";

export function Navbar({ country: propCountry }: { country?: string }) {
  const country = propCountry || DEFAULT_COUNTRY;

  return (
    <>
      <header className="z-50 w-full bg-(--header-bg) shadow-md">
        <div className="relative mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-4 px-4">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Logo />
          </div>

          {/* Center Search - Only on Desktop (840px+) */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center min-[840px]:flex">
            <div className="pointer-events-auto">
              <SearchButton mode="desktop" />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-6">
            <SearchButton mode="mobile" className="hidden" />
          </div>
        </div>

        {/* Second row search - Visible below 840px */}
        <div className="mx-auto w-full max-w-[1280px] px-4 pb-4 min-[840px]:hidden">
          <SearchButton
            mode="desktop"
            className="flex w-full max-w-none shadow-sm sm:mx-auto sm:w-[500px]"
          />
        </div>

        <SearchManager />
      </header>
    </>
  );
}
