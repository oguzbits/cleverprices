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
  className = "text-idealo-text-primary text-[15px] font-extrabold",
  showAb = false,
}: IdealoLivePriceProps) {
  // Fetch fresh price from the 1-minute cached source
  const live = await getLivePriceForProduct(productId, countryCode);
  const bestPrice = live?.price ?? initialPrice;

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
