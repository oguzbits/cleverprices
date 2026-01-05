/**
 * Price Analysis Badge
 *
 * Displays a recommendation based on Keepa price analysis.
 * Shows whether the current price is a "Great Deal", "Good Price", etc.
 */

import type { PriceAnalysis } from "@/lib/data-sources";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus, Sparkles } from "lucide-react";

interface PriceAnalysisBadgeProps {
  analysis: PriceAnalysis;
  className?: string;
}

export function PriceAnalysisBadge({
  analysis,
  className,
}: PriceAnalysisBadgeProps) {
  const { recommendation, recommendationText, percentFromAverage } = analysis;

  const config = {
    great_deal: {
      icon: Sparkles,
      bgClass: "bg-emerald-100 dark:bg-emerald-500/20",
      textClass: "text-emerald-800 dark:text-emerald-300",
      borderClass: "border-emerald-200 dark:border-emerald-500/30",
    },
    good_price: {
      icon: TrendingDown,
      bgClass: "bg-blue-100 dark:bg-blue-500/20",
      textClass: "text-blue-800 dark:text-blue-300",
      borderClass: "border-blue-200 dark:border-blue-500/30",
    },
    fair: {
      icon: Minus,
      bgClass: "bg-gray-100 dark:bg-gray-500/20",
      textClass: "text-gray-800 dark:text-gray-300",
      borderClass: "border-gray-200 dark:border-gray-500/30",
    },
    wait: {
      icon: TrendingUp,
      bgClass: "bg-amber-100 dark:bg-amber-500/20",
      textClass: "text-amber-800 dark:text-amber-300",
      borderClass: "border-amber-200 dark:border-amber-500/30",
    },
    unknown: {
      icon: Minus,
      bgClass: "bg-gray-100 dark:bg-gray-500/20",
      textClass: "text-gray-800 dark:text-gray-300",
      borderClass: "border-gray-200 dark:border-gray-500/30",
    },
  };

  const {
    icon: Icon,
    bgClass,
    textClass,
    borderClass,
  } = config[recommendation];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4",
        bgClass,
        borderClass,
        className,
      )}
    >
      <div className={cn("rounded-full p-2", bgClass)}>
        <Icon className={cn("h-5 w-5", textClass)} />
      </div>
      <div>
        <p className={cn("font-semibold", textClass)}>
          {recommendation === "great_deal" && "🎉 Great Deal!"}
          {recommendation === "good_price" && "👍 Good Price"}
          {recommendation === "fair" && "Fair Price"}
          {recommendation === "wait" && "⏳ Consider Waiting"}
          {recommendation === "unknown" && "Price Analysis Unavailable"}
        </p>
        <p className={cn("text-sm", textClass)}>{recommendationText}</p>
      </div>
    </div>
  );
}
