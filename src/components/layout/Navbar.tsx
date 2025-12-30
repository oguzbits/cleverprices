import { TooltipProvider } from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";

import { CountrySelector } from "@/components/country-selector";
import { SearchButton } from "@/components/layout/SearchButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Navbar() {

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container relative mx-auto flex h-16 items-center justify-between px-4">
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

        {/* Center: Global Search Button */}
        <SearchButton />

        {/* Right: Controls */}
        <TooltipProvider>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <CountrySelector />
            <ThemeToggle />
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
