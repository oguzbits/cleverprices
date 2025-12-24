"use client";

import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { SearchModal } from "@/components/SearchModal";

export function HeroSearch({ isSticky = false }: { isSticky?: boolean }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    // Only inject styles once on client side
    if (!document.getElementById("hero-search-animation")) {
      const style = document.createElement("style");
      style.id = "hero-search-animation";
      style.textContent = `
        @keyframes border-flow {
          0%, 100% { border-color: hsl(220, 100%, 60%); }
          33% { border-color: hsl(280, 100%, 65%); }
          66% { border-color: hsl(320, 100%, 65%); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <>
      <button
        onClick={() => setSearchOpen(true)}
        className="search-with-animated-border group bg-card flex w-full cursor-text items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-sm transition-all hover:shadow-lg sm:gap-4 sm:px-6 sm:py-4"
        style={{
          borderColor: "hsl(220, 100%, 60%)",
          animation: "border-flow 4s ease-in-out infinite",
        }}
        aria-label="Open search"
      >
        <Search className="text-primary h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
        <div className="flex-1 text-left">
          <span className="text-muted-foreground group-hover:text-foreground text-base transition-colors sm:text-lg">
            {isSticky ? "Search..." : "Search products..."}
          </span>
        </div>
        <kbd className="border-border/60 bg-muted/50 text-muted-foreground hidden shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 font-mono text-sm sm:flex">
          <span className="text-base">⌘</span>K
        </kbd>
      </button>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
