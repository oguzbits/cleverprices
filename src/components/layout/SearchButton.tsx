"use client";

import { Search } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function SearchButton({
  mode = "desktop",
  className,
}: {
  mode?: "mobile" | "desktop";
  className?: string;
}) {
  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    window.triggerSearch?.();
  };

  return (
    <>
      {mode === "desktop" && (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "flex h-11 w-[350px] cursor-pointer items-center gap-3 rounded-[6px] border border-white/20 bg-white px-5 shadow-lg transition-all hover:shadow-xl lg:w-[500px]",
            className,
          )}
          aria-label="Suche..."
        >
          <Search className="h-5 w-5 text-zinc-500" />
          <span className="flex-1 text-left text-base text-zinc-500">
            Suche...
          </span>
        </button>
      )}

      {mode === "mobile" && (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "flex h-10 w-full max-w-[180px] cursor-pointer items-center gap-2 rounded-[6px] border border-white/20 bg-white px-3 shadow-sm transition-all",
            className,
          )}
          aria-label="Open search"
        >
          <Search className="h-4 w-4 text-zinc-500" />
          <span className="truncate text-sm text-zinc-500">Search...</span>
        </button>
      )}
    </>
  );
}
