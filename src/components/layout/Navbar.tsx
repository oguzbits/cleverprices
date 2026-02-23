import { Logo } from "@/components/layout/Logo";
import { SearchButton } from "@/components/layout/SearchButton";
import { SearchManager } from "@/components/layout/SearchManager";
import * as React from "react";

export function Navbar() {
  return (
    <>
      <header className="z-50 w-full bg-(--header-bg) shadow-md">
        {/*
         * 3-column grid layout to avoid any absolutely positioned overlays.
         * An `absolute inset-0 pointer-events-none` div can race against
         * CSS hydration and swallow the first click on the Logo.
         * Grid approach is pointer-event safe from the first paint.
         */}
        <div className="mx-auto grid h-20 max-w-[1280px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4">
          {/* Col 1: Logo */}
          <Logo />

          {/* Col 2: Center Search (desktop only, hidden on mobile) */}
          <div className="hidden items-center justify-center min-[840px]:flex">
            <SearchButton mode="desktop" />
          </div>
          {/* Col 2 placeholder on mobile so grid stays consistent */}
          <div className="min-[840px]:hidden" />

          {/* Col 3: Right controls (mobile search icon placeholder) */}
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

        <React.Suspense fallback={null}>
          <SearchManager />
        </React.Suspense>
      </header>
    </>
  );
}
