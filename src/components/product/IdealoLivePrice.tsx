import { LegalPrice } from "@/components/ui/LegalPrice";
import type { CountryCode } from "@/lib/countries";
import { getLivePriceForProduct } from "@/lib/server/live-data";
import { cn } from "@/lib/utils";

interface IdealoLivePriceProps {
  productId: number;
  countryCode: CountryCode;
  initialPrice: number;
  className?: string;
  showAb?: boolean;
}

/**
 * Component for streaming live prices across the entire application.
 * Ensures that the price seen in a category grid matches the one on the product page.
 */
export async function IdealoLivePrice({
  productId,
  countryCode,
  initialPrice,
  priceType = "new",
  className = "text-idealo-text-primary text-[15px] font-extrabold",
  showAb = false,
  livePriceData,
}: IdealoLivePriceProps & {
  priceType?: "new" | "used";
  livePriceData?: {
    price: number | null;
    usedPrice: number | null;
    warehousePrice: number | null;
  };
}) {
  const live =
    livePriceData || (await getLivePriceForProduct(productId, countryCode));

  const p = live?.price || 0;
  const up = live?.usedPrice || 0;
  const wp = (live as any)?.warehousePrice || 0;

  // STRICT LOGIC:
  // If priceType is "new", we ONLY show the new price.
  // If priceType is "used", we ONLY show the best used price.
  // We do NOT use getBestPrice() here because it implements a "Smart" logic that might mixing them.
  let bestPrice = 0;

  if (priceType === "new") {
    bestPrice = live?.price || initialPrice || 0;
  } else {
    // Used Mode
    const up = live?.usedPrice || 0;
    const wp = (live as any)?.warehousePrice || 0;
    if (up > 0 && wp > 0) bestPrice = Math.min(up, wp);
    else bestPrice = up || wp || 0;
  }

  if (!bestPrice || bestPrice <= 0) {
    return (
      <span className={cn("text-[13px] font-bold text-[#767676]", className)}>
        Nicht verfügbar
      </span>
    );
  }

  return (
    <LegalPrice price={bestPrice} priceClassName={className} showAb={showAb} />
  );
}

export function IdealoLivePriceSkeleton({
  className = "h-7 w-24",
}: {
  className?: string;
}) {
  return <div className={cn("animate-pulse rounded bg-gray-200", className)} />;
}
