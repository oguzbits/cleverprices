import { getProductFamilyMembers, type Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { IdealoLivePrice, IdealoLivePriceSkeleton } from "./IdealoLivePrice";

interface ConditionButtonsProps {
  product: Product;
  countryCode: string;
  effectiveCondition: "new" | "used" | "renewed";
  isParentView?: boolean;
  parentSlug?: string;
}

export async function ConditionButtons({
  product,
  countryCode,
  effectiveCondition,
  isParentView,
  parentSlug,
}: ConditionButtonsProps) {
  // Normalize current condition
  const currentCond = (product.condition || "").toLowerCase();
  const currentIsRenewed = currentCond === "renewed";
  const currentIsUsed = currentCond === "used"; // Usually but possible in some DB states
  const currentIsNew = !currentIsRenewed && !currentIsUsed;

  let hasNew = false;
  let hasUsedOverall = false;

  let newSlug = "";
  let usedOverallSlug = product.slug;

  let newPrice = 0;
  let usedOverallPrice = 0;

  let bestNewProductId = 0;
  let bestUsedOverallProductId = 0;

  // Initialize with current product
  if (currentIsNew) {
    hasNew = true;
    newSlug = product.slug;
    newPrice = product.prices[countryCode] || 0;
    bestNewProductId = product.id!;
  }

  // Prioritize Renewed price as "Main" used price
  const curRenewedPrice = currentIsRenewed
    ? product.prices[countryCode] || 0
    : 0;
  const curWarehousePrice = product.usedPrices?.[countryCode] || 0;

  if (curRenewedPrice > 0) {
    usedOverallPrice = curRenewedPrice;
    usedOverallSlug = product.slug;
    bestUsedOverallProductId = product.id!;
    hasUsedOverall = true;
  } else if (curWarehousePrice > 0) {
    usedOverallPrice = curWarehousePrice;
    usedOverallSlug = product.slug;
    bestUsedOverallProductId = product.id!;
    hasUsedOverall = true;
  }

  // 1. Scan the family
  if (product.parentAsin) {
    const familyMembers = await getProductFamilyMembers(
      product.parentAsin,
      countryCode,
    );
    const curAttrs = product.variationAttributes?.toLowerCase().trim();

    familyMembers.forEach((m) => {
      const p = m.prices[countryCode] || 0;
      const up = m.usedPrices?.[countryCode] || 0;
      const mCond = (m.condition || "").toLowerCase();
      const mAttrs = m.variationAttributes?.toLowerCase().trim();

      const isCorrectSpec = isParentView || mAttrs === curAttrs;
      if (!isCorrectSpec) return;

      // Track New prices
      if (mCond !== "renewed" && mCond !== "used" && p > 0) {
        if (newPrice === 0 || p < newPrice) {
          newPrice = p;
          newSlug = m.slug;
          bestNewProductId = m.id!;
          hasNew = true;
        }
      }

      // Track "Gebraucht" prices (Priority: Renewed > Warehouse)
      // On Family view, we still want the absolute 'ab' (starting) price
      const possibleUsed = [];
      if (mCond === "renewed" && p > 0)
        possibleUsed.push({
          price: p,
          id: m.id!,
          slug: m.slug,
          type: "renewed",
        });
      if (up > 0)
        possibleUsed.push({
          price: up,
          id: m.id!,
          slug: m.slug,
          type: "warehouse",
        });

      possibleUsed.forEach((item) => {
        if (!hasUsedOverall) {
          usedOverallPrice = item.price;
          usedOverallSlug = item.slug;
          bestUsedOverallProductId = item.id;
          hasUsedOverall = true;
        } else {
          // If we have a choice, pick the lower price, but on individual spec prioritize renewed if price is similar?
          // Actually, 'Starting at' should probably just be the absolute min for clarity,
          // but user specifically said "take the price... which is main on amazon".
          // If 468 (Renewed) and 429 (Warehouse), and user says "take 468 as main", we prioritize Renewed listings.

          const currentIsWarehouse = !familyMembers.find(
            (fm) =>
              fm.id === bestUsedOverallProductId &&
              (fm.condition || "").toLowerCase() === "renewed",
          );
          const itemIsRenewed = item.type === "renewed";

          // Rule: If current best is warehouse but we found a renewed one, we might prefer renewed if it's the "Main" thing.
          // However, for an "ab" (starting at) label, absolute minimum is standard.
          // Let's compromise: If on variant page, prioritize Renewed. If on Family page, use absolute minimum.
          if (isParentView) {
            if (item.price < usedOverallPrice) {
              usedOverallPrice = item.price;
              usedOverallSlug = item.slug;
              bestUsedOverallProductId = item.id;
            }
          } else {
            // Variant page: If we find a Renewed price, use it as 'Main'.
            // Only use Warehouse if Renewed is missing or significantly more expensive could be a rule,
            // but let's stick to "Renewed is Main".
            if (itemIsRenewed) {
              if (
                usedOverallPrice === 0 ||
                item.price < usedOverallPrice ||
                currentIsWarehouse
              ) {
                usedOverallPrice = item.price;
                usedOverallSlug = item.slug;
                bestUsedOverallProductId = item.id;
              }
            } else if (currentIsWarehouse) {
              if (item.price < usedOverallPrice) {
                usedOverallPrice = item.price;
                usedOverallSlug = item.slug;
                bestUsedOverallProductId = item.id;
              }
            }
          }
        }
      });
    });
  }

  // Final Fallbacks
  if (hasNew && !newSlug) newSlug = product.slug;
  if (hasUsedOverall && !usedOverallSlug) usedOverallSlug = product.slug;

  return (
    <>
      {/* 1. NEW OFFER BOX */}
      {hasNew && (
        <Link
          href={`/p/${isParentView && parentSlug ? parentSlug : newSlug}?condition=new`}
          scroll={false}
          className={cn(
            "flex min-w-[140px] flex-col items-center justify-center rounded-[4px] border px-4 py-2 no-underline transition-all outline-none hover:no-underline",
            effectiveCondition === "new"
              ? "border border-[#0771d0] bg-white"
              : "border-[#b4b4b4] bg-white hover:border-[#888]",
          )}
        >
          <div className="relative w-full">
            {effectiveCondition === "new" && (
              <Check className="absolute -top-1.5 -left-3 h-4 w-4 stroke-[3px] text-[#0771d0]" />
            )}
            <div className="text-idealo-text-primary text-center text-[13px] font-bold">
              Neu ab
            </div>
          </div>
          <div className="text-idealo-text-primary text-[15px] font-extrabold">
            <Suspense
              fallback={<IdealoLivePriceSkeleton className="h-5 w-16" />}
            >
              <IdealoLivePrice
                productId={bestNewProductId}
                countryCode={countryCode as any}
                initialPrice={newPrice}
              />
            </Suspense>
          </div>
        </Link>
      )}

      {/* 2. GEBRAUCHT OFFER BOX (Merged Renewed & Warehouse) */}
      {hasUsedOverall && (
        <Link
          href={`/p/${isParentView && parentSlug ? parentSlug : usedOverallSlug}?condition=used`}
          scroll={false}
          className={cn(
            "flex min-w-[140px] flex-col items-center justify-center rounded-[4px] border px-4 py-2 no-underline transition-all outline-none hover:no-underline",
            effectiveCondition === "used" || effectiveCondition === "renewed"
              ? "border border-[#0771d0] bg-white"
              : "border-[#b4b4b4] bg-white hover:border-[#888]",
          )}
        >
          <div className="relative w-full">
            {(effectiveCondition === "used" ||
              effectiveCondition === "renewed") && (
              <Check className="absolute -top-1.5 -left-3 h-4 w-4 stroke-[3px] text-[#0771d0]" />
            )}
            <div className="text-idealo-text-primary text-center text-[13px] font-bold">
              Gebraucht ab
            </div>
          </div>
          <div className="text-idealo-text-primary text-[15px] font-extrabold">
            <Suspense
              fallback={<IdealoLivePriceSkeleton className="h-5 w-16" />}
            >
              <IdealoLivePrice
                productId={bestUsedOverallProductId}
                countryCode={countryCode as any}
                initialPrice={usedOverallPrice}
              />
            </Suspense>
          </div>
        </Link>
      )}
    </>
  );
}
