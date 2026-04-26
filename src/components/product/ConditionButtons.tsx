import { type CountryCode } from "@/lib/countries";
import { type Product } from "@/lib/product-definitions";
import { getFamilyIdentity } from "@/lib/product-families";
import { cn } from "@/lib/utils";
import { normalizeVariantAttributes } from "@/lib/utils/variants";
import { Check } from "lucide-react";
import Link from "next/link";
import { IdealoLivePrice } from "./IdealoLivePrice";

interface ConditionButtonsProps {
  product: Product;
  countryCode: CountryCode;
  effectiveCondition: "new" | "used" | "renewed";
  isParentView?: boolean;
  parentSlug?: string;
  variants?: Product[];
}

export function ConditionButtons({
  product,
  countryCode,
  effectiveCondition,
  isParentView,
  parentSlug,
  variants: passedVariants,
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

  let bestNewVariant: Product | null = null;
  let bestUsedVariant: Product | null = null;

  // Initialize with current product
  if (currentIsNew) {
    newPrice = product.prices[countryCode] || 0;
    if (newPrice > 0 || effectiveCondition === "new") {
      hasNew = true;
      newSlug = product.slug;
      bestNewProductId = product.id!;
      bestNewVariant = product;
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
    bestUsedVariant = product;
    hasUsedOverall = true;
  } else if (curWarehousePrice > 0) {
    usedOverallPrice = curWarehousePrice;
    usedOverallSlug = product.slug;
    bestUsedOverallProductId = product.id!;
    usedOverallType = "warehouse";
    bestUsedVariant = product;
    hasUsedOverall = true;
  } else if (
    effectiveCondition === "used" ||
    effectiveCondition === "renewed"
  ) {
    // If we are explicitly in used mode, show the button even if price is missing
    usedOverallPrice = 0;
    usedOverallSlug = product.slug;
    bestUsedOverallProductId = product.id!;
    bestUsedVariant = product;
    hasUsedOverall = true;
  }

  // 1. Scan the family
  if (product.parentAsin) {
    let familyMembers = passedVariants || [product];

    const normalizedCurAttrs = normalizeVariantAttributes(product);

    familyMembers.forEach((m: Product) => {
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
          const { slug } = getFamilyIdentity(m, familyMembers);
          newSlug = slug;
          bestNewProductId = m.id!;
          bestNewVariant = m;
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
          const { slug } = getFamilyIdentity(m, familyMembers);
          usedOverallSlug = slug;
          bestUsedOverallProductId = item.id;
          usedOverallType = item.type;
          bestUsedVariant = m;
          hasUsedOverall = true;
        } else {
          const currentIsWarehouse = usedOverallType === "warehouse";
          const itemIsRenewed = item.type === "renewed";
          const itemIsWarehouse = item.type === "warehouse";

          if (isParentView) {
            // Overall summary (e.g. "Alle Varianten") always shows absolute minimum
            if (item.price < usedOverallPrice) {
              usedOverallPrice = item.price;
              const { slug } = getFamilyIdentity(m, familyMembers);
              usedOverallSlug = slug;
              bestUsedOverallProductId = item.id;
              usedOverallType = item.type;
              bestUsedVariant = m;
            }
          } else {
            // SPEC-SPECIFIC View: Prefer Renewed if within 5€ margin
            let shouldSwitch = false;

            if (itemIsRenewed) {
              if (currentIsWarehouse) {
                shouldSwitch = true;
              } else {
                if (item.price < usedOverallPrice) {
                  shouldSwitch = true;
                }
              }
            } else if (itemIsWarehouse) {
              if (currentIsWarehouse) {
                if (item.price < usedOverallPrice) {
                  shouldSwitch = true;
                }
              } else {
                if (item.price < usedOverallPrice - 50) {
                  shouldSwitch = true;
                }
              }
            }

            if (shouldSwitch) {
              usedOverallPrice = item.price;
              const { slug } = getFamilyIdentity(m, familyMembers);
              usedOverallSlug = slug;
              bestUsedOverallProductId = item.id;
              usedOverallType = item.type;
              bestUsedVariant = m;
            }
          }
        }
      });
    });
  }

  // Final Fallbacks
  if (hasNew && !newSlug) newSlug = product.slug;
  if (hasUsedOverall && !usedOverallSlug) usedOverallSlug = product.slug;

  // Final Slugs are already canonicalized if found in family
  const finalNewSlug = newSlug.includes("_-")
    ? newSlug
    : getFamilyIdentity(product).slug;
  const finalUsedSlug = usedOverallSlug.includes("_-")
    ? usedOverallSlug
    : getFamilyIdentity(product).slug;

  return (
    <div className="flex gap-2">
      {/* 1. NEW OFFER BOX */}
      {hasNew && (
        <Link
          href={`${
            isParentView && parentSlug
              ? `/p/${parentSlug}`
              : `/p/${finalNewSlug}`
          }`}
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
            <IdealoLivePrice
              productId={bestNewProductId}
              countryCode={countryCode}
              initialPrice={newPrice}
              priceType="new"
              livePriceData={
                bestNewVariant
                  ? {
                      price: bestNewVariant.prices[countryCode] ?? null,
                      usedPrice:
                        bestNewVariant.usedPrices?.[countryCode] ?? null,
                      warehousePrice:
                        bestNewVariant.warehousePrices?.[countryCode] ?? null,
                    }
                  : undefined
              }
            />
          </div>
        </Link>
      )}

      {/* 2. GEBRAUCHT OFFER BOX */}
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
            <IdealoLivePrice
              productId={bestUsedOverallProductId}
              countryCode={countryCode}
              initialPrice={usedOverallPrice}
              priceType={usedOverallType === "renewed" ? "new" : "used"}
              livePriceData={
                bestUsedVariant
                  ? {
                      price: bestUsedVariant.prices[countryCode] ?? null,
                      usedPrice:
                        bestUsedVariant.usedPrices?.[countryCode] ?? null,
                      warehousePrice:
                        bestUsedVariant.warehousePrices?.[countryCode] ?? null,
                    }
                  : undefined
              }
            />
          </div>
        </Link>
      )}
    </div>
  );
}
