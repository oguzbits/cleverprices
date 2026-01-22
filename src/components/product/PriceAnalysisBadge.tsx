import { cn } from "@/lib/utils";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface PriceAnalysisBadgeProps {
  savings: number; // 0.15 = 15% savings
  className?: string;
}

export function PriceAnalysisBadge({
  savings,
  className,
}: PriceAnalysisBadgeProps) {
  if (savings >= 0.15) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800",
          className,
        )}
      >
        <TrendingDown className="h-3.5 w-3.5" />
        Top-Deal: {(savings * 100).toFixed(0)}% Ersparnis
      </div>
    );
  }

  if (savings > 0) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800",
          className,
        )}
      >
        <TrendingDown className="h-3.5 w-3.5" />
        Guter Preis ({(savings * 100).toFixed(0)}% unter Durchschnitt)
      </div>
    );
  }

  if (savings === 0) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800",
          className,
        )}
      >
        <Minus className="h-3.5 w-3.5" />
        Fairer Preis
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800",
        className,
      )}
    >
      <TrendingUp className="h-3.5 w-3.5" />
      Preis über Durchschnitt
    </div>
  );
}
