import { getProductFamilyMembers, type Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import { normalizeVariantAttributes } from "@/lib/utils/variants";
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
  let usedOverallType: "renewed" | "warehouse" = "renewed";

  // Initialize with current product
  if (currentIsNew) {
    newPrice = product.prices[countryCode] || 0;
    if (newPrice > 0 || effectiveCondition === "new") {
      hasNew = true;
      newSlug = product.slug;
      bestNewProductId = product.id!;
    }
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
    usedOverallType = "renewed";
    hasUsedOverall = true;
  } else if (curWarehousePrice > 0) {
    usedOverallPrice = curWarehousePrice;
    usedOverallSlug = product.slug;
    bestUsedOverallProductId = product.id!;
    usedOverallType = "warehouse";
    hasUsedOverall = true;
  } else if (
    effectiveCondition === "used" ||
    effectiveCondition === "renewed"
  ) {
    // If we are explicitly in used mode, show the button even if price is missing
    usedOverallPrice = 0;
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
    const normalizedCurAttrs = normalizeVariantAttributes(product);
    const category = product.category || "";

    familyMembers.forEach((m) => {
      const p = m.prices[countryCode] || 0;
      const up = m.usedPrices?.[countryCode] || 0;
      const mCond = (m.condition || "").toLowerCase();
      const normalizedMAttrs = normalizeVariantAttributes(m);

      const isCorrectSpec =
        isParentView || normalizedMAttrs === normalizedCurAttrs;
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
      const possibleUsed: {
        price: number;
        id: number;
        slug: string;
        type: "renewed" | "warehouse";
      }[] = [];

      // 1. Renewed products contribute their MAIN price
      if (mCond === "renewed" && p > 0)
        possibleUsed.push({
          price: p,
          id: m.id!,
          slug: m.slug,
          type: "renewed",
        });

      // 2. Any product matching the spec can contribute its WAREHOUSE price
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
          usedOverallType = item.type;
          hasUsedOverall = true;
        } else {
          const currentIsWarehouse = usedOverallType === "warehouse";
          const itemIsRenewed = item.type === "renewed";

          if (isParentView) {
            // Overall summary (e.g. "Alle Varianten") always shows absolute minimum
            if (item.price < usedOverallPrice) {
              usedOverallPrice = item.price;
              usedOverallSlug = item.slug;
              bestUsedOverallProductId = item.id;
              usedOverallType = item.type;
            }
          } else {
            // SPEC-SPECIFIC View:
            // If we find a Renewed price (the 'Main' Amazon offer), it usually
            // should take precedence over a Warehouse price unless the Warehouse
            // price is significantly cheaper.
            // But since our goal is trust, if Renewed exists and is at least
            // roughly as cheap as warehouse, use it.
            if (itemIsRenewed) {
              if (
                usedOverallPrice === 0 ||
                item.price < usedOverallPrice + 5 || // Prefer Renewed even if up to 5€ more expensive
                currentIsWarehouse
              ) {
                usedOverallPrice = item.price;
                usedOverallSlug = item.slug;
                bestUsedOverallProductId = item.id;
                usedOverallType = item.type;
              }
            } else if (currentIsWarehouse) {
              // Only update Warehouse if it's strictly cheaper than existing Warehouse
              if (item.price < usedOverallPrice) {
                usedOverallPrice = item.price;
                usedOverallSlug = item.slug;
                bestUsedOverallProductId = item.id;
                usedOverallType = item.type;
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

  // Smart Link Helpers
  const getSmartSlug = (slug: string, id: number) => {
    if (slug.match(/^\d+_-/)) return slug;
    const finalId = id >= 200000000 ? id : 200000000 + (id || 0);
    return `${finalId}_-${slug}`;
  };

  const finalNewSlug = getSmartSlug(
    newSlug,
    bestNewProductId || product.id || 0,
  );
  const finalUsedSlug = getSmartSlug(
    usedOverallSlug,
    bestUsedOverallProductId || product.id || 0,
  );

  return (
    <>
      {/* 1. NEW OFFER BOX */}
      {hasNew && (
        <Link
          href={`/p/${isParentView && parentSlug ? parentSlug : finalNewSlug}?condition=new`}
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
                priceType="new"
              />
            </Suspense>
          </div>
        </Link>
      )}

      {/* 2. GEBRAUCHT OFFER BOX (Merged Renewed & Warehouse) */}
      {hasUsedOverall && (
        <Link
          href={`/p/${isParentView && parentSlug ? parentSlug : finalUsedSlug}?condition=used`}
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
                priceType={usedOverallType === "renewed" ? "new" : "used"}
              />
            </Suspense>
          </div>
        </Link>
      )}
    </>
  );
}
