"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import React, { useRef, useState } from "react";

interface IdealoPriceChartProps {
  history?: { date: string; price: number }[];
  title?: string;
}

type TimeFrame = "1M" | "3M" | "6M" | "1J";

const ALL_TIMEFRAMES: { k: TimeFrame; l: string }[] = [
  { k: "1M", l: "1 Monat" },
  { k: "3M", l: "3 Monate" },
  { k: "6M", l: "6 Monate" },
  { k: "1J", l: "1 Jahr" },
];

export function IdealoPriceChart({
  history = [],
  title,
  currentPrice,
}: IdealoPriceChartProps & { currentPrice?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeFrame>("3M");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          className="w-full max-w-[290px] cursor-pointer"
          title="Preisentwicklung anzeigen"
        >
          <ChartRenderer
            history={history}
            interactive={true}
            height={150}
            isModal={false}
            livePrice={currentPrice}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </div>
      </DialogTrigger>
      <DialogContent
        className="flex h-full w-full max-w-none flex-col gap-0 overflow-y-auto bg-white p-0 sm:h-auto sm:w-[95vw] sm:max-w-[580px] sm:rounded-xl sm:shadow-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-start justify-between p-6 pb-12">
          <div className="pr-8">
            <DialogTitle className="text-idealo-text-primary text-[22px] leading-tight font-bold">
              Preisentwicklung
            </DialogTitle>
            <DialogDescription className="mt-1 line-clamp-2 text-[15px] font-medium text-gray-600 sm:line-clamp-none">
              {title}
            </DialogDescription>
          </div>
        </div>

        <div className="flex-1 px-6 pb-8">
          <ChartRenderer
            history={history}
            interactive={true}
            height={320}
            isModal={true}
            livePrice={currentPrice}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChartRenderer({
  history,
  interactive,
  height,
  isModal = false,
  livePrice,
  timeframe,
  onTimeframeChange,
}: {
  history: { date: string; price: number }[];
  interactive: boolean;
  height: number;
  isModal: boolean;
  livePrice?: number;
  timeframe: TimeFrame;
  onTimeframeChange: (tf: TimeFrame) => void;
}) {
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>(timeframe);
  const [hoveredData, setHoveredData] = useState<{
    date: number;
    price: number;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const { data, minPrice, maxPrice, minDate, maxDate, stats, yTicks, yDomain } =
    (() => {
      // 1. Sort & Map
      const rawSorted = [...history]
        .map((h) => ({
          date: new Date(h.date).getTime(),
          price: h.price,
        }))
        .sort((a, b) => a.date - b.date);

      // Inject livePrice if available
      if (livePrice !== undefined && livePrice !== null) {
        rawSorted.push({
          date: Date.now(),
          price: livePrice,
        });
      }

      // 2. Cutoff
      const now = new Date();
      now.setHours(23, 59, 59, 999);

      let daysBack = 90;
      if (activeTimeframe === "1M") daysBack = 30;
      if (activeTimeframe === "6M") daysBack = 180;
      if (activeTimeframe === "1J") daysBack = 365;

      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysBack);
      startDate.setHours(0, 0, 0, 0);

      const startTime = startDate.getTime();

      // 3. Fill Gaps
      const priceMap = new Map<string, number>();
      rawSorted.forEach((d) => {
        const dateObj = new Date(d.date);
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
        priceMap.set(dateStr, d.price);
      });

      const filledData: { date: number; price: number }[] = [];

      let currentPrice = 0;
      const preStartData = rawSorted.filter((d) => d.date < startTime);
      if (preStartData.length > 0) {
        currentPrice = preStartData[preStartData.length - 1].price;
      } else if (rawSorted.length > 0) {
        currentPrice = rawSorted[0].price;
      }

      const loopDate = new Date(startDate);
      const endDate = new Date(now);

      while (loopDate <= endDate) {
        const dateStr = `${loopDate.getFullYear()}-${String(loopDate.getMonth() + 1).padStart(2, "0")}-${String(loopDate.getDate()).padStart(2, "0")}`;
        if (priceMap.has(dateStr)) {
          currentPrice = priceMap.get(dateStr)!;
        }
        filledData.push({
          date: loopDate.getTime(),
          price: currentPrice,
        });

        loopDate.setDate(loopDate.getDate() + 1);
      }

      const prices = filledData.map((d) => d.price);
      const valid = filledData.length > 0;

      const latestPrice = prices[prices.length - 1] || 0;
      const lowest = valid ? Math.min(...prices) : 0;
      const highest = valid ? Math.max(...prices) : 0;
      const avg = valid ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

      const lowestPoint = filledData.find((d) => d.price === lowest);
      const highestPoint = filledData.find((d) => d.price === highest);

      // Calculate Y Axis Intervals (Idealo Style)
      // They typically use clean, even numbers.
      // 1. Determine Nice Range
      const range = highest - lowest;
      // Add padding (approx 10% bottom, 10% top)
      const paddedMin = lowest - range * 0.1;
      const paddedMax = highest + range * 0.1;

      // Find nice scale
      const roughStep = (paddedMax - paddedMin) / 5; // Aim for ~5 ticks
      // Round roughStep to nice number (0.5, 1, 2, 5, 10, etc.)
      const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
      const normalizedStep = roughStep / magnitude; // 1.23
      let stepSize;
      if (normalizedStep < 1.5) stepSize = 1 * magnitude;
      else if (normalizedStep < 3) stepSize = 2 * magnitude;
      else if (normalizedStep < 7.5) stepSize = 5 * magnitude;
      else stepSize = 10 * magnitude;

      // Ensure min step of 0.01
      stepSize = Math.max(stepSize, 0.01);

      const yMin = Math.floor(paddedMin / stepSize) * stepSize;
      const yMax = Math.ceil(paddedMax / stepSize) * stepSize;

      const ticks = [];
      for (let v = yMin; v <= yMax + stepSize / 1000; v += stepSize) {
        ticks.push(v);
      }

      return {
        data: filledData,
        minPrice: lowest,
        maxPrice: highest,
        yDomain: { min: yMin, max: yMax },
        yTicks: ticks,
        minDate: filledData[0]?.date || startTime,
        maxDate: filledData[filledData.length - 1]?.date || now.getTime(),
        stats: {
          lowest,
          highest,
          avg,
          latestPrice,
          lowestDate: lowestPoint?.date,
          highestDate: highestPoint?.date,
          days: filledData.length,
        },
      };
    })();

  // Helpers
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(price);

  const formatPriceNumber = (price: number) =>
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  const formatDateFull = (ts: number) =>
    new Intl.DateTimeFormat("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(ts));

  const formatShortDate = (ts: number) =>
    new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(ts));

  const getDaysAgo = (ts?: number) => {
    if (!ts) return "";
    const diff = Date.now() - ts;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Heute";
    if (days === 1) return "vor 1 Tag";
    return `vor ${days} Tagen`;
  };

  if (data.length < 2) {
    return (
      <div className={cn("w-full bg-white", !isModal && "max-w-[290px]")}>
        <div
          className={cn(
            "relative mb-4 flex w-full items-center justify-center border border-[#e5e5e5] bg-white text-xs text-[#999]",
            isModal ? "h-[320px]" : "h-[195px]",
          )}
        >
          Keine Preisdaten verfügbar
        </div>
      </div>
    );
  }

  // Dimensions
  // Tight yAxisWidth
  const yAxisWidth = isModal ? 46 : 0; // Reduced to be right beside chart
  const vboxWidth = isModal ? 580 - yAxisWidth : 290;
  const vboxHeight = height;
  const vPaddingTop = 30;
  const vPaddingBottom = 10;
  const chartHeight = vboxHeight - vPaddingTop - vPaddingBottom;

  const getX = (date: number) => {
    if (maxDate === minDate) return 0;
    return ((date - minDate) / (maxDate - minDate)) * vboxWidth;
  };

  const getY = (price: number) => {
    // Use yDomain for scaling, not min/max price
    const range = yDomain.max - yDomain.min || 1;
    return vPaddingTop + (1 - (price - yDomain.min) / range) * chartHeight;
  };

  // Step Chart Path
  let dPath = `M${getX(data[0].date)},${getY(data[0].price)}`;
  for (let i = 0; i < data.length - 1; i++) {
    const p2 = data[i + 1];
    const x2 = getX(p2.date);
    const y2 = getY(p2.price);
    dPath += ` H${x2} V${y2}`;
  }
  // Fill entire area below
  const fillPath = `${dPath} L${vboxWidth},${vboxHeight} L0,${vboxHeight} Z`;

  const currentPriceY = getY(stats.latestPrice);

  const updateHover = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const xRatio = Math.max(0, Math.min(1, x / rect.width));
    const targetDate = minDate + xRatio * (maxDate - minDate);

    let closest = data[0];
    let minDiff = Math.abs(targetDate - closest.date);
    for (const d of data) {
      const diff = Math.abs(targetDate - d.date);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }
    setHoveredData({
      date: closest.date,
      price: closest.price,
      x: getX(closest.date),
      y: getY(closest.price),
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateHover(e.clientX);
  };

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    // Prevent default to stop page scrolling while scrubbing
    if (e.touches.length > 0) {
      updateHover(e.touches[0].clientX);
    }
  };

  const visibleTimeframes = isModal
    ? ALL_TIMEFRAMES
    : ALL_TIMEFRAMES.filter((t) => t.k !== "1M");

  return (
    <div className={cn("w-full select-none", !isModal && "max-w-[290px]")}>
      {/* Controls */}
      <div
        className={cn(
          "mb-2 flex items-center justify-between",
          isModal && "mb-3 justify-end border-b border-gray-100 pb-2", // Border bottom for modal buttons
        )}
      >
        {!isModal && (
          <h3 className="text-idealo-text-primary text-[14px] font-bold">
            Preisentwicklung
          </h3>
        )}

        <div className="flex gap-1.5">
          {visibleTimeframes.map((tf) => {
            const isActive = activeTimeframe === tf.k;
            return (
              <button
                key={tf.k}
                onClick={(e) => {
                  if (isModal) {
                    e.stopPropagation();
                  } else {
                    onTimeframeChange(tf.k as TimeFrame);
                  }
                  setActiveTimeframe(tf.k as TimeFrame);
                }}
                className={cn(
                  "cursor-pointer rounded border text-[11px] font-bold transition-colors",
                  isActive
                    ? "border-[#0a6AB1] bg-[#0a6AB1] text-white"
                    : "border-[#0a6AB1] bg-white text-black hover:bg-blue-50",
                  isModal
                    ? "h-[30px] min-w-[30px] px-2 text-xs whitespace-nowrap" // Allow width to grow for text, no wrap
                    : "h-[30px] w-[30px] p-0 px-1 text-center",
                )}
              >
                {/* Use Long label (1 Monat) in modal, Short (1M) in widget */}
                {isModal ? tf.l : tf.k}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex w-full gap-0">
        {" "}
        {/* Removed Gap to stick Y-axis to chart */}
        <div
          ref={containerRef}
          className={cn(
            "relative cursor-pointer touch-none bg-white select-none",
            isModal ? "h-[320px] flex-1" : "h-[150px] w-full",
          )}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredData(null)}
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onTouchEnd={() => setHoveredData(null)}
        >
          {hoveredData && (
            <>
              {/* Tooltip */}
              <div
                className="pointer-events-none absolute z-20 flex -translate-x-1/2 flex-col items-start"
                style={{
                  left: isModal
                    ? `${(hoveredData.x / vboxWidth) * 100}%`
                    : `${hoveredData.x}px`,
                  top: isModal ? "0px" : "0px",
                }}
              >
                <div className="rounded-[2px] bg-[#ff6600] px-2 py-1 text-white shadow-md">
                  <div className="mb-0.5 text-left text-[15px] leading-none font-bold whitespace-nowrap">
                    {formatPrice(hoveredData.price)}
                  </div>
                  <div className="text-left text-[12px] leading-none font-bold whitespace-nowrap text-white/90">
                    {formatDateFull(hoveredData.date)}
                  </div>
                </div>
                <div className="h-0 w-0 self-center border-t-4 border-r-4 border-l-4 border-t-[#ff6600] border-r-transparent border-l-transparent"></div>
              </div>

              {/* Round Hover Point (HTML) - Fixes aspect ratio distortion */}
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-white bg-[#ff6600] shadow-md"
                style={{
                  left: isModal
                    ? `${(hoveredData.x / vboxWidth) * 100}%`
                    : `${hoveredData.x}px`,
                  top: isModal
                    ? `${(hoveredData.y / vboxHeight) * 100}%`
                    : // For widget, calculate percentage top similarly if we want consistency,
                      // or just leverage the fact that SVG and Div share height.
                      // Relative positioning works best with %.
                      `${(hoveredData.y / vboxHeight) * 100}%`,
                  width: "16px",
                  height: "16px",
                }}
              />
            </>
          )}

          <svg
            className="h-full w-full overflow-visible"
            viewBox={`0 0 ${vboxWidth} ${vboxHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                {/* Lighter opacity gradient */}
                <stop offset="0%" stopColor="#ff6600" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#ff6600" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {isModal && (
              <g className="text-gray-200">
                {yTicks.slice(1, -1).map((tick) => {
                  const y = getY(tick);
                  // Don't draw if out of bounds
                  if (y < 0 || y > vboxHeight) return null;
                  return (
                    <line
                      key={tick}
                      x1="0"
                      y1={y}
                      x2={vboxWidth}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  );
                })}
              </g>
            )}

            <path d={fillPath} fill="url(#chartGradient)" />
            <path
              d={dPath}
              fill="none"
              stroke="#ff6600"
              strokeWidth={isModal ? "1.5" : "1.5"}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {hoveredData && (
              <line
                x1={hoveredData.x}
                y1={0}
                x2={hoveredData.x}
                y2={vboxHeight}
                stroke="#000"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />
            )}
            {/* Circle removed from SVG to prevent oval distortion */}
          </svg>

          {isModal && (
            <div className="absolute right-0 -bottom-6 left-0 flex justify-between px-1 text-xs font-medium text-gray-500">
              <span>{formatShortDate(minDate)}</span>
              <span className="translate-x-4">
                {formatShortDate((minDate + maxDate) / 2)}
              </span>
              <span>{formatShortDate(maxDate)}</span>
            </div>
          )}
        </div>
        {isModal && (
          <div className="relative flex h-[320px] w-[50px] flex-col overflow-visible border-l border-gray-100/50 bg-white text-[10px] text-gray-500">
            {/* Draw Labels Absolute based on getY coords */}
            {yTicks.map((tick) => {
              const top = getY(tick);
              return (
                <div
                  key={tick}
                  className="absolute right-0 w-full pr-1 text-right leading-none select-none"
                  style={{ top: top - 5 }} // Center text vertically
                >
                  {formatPriceNumber(tick)}
                </div>
              );
            })}

            <div
              className="pointer-events-none absolute right-0 z-10 rounded-[2px] bg-[#ff6600] px-1 py-0.5 text-[10px] font-bold text-white shadow-sm"
              style={{ top: currentPriceY - 8 }} // Center badge
            >
              {formatPriceNumber(stats.latestPrice)}
            </div>
          </div>
        )}
      </div>

      {isModal && (
        <div className="mt-10 grid grid-cols-1 gap-4 border-t pt-6">
          <div className="group flex cursor-default items-center justify-between rounded border-b border-gray-50 px-2 py-2 transition-colors hover:bg-gray-50/50">
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-gray-800">
                Tiefster Preis
              </span>
              <span className="text-[12px] text-gray-500">
                {getDaysAgo(stats.lowestDate)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[18px] font-bold text-gray-900 tabular-nums">
                {formatPrice(stats.lowest)}
              </span>
              <DifferenceBadge
                current={stats.latestPrice}
                other={stats.lowest}
              />
            </div>
          </div>

          <div className="group flex cursor-default items-center justify-between rounded border-b border-gray-50 px-2 py-2 transition-colors hover:bg-gray-50/50">
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-gray-800">
                Durchschnitt
              </span>
              <span className="text-[12px] text-gray-500">
                über {stats.days} Tage
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[18px] font-bold text-gray-900 tabular-nums">
                {formatPrice(stats.avg)}
              </span>
              <DifferenceBadge current={stats.latestPrice} other={stats.avg} />
            </div>
          </div>

          <div className="group flex cursor-default items-center justify-between rounded border-b border-gray-50 px-2 py-2 transition-colors hover:bg-gray-50/50">
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-gray-800">
                Höchster Preis
              </span>
              <span className="text-[12px] text-gray-500">
                {getDaysAgo(stats.highestDate)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[18px] font-bold text-gray-900 tabular-nums">
                {formatPrice(stats.highest)}
              </span>
              <DifferenceBadge
                current={stats.latestPrice}
                other={stats.highest}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DifferenceBadge({
  current,
  other,
}: {
  current: number;
  other: number;
}) {
  const diff = current - other;
  const absDiff = Math.abs(diff);

  if (absDiff < 0.01) return <div className="w-24 shrink-0"></div>;

  const isHigher = diff > 0;

  // Logic:
  // If current > other: Red Arrow Up (More expensive than reference point)
  // If current < other: Green Arrow Down (Cheaper than reference point)

  const colorClass = isHigher ? "text-[#D50000]" : "text-[#008a00]";
  const Icon = isHigher ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "flex w-24 items-center justify-end text-[13px] font-bold tabular-nums",
        colorClass,
      )}
    >
      <Icon className="mr-1 h-4 w-4" />
      {new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(absDiff)}
    </span>
  );
}
