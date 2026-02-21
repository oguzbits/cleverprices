"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SortableTableHeadProps {
  sortKey: string;
  currentSortBy: string;
  currentSortOrder: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Client component for sortable table headers.
 * Updates URL params when clicked for server-side sorting.
 * Uses native useSearchParams instead of nuqs.
 */
export function SortableTableHead({
  sortKey,
  currentSortBy,
  currentSortOrder,
  children,
  className = "",
}: SortableTableHeadProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSort = () => {
    const effectiveKey = !sortKey ? "pricePerUnit" : sortKey;
    const effectiveSortBy = !currentSortBy ? "pricePerUnit" : currentSortBy;
    const newOrder =
      effectiveSortBy === effectiveKey && currentSortOrder === "asc"
        ? "desc"
        : "asc";

    const newParams = new URLSearchParams(searchParams.toString());

    // Set sortBy — clear if default
    if (sortKey === "pricePerUnit") {
      newParams.delete("sortBy");
    } else {
      newParams.set("sortBy", sortKey);
    }

    // Set sortOrder — clear if default
    if (newOrder === "asc") {
      newParams.delete("sortOrder");
    } else {
      newParams.set("sortOrder", newOrder);
    }

    const query = newParams.toString();
    const newUrl = `${pathname}${query ? `?${query}` : ""}`;
    router.replace(newUrl, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSort();
    }
  };

  const getSortIcon = () => {
    const effectiveSortBy = !currentSortBy ? "pricePerUnit" : currentSortBy;
    if (effectiveSortBy !== sortKey)
      return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return currentSortOrder === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <th
      className={className}
      onClick={handleSort}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-sort={
        currentSortBy === sortKey
          ? currentSortOrder === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      role="columnheader"
    >
      <div className="flex items-center gap-1.5">
        {children}
        {getSortIcon()}
      </div>
    </th>
  );
}
