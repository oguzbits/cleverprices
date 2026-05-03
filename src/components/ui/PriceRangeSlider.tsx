"use client";

import * as Slider from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

/**
 * Dual-handle price range slider matching idealo's design.
 * Uses Radix UI Slider with custom styling.
 */
export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  className,
}: PriceRangeSliderProps) {
  // Ensure min/max are valid
  const safeMin = min || 0;
  const safeMax = max || 1000;
  const step = safeMax > 500 ? 10 : safeMax > 100 ? 5 : 1;

  return (
    <Slider.Root
      className={cn(
        "relative flex h-5 w-full touch-none items-center select-none",
        className,
      )}
      min={safeMin}
      max={safeMax}
      step={step}
      value={value}
      onValueChange={(newValue) => onChange(newValue as [number, number])}
    >
      <Slider.Track className="relative h-[4px] grow rounded-full bg-[#E0E0E0]">
        <Slider.Range className="absolute h-full rounded-full bg-[#0771D0]" />
      </Slider.Track>
      <Slider.Thumb
        className="block h-4 w-4 cursor-grab rounded-full border-2 border-[#0771D0] bg-white shadow-sm transition-colors hover:bg-[#f0f7ff] focus:ring-2 focus:ring-[#0771D0]/30 focus:outline-none active:cursor-grabbing"
        aria-label="Minimum price"
      />
      <Slider.Thumb
        className="block h-4 w-4 cursor-grab rounded-full border-2 border-[#0771D0] bg-white shadow-sm transition-colors hover:bg-[#f0f7ff] focus:ring-2 focus:ring-[#0771D0]/30 focus:outline-none active:cursor-grabbing"
        aria-label="Maximum price"
      />
    </Slider.Root>
  );
}
