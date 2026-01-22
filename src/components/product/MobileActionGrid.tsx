"use client";

import { List, TrendingUp } from "lucide-react";

export function MobileActionGrid() {
  const triggerPriceChart = () => {
    // Trigger price chart modal by finding the trigger element
    // This assumes the chart widget is rendered on the same page
    const dialogBtn = document.querySelector(
      '[title="Preisentwicklung anzeigen"]',
    ) as HTMLElement;
    if (dialogBtn) {
      dialogBtn.click();
    }
  };

  return (
    <div className="mt-6 grid grid-cols-2 border-t border-[#dcdcdc] py-4 lg:hidden">
      <a
        href="#datasheet"
        className="flex cursor-pointer flex-col items-center gap-1.5 text-center no-underline hover:no-underline"
      >
        <List className="h-5 w-5 text-[#2d2d2d]" />
        <span className="text-[11px] font-bold text-[#2d2d2d]">
          Produktdetails
        </span>
      </a>
      <button
        onClick={triggerPriceChart}
        className="flex cursor-pointer flex-col items-center gap-1.5 border-l border-[#dcdcdc] text-center"
      >
        <TrendingUp className="h-5 w-5 text-[#2d2d2d]" />
        <span className="text-[11px] font-bold text-[#2d2d2d]">
          Preisverlauf
        </span>
      </button>
    </div>
  );
}
