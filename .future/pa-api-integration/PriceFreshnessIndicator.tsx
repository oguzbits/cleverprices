import { getPricesAge, PRICES_UPDATED_AT } from "@/lib/build-config";
import { Clock } from "lucide-react";

/**
 * Displays when prices were last updated globally
 * Uses PRICES_UPDATED_AT from build-config.ts
 */
export function PriceFreshnessIndicator({
  showIcon = true,
  className = "",
}: {
  showIcon?: boolean;
  className?: string;
}) {
  const ageText = getPricesAge();
  const updateDate = new Date(PRICES_UPDATED_AT);
  const hoursSinceUpdate =
    (Date.now() - updateDate.getTime()) / (1000 * 60 * 60);

  // Determine freshness level
  let freshnessStyle = "text-muted-foreground";
  let label = `Prices updated ${ageText}`;

  if (hoursSinceUpdate < 1) {
    freshnessStyle = "text-emerald-600 dark:text-emerald-400";
    label = "Prices are live";
  } else if (hoursSinceUpdate > 24 * 7) {
    freshnessStyle = "text-amber-600 dark:text-amber-400";
    label = `Prices from ${ageText}`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${freshnessStyle} ${className}`}
    >
      {showIcon && <Clock className="h-3 w-3" />}
      <span>{label}</span>
    </span>
  );
}
