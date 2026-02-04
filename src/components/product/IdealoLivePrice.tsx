import { LegalPrice } from "@/components/ui/LegalPrice";
import type { CountryCode } from "@/lib/countries";
import { getLivePriceForProduct } from "@/lib/server/live-data";
import { cn } from "@/lib/utils";
import { getBestPrice } from "@/lib/utils/price-selection";

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
}: IdealoLivePriceProps & { priceType?: "new" | "used" }) {
  const live = await getLivePriceForProduct(productId, countryCode);

  const p = live?.price || 0;
  const up = live?.usedPrice || 0;
  const wp = (live as any)?.warehousePrice || 0;

  const bestPrice = getBestPrice({
    price: live?.price,
    usedPrice: live?.usedPrice,
    warehousePrice: (live as any)?.warehousePrice,
    initialPrice,
  });

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
