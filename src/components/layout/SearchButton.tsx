"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import * as React from "react";

const SearchModal = dynamic(
  () => import("@/components/SearchModal").then((mod) => mod.SearchModal),
  {
    ssr: true,
  },
);

export function SearchButton({
  mode = "desktop",
}: {
  mode?: "mobile" | "desktop";
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Search Button */}
      {mode === "desktop" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="border-border bg-card hover:bg-card/80 hover:border-primary/50 hidden w-[320px] cursor-pointer items-center gap-3 rounded-md border px-4 py-2 shadow-sm sm:flex lg:w-[400px]"
            aria-label="Search all products"
          >
            <Search className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground flex-1 text-left text-base">
              Search all products...
            </span>
            <kbd className="bg-background/80 text-muted-foreground hidden items-center gap-1 rounded border px-2 py-0.5 text-sm font-medium lg:inline-flex">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Mobile Search Button */}
      {mode === "mobile" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="cursor-pointer sm:hidden"
              onClick={() => setSearchOpen(true)}
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

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
