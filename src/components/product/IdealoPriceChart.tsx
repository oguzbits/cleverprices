"use client";

import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

interface IdealoPriceChartProps {
  history?: { date: string; price: number }[];
}

export function IdealoPriceChart({ history = [] }: IdealoPriceChartProps) {
  // 1. Process Data
  const data = history
    .map((h) => ({
      date: new Date(h.date).getTime(),
      price: h.price,
    }))
    .sort((a, b) => a.date - b.date);

  // 2. Fallback for no data
  if (data.length < 2) {
    return (
      <div className="w-full max-w-[290px]">
        <div className="embedded-chart-container relative mb-4 flex h-[195px] w-full items-center justify-center border border-[#e5e5e5] bg-white text-xs text-[#999]">
          Keine Preisdaten verfügbar
        </div>
      </div>
    );
  }

  // 3. Calculate Scales
  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const minDate = data[0].date;
  const maxDate = data[data.length - 1].date;

  const width = 290;
  const height = 150;
  const padding = 5; // Internal padding to avoid cutting off stroke

  const getX = (date: number) => {
    return ((date - minDate) / (maxDate - minDate)) * width;
  };

  const getY = (price: number) => {
    // Invert Y axis (0 is top), add padding
    const range = maxPrice - minPrice || 1; // Avoid division by zero
    // Using 90% of height to keep line within bounds
    return height - ((price - minPrice) / range) * (height - 20) - 10;
  };

  // 4. Generate SVG Path
  const points = data.map((d) => `${getX(d.date)},${getY(d.price)}`).join(" ");
  // Smooth line using a simple polyline for now (or improve with curves if needed)
  // For simplicity and robustness, using Polyline is fine for price charts.
  // Ideally, use a helper for bezier curves if "faithful" look requires it.
  const linePath = `M${points}`;

  // Fill path: Close the loop (down to bottom right, over to bottom left)
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;

  // 5. Generate Axis Labels (Simple)
  const months = [
    "Jan",
    "Feb",
    "Mär",
    "Apr",
    "Mai",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dez",
  ];

  // Get 4 evenly spaced labels
  const dateLabels = [];
  const step = (maxDate - minDate) / 3;
  for (let i = 0; i <= 3; i++) {
    const d = new Date(minDate + step * i);
    dateLabels.push(months[d.getMonth()]);
  }

  return (
    <div className="w-full max-w-[290px]">
      {/* Container matching .embedded-chart-container */}
      <div className="embedded-chart-container relative mb-4 h-[195px] w-full">
        {/* Header matching .styled-price-chart-embedded-header */}
        <div className="styled-price-chart-embedded-header mb-2 flex items-center justify-between pr-1">
          <h3 className="text-idealo-text-primary text-sm font-bold">
            Preisentwicklung
          </h3>
          <div className="flex gap-1">
            {["1M", "3M", "6M", "1J"].map((label) => (
              <button
                key={label}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                  label === "3M"
                    ? "text-idealo-blue bg-blue-100"
                    : "text-idealo-text-secondary hover:bg-gray-100",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Area */}
        <div className="text-primary relative h-[150px] w-full bg-white">
          <svg
            className="h-full w-full"
            viewBox={`0 0 ${width} ${height}`}
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
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Fill */}
            <path d={fillPath} fill="url(#priceGradientIdealo)" />
            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>

          {/* Grid lines (simple overlay) */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2 opacity-5">
            <div className="h-px w-full bg-black"></div>
            <div className="h-px w-full bg-black"></div>
            <div className="h-px w-full bg-black"></div>
            <div className="h-px w-full bg-black"></div>
          </div>
        </div>

        {/* Date Axis */}
        <div className="text-idealo-text-secondary mt-1 flex justify-between px-1 text-[10px]">
          {dateLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      </div>

      {/* Price Alert Button matching .styled-price-alert-button */}
      <div className="border-t border-gray-200 pt-4">
        <button className="styled-price-alert-button border-idealo-blue text-idealo-blue flex w-full items-center justify-center gap-2 rounded border bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-blue-50">
          <Bell className="h-4 w-4" />
          Preiswecker stellen
        </button>
      </div>
    </div>
  );
}
