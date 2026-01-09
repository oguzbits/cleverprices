"use client";

import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

export function IdealoPriceChart() {
  return (
    <div className="w-full max-w-[290px]">
      {/* Container matching .embedded-chart-container */}
      <div className="embedded-chart-container relative mb-4 h-[195px] w-full">
        {/* Header matching .styled-price-chart-embedded-header */}
        <div className="styled-price-chart-embedded-header mb-2 flex items-center justify-between pr-1">
          <h3 className="text-sm font-bold text-[#2d2d2d]">Preisentwicklung</h3>
          <div className="flex gap-1">
            {["1M", "3M", "6M", "1J"].map((label) => (
              <button
                key={label}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                  label === "3M"
                    ? "bg-[#e1eff9] text-[#0771d0]"
                    : "text-[#767676] hover:bg-gray-100",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative h-[150px] w-full bg-white">
          <svg
            className="h-full w-full"
            viewBox="0 0 290 150"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="priceGradientIdealo"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ff6600" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Line */}
            <path
              d="M0,100 Q50,95 80,85 T140,60 T200,70 T290,40"
              fill="none"
              stroke="#ff6600"
              strokeWidth="2"
            />
            {/* Fill */}
            <path
              d="M0,100 Q50,95 80,85 T140,60 T200,70 T290,40 L290,150 L0,150 Z"
              fill="url(#priceGradientIdealo)"
            />
          </svg>

          {/* Grid lines (mock) */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2 opacity-5">
            <div className="h-px w-full bg-black"></div>
            <div className="h-px w-full bg-black"></div>
            <div className="h-px w-full bg-black"></div>
            <div className="h-px w-full bg-black"></div>
          </div>
        </div>

        {/* Date Axis */}
        <div className="mt-1 flex justify-between px-1 text-[10px] text-[#767676]">
          <span>Okt</span>
          <span>Nov</span>
          <span>Dez</span>
          <span>Jan</span>
        </div>
      </div>

      {/* Price Alert Button matching .styled-price-alert-button */}
      <div className="border-t border-[#e5e5e5] pt-4">
        <button className="styled-price-alert-button flex w-full items-center justify-center gap-2 rounded border border-[#0771d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0771d0] transition-colors hover:bg-[#f5f9ff]">
          <Bell className="h-4 w-4" />
          Preiswecker stellen
        </button>
      </div>
    </div>
  );
}
