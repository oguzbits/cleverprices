"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description: string;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
  canScrollLeft?: boolean;
  canScrollRight?: boolean;
}

export function SectionHeader({
  title,
  description,
  onScrollLeft,
  onScrollRight,
  canScrollLeft = false,
  canScrollRight = false,
}: SectionHeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {/* Title is plain text, NOT a link (matching Idealo) */}
          <h2 className="text-lg font-bold text-zinc-900 md:text-xl">
            {title}
          </h2>
        </div>

        {/* Carousel navigation - Idealo style: simple chevron buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onScrollLeft}
            disabled={!canScrollLeft}
            className={cn(
              "h-8 w-8 rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50",
              !canScrollLeft && "cursor-not-allowed opacity-30",
            )}
            aria-label="Vorherige"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onScrollRight}
            disabled={!canScrollRight}
            className={cn(
              "h-8 w-8 rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50",
              !canScrollRight && "cursor-not-allowed opacity-30",
            )}
            aria-label="Nächste"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
