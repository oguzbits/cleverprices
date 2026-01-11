"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search } from "lucide-react";
import * as React from "react";

export function SearchButton({
  mode = "desktop",
}: {
  mode?: "mobile" | "desktop";
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
          className="hidden w-[320px] cursor-pointer items-center gap-3 rounded-full border border-white/20 bg-white px-5 py-2.5 shadow-lg transition-all hover:shadow-xl sm:flex lg:w-[450px]"
          aria-label="Search all products"
        >
          <Search className="h-5 w-5 text-zinc-500" />
          <span className="flex-1 text-left text-base text-zinc-500">
            Search products, categories...
          </span>
        </button>
      )}

      {mode === "mobile" && (
        <button
          type="button"
          onClick={handleOpen}
          className="flex h-10 w-full max-w-[180px] cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white px-3 shadow-md transition-all sm:hidden"
          aria-label="Open search"
        >
          <Search className="h-4 w-4 text-zinc-500" />
          <span className="truncate text-sm text-zinc-500">Search...</span>
        </button>
      )}
    </>
  );
}
