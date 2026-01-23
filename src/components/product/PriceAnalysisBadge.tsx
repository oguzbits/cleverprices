import { cn } from "@/lib/utils";
import { TrendingDown } from "lucide-react";

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

  if (savings >= 0.05) {
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

  return null;
}
