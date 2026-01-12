"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IdealoFilterPanel } from "./IdealoFilterPanel";
import { Product } from "@/lib/product-registry";
import { useFilters } from "@/lib/hooks/use-filters";

interface MobileFilterDrawerProps {
  categorySlug: string;
  unitLabel: string;
  categoryName: string;
  productCount: number;
  products?: Product[];
}

export function MobileFilterDrawer({
  categorySlug,
  unitLabel,
  categoryName,
  productCount,
  products = [],
}: MobileFilterDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const [filters, setFilters] = useFilters();

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.condition.length > 0) count++;
    if (filters.brand.length > 0) count++;
    if (filters.technology.length > 0) count++;
    if (filters.formFactor.length > 0) count++;
    if (filters.socket.length > 0) count++;
    if (filters.cores.length > 0) count++;
    if (filters.minPrice !== null || filters.maxPrice !== null) count++;
    return count;
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      condition: [],
      brand: [],
      technology: [],
      formFactor: [],
      socket: [],
      cores: [],
      minCapacity: null,
      maxCapacity: null,
      minPrice: null,
      maxPrice: null,
    });
  };

  return (
    <div className="mb-4 flex items-center gap-2 min-[840px]:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="flex h-10 items-center gap-2 rounded border border-[#b4b4b4] bg-white px-4 text-[14px] font-bold text-[#2d2d2d] active:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0771D0] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[90vh] w-full overflow-hidden rounded-t-xl p-0 sm:max-w-full"
          hideClose={true}
        >
          <SheetHeader className="relative flex h-[56px] flex-row items-center justify-between border-b border-[#e0e0e0] bg-white px-4">
            <div className="flex items-center gap-3">
              <SheetTitle className="flex items-center gap-2 text-[18px] font-bold text-[#2d2d2d]">
                Filter
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0771D0] text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </SheetTitle>
            </div>

            <div className="flex items-center gap-4">
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[14px] font-medium text-[#0771D0] hover:underline"
                >
                  Alle zurücksetzen
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-[#2d2d2d]" />
              </button>
            </div>
          </SheetHeader>

          <div className="h-[calc(90vh-120px)] overflow-y-auto bg-[#f4f7f9]">
            <div className="border-b border-[#e0e0e0] bg-white px-4 py-3">
              <h2 className="text-[14px] font-bold tracking-wider text-[#767676] uppercase">
                {categoryName}
              </h2>
            </div>
            <IdealoFilterPanel
              categorySlug={categorySlug}
              unitLabel={unitLabel}
              isMobile={true}
              products={products}
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="absolute right-0 bottom-0 left-0 flex border-t bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-[4px] bg-[#0771D0] py-3 text-[16px] font-bold text-white transition-colors hover:bg-[#0050a0]"
            >
              {productCount} Ergebnisse anzeigen
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
