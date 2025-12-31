"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useTransition } from "react";

/**
 * Client component for search input that syncs with URL
 */
export function SearchInput() {
  const [, startTransition] = useTransition();
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      throttleMs: 300,
      clearOnDefault: true,
      startTransition,
    }),
  );

  return (
    <div className="relative flex-1 md:w-64 lg:w-80 md:flex-none">
      <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
      <Input
        placeholder="Search products..."
        className="bg-card dark:bg-card focus-visible:border-primary h-10 pl-8 shadow-sm transition-colors focus-visible:ring-0"
        value={search}
        onChange={(e) => setSearch(e.target.value || null)}
        aria-label="Search products"
      />
    </div>
  );
}
