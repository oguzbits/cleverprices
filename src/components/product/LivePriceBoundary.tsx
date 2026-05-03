import { type CountryCode } from "@/lib/countries";
import { Product } from "@/lib/product-definitions";

import { IdealoLivePrice } from "./IdealoLivePrice";
import { PriceAnalysisBadge } from "./PriceAnalysisBadge";

interface _LivePriceBoundaryProps {
  product: Product;
  variants: Product[];
  countryCode?: string;
  priceType?: "new" | "used";
}

/**
 * Specialized sub-component for the big header price
 */
export function LivePriceHeader({
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
export function LiveSavingsBadge({
  product,
  countryCode: _countryCode,
  liveSavings,
}: {
  product: Product;
  countryCode: CountryCode;
  liveSavings?: number;
}) {
  const savings = liveSavings !== undefined ? liveSavings : product.savings;

  if ((savings || 0) <= 0) return null;
  return <PriceAnalysisBadge savings={savings || 0} />;
}
