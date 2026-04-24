import { type CountryCode } from "@/lib/countries";
import { Product } from "@/lib/product-definitions";
import { mergeLivePrices } from "@/lib/server/live-data";
import { IdealoLivePrice } from "./IdealoLivePrice";
import { PriceAnalysisBadge } from "./PriceAnalysisBadge";

interface LivePriceBoundaryProps {
  product: Product;
  variants: Product[];
  countryCode?: string;
  priceType?: "new" | "used";
}

/**
 * Specialized sub-component for the big header price
 */
export async function LivePriceHeader({
  productId,
  countryCode,
  initialPrice,
  livePriceData,
}: {
  productId: number;
  countryCode: CountryCode;
  initialPrice: number;
  livePriceData?: {
    price: number | null;
    usedPrice: number | null;
    warehousePrice: number | null;
  };
}) {
  return (
    <IdealoLivePrice
      productId={productId}
      countryCode={countryCode}
      initialPrice={initialPrice}
      livePriceData={livePriceData}
      className="text-[28px] font-black text-[#2d2d2d]"
    />
  );
}

/**
 * Specialized sub-component for the savings badge
 */
export async function LiveSavingsBadge({
  product,
  countryCode,
  liveSavings,
}: {
  product: Product;
  countryCode: CountryCode;
  liveSavings?: number;
}) {
  // Use passed-down savings or fetch if missing (for backward compatibility or other uses)
  const savings =
    liveSavings !== undefined
      ? liveSavings
      : (await mergeLivePrices([product], countryCode))[0].savings;

  if ((savings || 0) <= 0) return null;
  return <PriceAnalysisBadge savings={savings || 0} />;
}
