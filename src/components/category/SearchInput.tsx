"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Input } from "@/components/ui/input";

/**
 * Client component for search input that syncs with URL.
 * Uses native useSearchParams instead of nuqs.
 */
export function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Local state for immediate input responsiveness
  const [localValue, setLocalValue] = useState(
    searchParams.get("search") || "",
  );

  // Debounce timer ref
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const updateUrl = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams.toString());
      if (value) {
        newParams.set("search", value);
      } else {
        newParams.delete("search");
      }
      const query = newParams.toString();
      const newUrl = `${pathname}${query ? `?${query}` : ""}`;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);

    // Debounce URL update (300ms, matching old nuqs throttleMs)
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(
      setTimeout(() => {
        updateUrl(value);
      }, 300),
    );
  };

  return (
    <div className="relative flex-1 md:w-64 md:flex-none lg:w-80">
      <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
      <Input
        placeholder="Search products..."
        className="bg-card dark:bg-card focus-visible:border-primary h-10 pl-8 shadow-sm transition-colors focus-visible:ring-0"
        value={localValue}
        onChange={handleChange}
        aria-label="Search products"
      />
    </div>
  );
}
