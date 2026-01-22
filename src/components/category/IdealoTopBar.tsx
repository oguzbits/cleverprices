/**
 * Idealo Top Bar - sr-topBar_iwPzv
 *
 * Contains:
 * - Category title with product count
 * - Sorting dropdown
 * - View switch (grid/list toggle) - sr-resultListViewSwitch_ANJB0
 *
 * Based on actual Idealo HTML structure
 */

"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface IdealoTopBarProps {
  categoryName: string;
  productCount: number;
  currentView: string;
  currentSort: string;
}

const SORT_OPTIONS = [
  { value: "popular", label: "Beliebteste zuerst" },
  { value: "deal", label: "Größte Ersparnis zuerst" },
  { value: "price_asc", label: "Preis: Günstigster zuerst" },
  { value: "price_desc", label: "Preis: Höchster zuerst" },
  { value: "newest", label: "Neuheiten zuerst" },
];

export function IdealoTopBar({
  categoryName,
  productCount,
  currentView,
  currentSort,
}: IdealoTopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "popular") {
      params.delete("sort"); // Default, no need to set
    } else {
      params.set("sort", sort);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className={cn(
        "sr-topBar",
        "mb-4 flex flex-col gap-3",
        "min-[840px]:flex-row min-[840px]:items-center min-[840px]:justify-between",
      )}
    >
      {/* LEFT: Category Title + Count */}
      <h1 className="sr-topBar__title text-[18px] font-bold text-[#2d2d2d]">
        {categoryName}
        <span className="sr-topBar__productCount ml-1.5 text-[14px] font-normal text-[#767676]">
          ({productCount.toLocaleString("de-DE")})
        </span>
      </h1>

      {/* RIGHT: Sort + View Toggle */}
      <div className="sr-topBar__controls flex items-center gap-4">
        {/* Sorting Dropdown - Now Functional */}
        <div className="sr-sortingDropdown flex items-center gap-2 text-[14px]">
          <label htmlFor="sort-select" className="text-[#767676]">
            Sortieren:
          </label>
          <select
            id="sort-select"
            value={currentSort}
            onChange={(e) => setSort(e.target.value)}
            className={cn(
              "cursor-pointer appearance-none",
              "border-none bg-transparent",
              "pr-5 font-bold text-[#2d2d2d]",
              "hover:text-[#0771d0]",
              "focus:ring-0 focus:outline-none",
            )}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232d2d2d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right center",
              backgroundSize: "16px",
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* ============================================ */}
        {/* VIEW SWITCH - sr-resultListViewSwitch_ANJB0 */}
        {/* Grid and List toggle buttons */}
        {/* ============================================ */}
        <div
          className={cn(
            "sr-resultListViewSwitch",
            "flex gap-1 border-l border-[#dcdcdc] pl-4",
          )}
        >
          {/* Grid View Button */}
          <button
            onClick={() => setView("grid")}
            className={cn(
              "sr-resultListViewSwitch__button",
              "flex h-8 w-8 items-center justify-center rounded border p-1.5",
              "transition-colors",
              currentView === "grid"
                ? "sr-toggled border-[#0771d0] bg-[#0771d0] text-white"
                : "border-[#dcdcdc] bg-white text-[#767676] hover:border-[#0771d0] hover:text-[#0771d0]",
            )}
            aria-label="Kachelansicht"
            title="Kachelansicht"
          >
            {/* Grid Icon - 4 squares */}
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-full w-full"
            >
              <rect x="1" y="1" width="6" height="6" rx="0.5" />
              <rect x="9" y="1" width="6" height="6" rx="0.5" />
              <rect x="1" y="9" width="6" height="6" rx="0.5" />
              <rect x="9" y="9" width="6" height="6" rx="0.5" />
            </svg>
          </button>

          {/* List View Button */}
          <button
            onClick={() => setView("list")}
            className={cn(
              "sr-resultListViewSwitch__button",
              "flex h-8 w-8 items-center justify-center rounded border p-1.5",
              "transition-colors",
              currentView === "list"
                ? "sr-toggled border-[#0771d0] bg-[#0771d0] text-white"
                : "border-[#dcdcdc] bg-white text-[#767676] hover:border-[#0771d0] hover:text-[#0771d0]",
            )}
            aria-label="Listenansicht"
            title="Listenansicht"
          >
            {/* List Icon - 3 horizontal lines */}
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-full w-full"
            >
              <rect x="1" y="2" width="14" height="3" rx="0.5" />
              <rect x="1" y="7" width="14" height="3" rx="0.5" />
              <rect x="1" y="12" width="14" height="3" rx="0.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
