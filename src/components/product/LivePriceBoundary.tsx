import { DEFAULT_COUNTRY } from "@/lib/countries";
import { Product } from "@/lib/product-registry";
import { mergeLivePrices } from "@/lib/server/live-data";
import React from "react";
import { IdealoLivePrice } from "./IdealoLivePrice";
import { PriceAnalysisBadge } from "./PriceAnalysisBadge";

interface LivePriceBoundaryProps {
  product: Product;
  variants: Product[];
  countryCode?: string;
  priceType?: "new" | "used";
}

/**
 * DEFERRED COMPONENT: This component is intended to be wrapped in a Suspense boundary.
 * It performs the final database merge for live prices, allowing the rest of the
 * PDP shell to render instantly.
 */
export async function LivePriceBoundary({
  product,
  variants,
  countryCode = DEFAULT_COUNTRY,
  priceType = "new",
  children,
}: LivePriceBoundaryProps & {
  children: (data: {
    mergedProduct: Product;
    mergedVariants: Product[];
  }) => React.ReactNode;
}) {
  // Perform the heavy lifting here, away from the main page thread
  const [mergedProduct, ...mergedVariants] = await mergeLivePrices(
    [product, ...variants],
    countryCode as any,
  );

  return <>{children({ mergedProduct, mergedVariants })}</>;
}

/**
 * Specialized sub-component for the big header price
 */
export async function LivePriceHeader({
  productId,
  countryCode,
  initialPrice,
}: {
  productId: number;
  countryCode: string;
  initialPrice: number;
}) {
  return (
    <IdealoLivePrice
      productId={productId}
      countryCode={countryCode as any}
      initialPrice={initialPrice}
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
}: {
  product: Product;
  countryCode: string;
}) {
  const [merged] = await mergeLivePrices([product], countryCode as any);
  if ((merged.savings || 0) <= 0) return null;
  return <PriceAnalysisBadge savings={merged.savings || 0} />;
}
