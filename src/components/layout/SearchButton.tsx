"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search } from "lucide-react";
import * as React from "react";

// Detect Mac once on client
const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
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
            <kbd className="hidden items-center gap-1 rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-sm font-medium text-zinc-600 lg:inline-flex">
              {isMac ? "⌘" : "Ctrl+"}K
            </kbd>
          </button>
        </div>
      )}

      {mode === "mobile" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="cursor-pointer sm:hidden"
              onClick={handleOpen}
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Search products</p>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
