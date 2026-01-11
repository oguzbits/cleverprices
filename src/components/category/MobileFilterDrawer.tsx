"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IdealoFilterPanel } from "./IdealoFilterPanel";

interface MobileFilterDrawerProps {
  categorySlug: string;
  unitLabel: string;
  categoryName: string;
}

export function MobileFilterDrawer({
  categorySlug,
  unitLabel,
  categoryName,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mb-4 flex items-center gap-2 min-[840px]:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="flex h-10 items-center gap-2 rounded border border-[#b4b4b4] bg-white px-4 text-[14px] font-bold text-[#2d2d2d]">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0 sm:w-[350px]">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-left text-[16px] font-bold">
              Filter: {categoryName}
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-60px)] overflow-y-auto">
            <IdealoFilterPanel
              categorySlug={categorySlug}
              unitLabel={unitLabel}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
