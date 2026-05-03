/**
 * Idealo Filter Bar - sr-filterBar_t26b_
 *
 * PIXEL-PERFECT REPLICATION OF: idealo-cpu-filter-panel.html
 */

"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { PriceRangeSlider } from "@/components/ui/PriceRangeSlider";
import { FilterGroup } from "@/lib/category-types";
import { type FilterState, useFilters } from "@/lib/hooks/use-filters";
import type { FilterCounts } from "@/lib/product-definitions";
import { cn } from "@/lib/utils";

interface IdealoFilterBarProps {
  categorySlug: string;
  unitLabel: string;
  isMobile?: boolean;
  onFilterChange?: () => void;
  filterOptions?: Record<string, string[]>;
  filterCounts?: FilterCounts;
  priceRanges?: { label: string; min: number | null; max: number | null }[];
  minPriceInCategory?: number;
  maxPriceInCategory?: number;
  filterGroups?: FilterGroup[];
  lockedFilters?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_OBJECT: any = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_ARRAY: any[] = [];

// ============================================
// SVG ICONS (EXTRACTED FROM IDEALO HTML)
// ============================================

const ToggleIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className={cn("transition-transform duration-200", className)}
  >
    <path d="M12 16a1 1 0 0 1-.7-.3l-6-6a1 1 0 0 1 1.4-1.4l5.3 5.3 5.3-5.3a1 1 0 0 1 1.4 1.4l-6 6a1 1 0 0 1-.7.3" />
  </svg>
);

const SearchIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className={cn("text-[#767676]", className)}
  >
    <path d="m22.7 21.3-4.8-4.8a9.6 9.6 0 1 0-1.4 1.4l4.7 4.8a1 1 0 1 0 1.5-1.4M3 10.5a7.5 7.5 0 1 1 7.5 7.5A7.5 7.5 0 0 1 3 10.5" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-current"
  >
    <path d="M7 23a1 1 0 0 1-.7-.17l9.3-9.3-9.3-9.3a1 1 0 0 1 1.4-1.4l10 10a1 1 0 0 1 0 1.4l-10 10a1 1 0 0 1-.7.3" />
  </svg>
);

// ============================================
// SUB-COMPONENTS
// ============================================

// Primary filters that should be expanded by default (like idealo)
// All other filters (technical specs) will be collapsed
const PRIMARY_FILTERS = [
  "brand",
  "capacity",
  "formFactor",
  "technology",
  "condition",
  "socket",
  "cores",
];

/**
 * Format capacity values with smart GB/TB detection
 * - Values stored as fractions of TB (e.g., 0.128, 0.256, 0.5) are shown as GB
 * - Values >= 1 are shown in TB
 */
function formatCapacity(value: string, _unitLabel: string): string {
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue <= 0) return "";

  // Input value is normalized capacity in GB (e.g. 500, 1000, 2000)

  if (numValue >= 1000) {
    // >= 1000 GB -> Display as TB
    const tbValue = Math.round(numValue / 1000);
    return `${tbValue} TB`;
  } else {
    // < 1000 GB -> Display as GB
    return `${Math.round(numValue)} GB`;
  }
}

/**
 * Check if a capacity value is valid and should be shown
 */
function isValidCapacity(value: string): boolean {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue > 0;
}

/**
 * Format option label based on field type
 */
function formatOptionLabel(
  option: string,
  field: string,
  unitLabel: string,
): string {
  if (field === "capacity") {
    return formatCapacity(option, unitLabel);
  }
  return option;
}

interface FilterBoxProps {
  title: string;
  activeCount?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isClickable?: boolean;
  isMobile?: boolean;
  onReset?: () => void;
}

function FilterBox({
  title,
  activeCount = 0,
  defaultOpen = true,
  children,
  isClickable = true,
  isMobile = false,
  onReset,
}: FilterBoxProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "sr-filterBox_Kcxex",
        !isMobile
          ? "border-b border-white bg-[#D7E3EF] px-[15px] py-[10px]"
          : "border-b border-[#e0e0e0] bg-white px-4 py-3",
      )}
    >
      <div
        className={cn(
          "sr-boxTitle_Edq1D flex h-10 w-full items-center justify-between",
          isClickable && "cursor-pointer",
        )}
        onClick={() => isClickable && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="sr-boxTitle__text_GpnLJ text-[14px] font-bold text-[#0A3761]">
            {title}
          </span>
          {activeCount > 0 && !onReset && (
            <span className="sr-filterGroup__count_v8Ba5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0771D0] text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && onReset && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="text-[12px] font-medium text-[#0771D0] hover:underline"
            >
              Zurücksetzen
            </button>
          )}
          {isClickable && (
            <ToggleIcon
              className={cn(
                "sr-boxTitle__toggleIcon_HOxDo text-[#0A3761]",
                isOpen && "rotate-180",
              )}
            />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="sr-filterBox__content_sBZlc sr-filterBox__content--titled_kHny8 mt-2">
          {children}
        </div>
      )}
    </div>
  );
}

const PREMIUM_BRANDS = [
  "Samsung",
  "Western Digital",
  "Apple",
  "Crucial",
  "SanDisk",
  "Kingston",
  "Seagate",
  "Toshiba",
  "ASUS",
  "Gigabyte",
  "MSI",
  "Corsair",
  "HP",
  "Intel",
  "Dell",
  "Lenovo",
  "Acer",
  "Logitech",
  "LG",
  "Sony",
];

export function IdealoFilterPanel({
  categorySlug: _categorySlug,
  unitLabel,
  isMobile = false,
  onFilterChange,
  filterOptions = DEFAULT_OBJECT,
  filterCounts = DEFAULT_OBJECT,
  priceRanges = DEFAULT_ARRAY,
  minPriceInCategory = 0,
  maxPriceInCategory = 1000,
  filterGroups = DEFAULT_ARRAY,
  lockedFilters = DEFAULT_ARRAY,
}: IdealoFilterBarProps) {
  const [filters, setFilters] = useFilters();

  // Optimistic local state to make clicks feel instant
  const [optimisticFilters, setOptimisticFilters] = useState(filters);

  // Sync back if URL changes (e.g. back button) - Using render-phase sync for React Compiler compliance
  const [prevFilters, setPrevFilters] = useState(filters);
  if (filters !== prevFilters) {
    setPrevFilters(filters);
    setOptimisticFilters(filters);
  }

  const currentFilters = optimisticFilters;

  // Group search states
  const [groupSearch, setGroupSearch] = useState<Record<string, string>>({});
  const [groupShowAll, setGroupShowAll] = useState<Record<string, boolean>>({});

  // Derive options for filter groups
  const optionsMap = (() => {
    if (!filterGroups) return {};
    const options: Record<string, string[]> = {};
    filterGroups.forEach((group) => {
      const rawOptions = group.options || filterOptions[group.field] || [];

      // Sort options by count descending
      const sorted = [...rawOptions].sort((a, b) => {
        const countA = filterCounts[group.field]?.[a] || 0;
        const countB = filterCounts[group.field]?.[b] || 0;

        // Primary sort: Count descending
        if (countB !== countA) return countB - countA;

        // Secondary sort: Alphanumeric
        return a.localeCompare(b, undefined, { numeric: true });
      });

      // DO NOT filter out options with 0 count to avoid "jumping" UI
      options[group.field] = sorted;
    });
    return options;
  })();

  // Handle price update
  const handlePriceUpdate = (min: string, max: string) => {
    const minNum = min ? parseInt(min) : null;
    const maxNum = max ? parseInt(max) : null;

    // Optimistic update
    setOptimisticFilters((prev) => ({
      ...prev,
      minPrice: minNum,
      maxPrice: maxNum,
    }));

    setFilters({
      minPrice: minNum,
      maxPrice: maxNum,
    });
    if (onFilterChange) onFilterChange();
  };

  // Generic checkbox update
  const toggleCheckbox = (field: string, value: string) => {
    const current =
      (optimisticFilters[field as keyof FilterState] as string[]) || [];
    const next = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];

    // Optimistic update
    setOptimisticFilters((prev) => ({
      ...prev,
      [field]: next,
    }));

    setFilters({ [field]: next });
    if (onFilterChange) onFilterChange();
  };

  return (
    <div
      className={cn(
        "sr-filterBar_t26b_",
        "flex h-full min-h-full w-full flex-col",
        !isMobile ? "bg-transparent p-0" : "bg-[#f9f9f9]",
      )}
    >
      <div className="sr-filterBar__content_eiiz2">
        {/* PRICE SECTION */}
        <FilterBox
          title="Preis"
          activeCount={
            currentFilters.minPrice !== null || currentFilters.maxPrice !== null
              ? 1
              : 0
          }
          isClickable={false}
          isMobile={isMobile}
          onReset={() => setFilters({ minPrice: null, maxPrice: null })}
        >
          <div className="sr-priceInteractionWidget_aTL8j space-y-4 py-2">
            <div className="sr-priceInteractionWidget__inputGroup_vgde0 flex items-center gap-1.5">
              <div className="sr-iFormElement_Fwa2t relative flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={minPriceInCategory.toString()}
                  value={currentFilters.minPrice?.toString() || ""}
                  onChange={(e) =>
                    setFilters({
                      minPrice: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="sr-iInput_KnTXI h-10 w-full rounded-[4px] border border-[#B4B4B4] bg-white pr-6 pl-3 text-[14px] focus:border-[#0771D0] focus:outline-none"
                />
                <span className="sr-priceInteractionWidget__currencyIcon_yjBxb absolute top-2.5 right-2 text-[14px] text-[#767676]">
                  €
                </span>
              </div>
              <span className="sr-priceInteractionWidget__separator_Eo5sa px-2 text-[#767676]">
                -
              </span>
              <div className="sr-iFormElement_Fwa2t relative flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={maxPriceInCategory.toString()}
                  value={currentFilters.maxPrice?.toString() || ""}
                  onChange={(e) =>
                    setFilters({
                      maxPrice: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="sr-iInput_KnTXI h-10 w-full rounded-[4px] border border-[#B4B4B4] bg-white pr-6 pl-3 text-[14px] focus:border-[#0771D0] focus:outline-none"
                />
                <span className="sr-priceInteractionWidget__currencyIcon_yjBxb absolute top-2.5 right-2 text-[14px] text-[#767676]">
                  €
                </span>
              </div>
              <button
                onClick={() =>
                  handlePriceUpdate(
                    currentFilters.minPrice?.toString() || "",
                    currentFilters.maxPrice?.toString() || "",
                  )
                }
                className="sr-iButton__default_Ihhof flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-[#0771D0] text-white hover:bg-[#0050a0]"
              >
                <ArrowRightIcon />
              </button>
            </div>

            {/* Price Slider */}
            <div className="px-1 py-2">
              <PriceRangeSlider
                min={minPriceInCategory}
                max={maxPriceInCategory}
                value={[
                  currentFilters.minPrice ?? minPriceInCategory,
                  currentFilters.maxPrice ?? maxPriceInCategory,
                ]}
                onChange={([min, max]) => {
                  setFilters({
                    minPrice: min === minPriceInCategory ? null : min,
                    maxPrice: max === maxPriceInCategory ? null : max,
                  });
                  if (onFilterChange) onFilterChange();
                }}
              />
            </div>

            {/* Price Ranges Wrapper */}
            <div className="sr-priceBox__rangesWrapper_fhTcS mt-3 space-y-1">
              {(priceRanges.length > 0
                ? priceRanges
                : [
                    { label: "bis 130 €", min: null, max: 130 },
                    { label: "130 € bis 330 €", min: 130, max: 330 },
                    { label: "330 € bis 940 €", min: 330, max: 940 },
                    { label: "ab 940 €", min: 940, max: null },
                  ]
              ).map((range) => {
                const rangeKey = `${range.min}-${range.max}-${range.label}`;
                const isSelected =
                  currentFilters.minPrice === range.min &&
                  currentFilters.maxPrice === range.max;
                return (
                  <label
                    key={rangeKey}
                    className="group/item flex cursor-pointer items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        className="h-[18px] w-[18px] rounded-[3px] border-[#B4B4B4] bg-white data-[state=checked]:border-[#0771D0] data-[state=checked]:bg-[#0771D0]"
                        checked={isSelected}
                        onCheckedChange={() => {
                          if (isSelected) {
                            setFilters({ minPrice: null, maxPrice: null });
                          } else {
                            setFilters({
                              minPrice: range.min,
                              maxPrice: range.max,
                            });
                          }
                        }}
                      />
                      <span className="text-[13px] text-[#2d2d2d] group-hover/item:text-[#0771D0]">
                        {range.label}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </FilterBox>

        {/* DYNAMIC FILTER GROUPS */}
        {filterGroups?.map((group) => {
          if (lockedFilters.includes(group.field)) return null;

          let options = optionsMap[group.field] || [];

          // SPECIAL SORTING FOR BRANDS
          if (group.field === "brand") {
            const isExpanded = groupShowAll[group.field] || false; // Re-fetch isExpanded for this scope
            if (isExpanded) {
              // Alphanumeric sort when expanded
              options = [...options].sort((a, b) =>
                a.toLowerCase().localeCompare(b.toLowerCase()),
              );
            } else {
              // Priority sort when collapsed
              options = [...options].sort((a, b) => {
                const aIndex = PREMIUM_BRANDS.indexOf(a);
                const bIndex = PREMIUM_BRANDS.indexOf(b);

                // Both premium? Sort by priority in list
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                // One premium? Keep it at top
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;

                // Neither premium? Sort by count (desc) then alpha
                const aCount = filterCounts?.[group.field]?.[a] || 0;
                const bCount = filterCounts?.[group.field]?.[b] || 0;
                if (aCount !== bCount) return bCount - aCount;

                return a.toLowerCase().localeCompare(b.toLowerCase());
              });
            }
          }

          // For capacity field, filter out invalid values (0, empty, etc.)
          if (group.field === "capacity") {
            options = options.filter(isValidCapacity);
          }

          // Skip if no options OR only 1 option (no point showing a filter with no choice)
          if (options.length <= 1) return null;

          const currentValues =
            (currentFilters[group.field as keyof FilterState] as string[]) ||
            [];
          const query = groupSearch[group.field] || "";
          const isExpanded = groupShowAll[group.field] || false;

          const filteredOptions = options.filter((opt) =>
            opt.toLowerCase().includes(query.toLowerCase()),
          );

          return (
            <FilterBox
              key={group.field}
              title={group.label}
              activeCount={currentValues.length}
              defaultOpen={PRIMARY_FILTERS.includes(group.field)}
              isMobile={isMobile}
              onReset={() => setFilters({ [group.field]: [] })}
            >
              <div className="sr-filterGroup__content_aXh9x space-y-3">
                {/* Search input for large lists */}
                {options.length > 5 && (
                  <div className="sr-iFormElement_Fwa2t sr-regularFilters__searchInput_KVuIA relative">
                    <input
                      type="text"
                      placeholder={`${group.label} suchen...`}
                      value={query}
                      onChange={(e) =>
                        setGroupSearch((prev) => ({
                          ...prev,
                          [group.field]: e.target.value,
                        }))
                      }
                      className="sr-iInput_KnTXI h-10 w-full rounded-[4px] border border-[#B4B4B4] bg-white pr-10 pl-3 text-[14px] focus:border-[#0771D0] focus:outline-none"
                    />
                    <div className="pointer-events-none absolute top-0 right-0 flex h-10 w-10 items-center justify-center">
                      <SearchIcon className="h-5 w-5" />
                    </div>
                  </div>
                )}

                <div className="sr-filterList_qktgT space-y-1">
                  {filteredOptions
                    .slice(0, isExpanded ? undefined : 6)
                    .map((option) => {
                      const count = filterCounts?.[group.field]?.[option] || 0;
                      const isSelected = currentValues.includes(option);
                      const isNoResults = count === 0 && !isSelected;

                      return (
                        <label
                          key={option}
                          className={cn(
                            "group/item flex items-center justify-between py-1",
                            isNoResults
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`${group.field}-${option}`}
                              checked={isSelected}
                              disabled={isNoResults}
                              onCheckedChange={() =>
                                toggleCheckbox(group.field, option)
                              }
                              className="h-[18px] w-[18px] rounded-[3px] border-[#B4B4B4] bg-white data-[state=checked]:border-[#0771D0] data-[state=checked]:bg-[#0771D0]"
                            />
                            <span
                              className={cn(
                                "text-[13px]",
                                isSelected
                                  ? "font-bold text-[#0771D0]"
                                  : "text-[#2d2d2d]",
                                !isNoResults &&
                                  "group-hover/item:text-[#0771D0]",
                              )}
                            >
                              {formatOptionLabel(
                                option,
                                group.field,
                                unitLabel,
                              )}
                            </span>
                          </div>
                          <span className="text-[13px] text-[#767676]">
                            {count}
                          </span>
                        </label>
                      );
                    })}
                </div>

                {!isExpanded && filteredOptions.length > 6 && (
                  <button
                    onClick={() =>
                      setGroupShowAll((prev) => ({
                        ...prev,
                        [group.field]: true,
                      }))
                    }
                    className="sr-regularFilters__expander_K6XPQ mt-2 block text-left text-[13px] font-bold text-[#0771D0] hover:underline"
                  >
                    + alle anzeigen
                  </button>
                )}
              </div>
            </FilterBox>
          );
        })}
      </div>
    </div>
  );
}
