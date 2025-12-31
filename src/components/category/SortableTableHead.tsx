"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useTransition } from "react";

interface SortableTableHeadProps {
  sortKey: string;
  currentSortBy: string;
  currentSortOrder: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Client component for sortable table headers
 * Updates URL params when clicked for server-side sorting
 */
export function SortableTableHead({
  sortKey,
  currentSortBy,
  currentSortOrder,
  children,
  className = "",
}: SortableTableHeadProps) {
  const [, startTransition] = useTransition();
  const [, setSortBy] = useQueryState(
    "sortBy",
    parseAsString.withDefault("pricePerUnit").withOptions({
      shallow: false,
      clearOnDefault: true,
      startTransition,
    }),
  );
  
  const [, setSortOrder] = useQueryState(
    "sortOrder",
    parseAsString.withDefault("asc").withOptions({
      shallow: false,
      clearOnDefault: true,
      startTransition,
    }),
  );

  const handleSort = () => {
    const effectiveKey = !sortKey ? "pricePerUnit" : sortKey;
    const effectiveSortBy = !currentSortBy ? "pricePerUnit" : currentSortBy;
    const newOrder =
      effectiveSortBy === effectiveKey && currentSortOrder === "asc"
        ? "desc"
        : "asc";

    setSortBy(sortKey);
    setSortOrder(newOrder);
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
