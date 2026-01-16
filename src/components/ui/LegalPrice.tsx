import React from "react";
import { formatCurrency } from "@/lib/utils/formatting";
import { cn } from "@/lib/utils";

interface LegalPriceProps {
  price: number;
  displayPrice?: string;
  countryCode?: string;
  className?: string;
  priceClassName?: string;
  asteriskClassName?: string;
  showAb?: boolean;
}

/**
 * Centrally managed price display with legal asterisk.
 * Ensures the asterisk is always present and styled consistently
 * while remaining "clearly legible" (deutlich lesbar).
 */
export function LegalPrice({
  price,
  displayPrice,
  countryCode = "de",
  className,
  priceClassName,
  asteriskClassName,
  showAb = false,
}: LegalPriceProps) {
  const formattedPrice = displayPrice || formatCurrency(price, countryCode);

  return (
    <span className={cn("inline-flex items-baseline", className)}>
      {showAb && (
        <span className="mr-1 text-[0.7em] font-medium text-gray-500">ab</span>
      )}
      <span className={cn("font-bold", priceClassName)}>{formattedPrice}</span>
      <sup
        className={cn(
          "relative top-[-0.4em] ml-0.5 leading-none font-bold text-gray-900",
          "text-[12px] sm:text-[0.8em]",
          asteriskClassName,
        )}
      >
        *
      </sup>
    </span>
  );
}
