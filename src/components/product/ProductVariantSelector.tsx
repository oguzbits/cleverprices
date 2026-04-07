"use client";

import { getFamilyIdentity } from "@/lib/product-families";
import { cn } from "@/lib/utils";
import { getBestPrice } from "@/lib/utils/price-selection";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { getProductPath } from "@/lib/utils/url";
import {
  extractAttributeGroups,
  normalizeVariantAttributes,
  parseCapacityToGB,
  parseVariationAttributes,
} from "@/lib/utils/variants";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LegalPrice } from "../ui/LegalPrice";

import { type Product } from "@/lib/product-definitions";

interface NormalizedProduct extends Product {
  normalizedStr: string;
  normalizedAttrs: Record<string, string>;
  variantSuffix: string;
}

interface VariantCardProps {
  variant?: NormalizedProduct;
  isSelected?: boolean;
  countryCode: string;
  isAllVariants?: boolean;
  allImages?: (string | undefined)[];
  bestPrice?: number;
  currentSlug: string;
  isCheapest?: boolean;
  isHubMode?: boolean;
  selectedCondition?: string;
}

function VariantCard({
  variant,
  isSelected,
  countryCode,
  isAllVariants,
  allImages,
  bestPrice,
  currentSlug,
  isCheapest,
  isHubMode,
  selectedCondition,
}: VariantCardProps) {
  // ... (VariantCard implementation remains strictly visual)
  // Enhanced Label Logic for Smartphones/Tech
  const attrs = variant?.normalizedAttrs || {};
  const isSmartphone =
    variant?.category === "smartphones" ||
    variant?.title.toLowerCase().includes("smartphone");

  const label = (() => {
    if (isAllVariants) return "Alle Varianten";
    // Prioritize pre-calculated suffix from server to ensure 100% consistency
    if (variant?.variantSuffix) return variant.variantSuffix;

    if (!variant) return "";
    const identity = getProductIdentity(variant);
    return identity.variantSuffix || identity.displayTitle;
  })();

  // Price Logic: Show Used price if condition is 'used', otherwise New price
  const isUsedMode =
    selectedCondition === "used" || selectedCondition === "renewed";
  const isRenewed = (variant?.condition || "").toLowerCase() === "renewed";

  const price = (() => {
    if (isAllVariants) return bestPrice;
    if (!variant) return 0;

    const p = variant.prices[countryCode] || 0;
    const up = variant.usedPrices?.[countryCode] || 0;

    if (isUsedMode) {
      if (isRenewed) {
        if (p > 0 && up > 0) return Math.min(p, up);
        return p || up;
      }
      return up;
    }
    // New mode
    return isRenewed ? 0 : p;
  })();

  const slug = variant?.slug;

  const content = (
    <div
      className={cn(
        "relative flex h-[167px] w-[110px] min-w-[110px] flex-col overflow-hidden rounded-[4px] border bg-white text-left transition-all",
        isSelected ? "border-[#0771d0]" : "border-[#dcdcdc]",
      )}
    >
      {isSelected && (
        <div className="absolute top-0 left-0 z-20">
          <Check className="h-4 w-4 stroke-[3px] text-[#0771d0]" />
        </div>
      )}

      {isCheapest && !isAllVariants && isHubMode && (
        <div className="absolute top-0 left-0 z-30 flex items-center justify-center rounded-br-[4px] bg-[#0771d0] px-[4px] py-[2px]">
          <span className="text-[14px] leading-[16px] font-bold whitespace-nowrap text-white">
            Bester Preis
          </span>
        </div>
      )}

      {/* 1. Image Container */}
      <div
        className={cn(
          "flex h-[95px] w-full items-center justify-center overflow-hidden bg-gray-100",
          isAllVariants ? "p-[7px] py-0" : "p-[7px]",
        )}
      >
        {isAllVariants ? (
          <div className="max-h=full grid aspect-square h-full w-full grid-cols-2 gap-0.5">
            {allImages?.slice(0, 4).map((img, i) => (
              <div key={i} className="relative aspect-square">
                {img ? (
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-contain mix-blend-multiply"
                    sizes="32px"
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative h-full w-full">
            {variant?.image && (
              <Image
                src={variant.image}
                alt={label || ""}
                fill
                className="object-contain mix-blend-multiply"
                sizes="80px"
                quality={30}
              />
            )}
          </div>
        )}
      </div>

      {/* 2. Text Container */}
      <div className="flex flex-1 flex-col p-[7px]">
        <span
          className={cn(
            "mb-1 line-clamp-2 text-[12px] leading-tight font-bold",
            isSelected || isHubMode || isAllVariants
              ? "text-black"
              : "text-[#767676]",
          )}
        >
          {label}
        </span>

        <div className="mt-auto flex flex-col items-start">
          {price && price > 0 ? (
            <div className="flex flex-col items-start">
              <span className="text-[10px] leading-none text-[#767676]">
                ab
              </span>
              <LegalPrice
                price={price}
                priceClassName={cn(
                  "text-[14px] font-extrabold",
                  isSelected || isHubMode || isAllVariants
                    ? "text-[#f60]"
                    : "text-[#767676]",
                )}
              />
            </div>
          ) : (
            <div className="flex flex-col items-start">
              <span className="text-[12px] font-bold text-[#767676]">
                Nicht verfügbar
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isAllVariants) return content;
  if (!variant) return null;

  return content;
}

interface AttributeSelectorProps {
  label: string;
  options: string[];
  selected?: string;
  isParentView?: boolean;
  variants: NormalizedProduct[];
  currentAttrs: Record<string, string>;
  countryCode: string;
  condition?: string;
}

function AttributeSelector({
  label,
  options,
  selected,
  isParentView,
  variants,
  currentAttrs,
  countryCode,
  condition,
}: AttributeSelectorProps) {
  if (options.length <= 1) return null;

  const displayLabel =
    label.toLowerCase() === "storage" || label.toLowerCase() === "size"
      ? "Speicherkapazität" // Idealo uses explicitly 'Speicherkapazität' often, or 'Interner Speicher'.
      : label.toLowerCase() === "color" || label.toLowerCase() === "farbe"
        ? "Farbe"
        : label.toLowerCase() === "ram" || label.toLowerCase() === "memory"
          ? "Arbeitsspeicher"
          : label.toLowerCase() === "connectivity" ||
              label.toLowerCase() === "konnektivität"
            ? "Konnektivität"
            : label;

  const isColor =
    label.toLowerCase() === "color" || label.toLowerCase() === "farbe";

  return (
    <div className="mt-4">
      <span className="text-[13px] font-bold text-[#2d2d2d]">
        {displayLabel}:
      </span>
      <div className={cn("mt-1.5 flex min-h-[33px] flex-wrap gap-2")}>
        {options.map((option) => {
          // Availability Logic: Check if ANY variant with this option has a valid price
          const isUsedMode = condition === "used";
          const isAvailable = variants.some((v) => {
            const vAttrs = v.normalizedAttrs;
            // Check if this variant has this specific option for this attribute
            if (vAttrs[label] !== option) return false;

            // Check if it has a price in the current mode
            const price = isUsedMode
              ? v.usedPrices?.[countryCode]
              : v.prices[countryCode];
            if (!price || price <= 0) return false;

            // And check if it's compatible with other selected attributes (excluding the current one's dimension)
            // In Parent View (Hub), we relax this to check if THIS attribute value is available ANYWHERE in the family
            if (isParentView) return true;

            return Object.entries(currentAttrs).every(([pk, pv]) => {
              if (pk === label) return true; // ignore our own dimension
              return vAttrs[pk] === pv;
            });
          });

          const isSelected =
            !isParentView &&
            (() => {
              const currentVal = selected;
              if (!currentVal) return false;

              // Robust matching: Case-insensitive and Ignore Punctuation/Spaces
              const normalize = (s: string) =>
                s.toLowerCase().replace(/[^a-z0-9]/g, "");
              return normalize(currentVal) === normalize(option);
            })();

          // Find best matching variant for this chip (for the link)
          // Priority: 1. Exact match with current filters, 2. Any match with this option
          // Tie-breaker: If overlapping New/Renewed, PREFER RENEWED (usually cheaper)
          const targetAttrs = { ...currentAttrs, [label]: option };

          const getBestMatch = (candidates: NormalizedProduct[]) => {
            // Filter for exact attributes match
            const matches = candidates.filter((v) => {
              const vAttrs = v.normalizedAttrs;
              return Object.entries(targetAttrs).every(
                ([pk, pv]) => vAttrs[pk] === pv,
              );
            });

            if (matches.length === 0) return null;

            // Sort: Cheapest first
            const isUsedMode = condition === "used";
            return matches.sort((a, b) => {
              const pA = isUsedMode
                ? a.usedPrices?.[countryCode]
                : a.prices[countryCode];
              const pB = isUsedMode
                ? b.usedPrices?.[countryCode]
                : b.prices[countryCode];
              return (pA || 99999) - (pB || 99999);
            })[0];
          };

          const getRelaxedMatch = (candidates: NormalizedProduct[]) => {
            const matches = candidates.filter((v) => {
              const vAttrs = v.normalizedAttrs;
              return vAttrs[label] === option;
            });

            if (matches.length === 0) return null;

            // Sort: Cheapest first
            const isUsedMode = condition === "used";
            return matches.sort((a, b) => {
              const pA = isUsedMode
                ? a.usedPrices?.[countryCode]
                : a.prices[countryCode];
              const pB = isUsedMode
                ? b.usedPrices?.[countryCode]
                : b.prices[countryCode];
              return (pA || 99999) - (pB || 99999);
            })[0];
          };

          const targetVariant =
            getBestMatch(variants) || getRelaxedMatch(variants);

          const href = targetVariant
            ? `${getProductPath(targetVariant.id, targetVariant.slug, true)}${
                condition && condition !== "new"
                  ? `?condition=${condition}`
                  : ""
              }`
            : "#";

          const displayOption = (() => {
            const kLower = label.toLowerCase();
            const isStorage =
              kLower.includes("storage") ||
              kLower.includes("speicher") ||
              kLower.includes("kapazität");
            const isRam =
              kLower.includes("ram") || kLower.includes("arbeitsspeicher");

            if (!isStorage && !isRam) return option;

            // Check if any variant is a laptop or has high variance
            const isLaptop = variants.some(
              (v) =>
                v.category?.toLowerCase().includes("notebook") ||
                v.category?.toLowerCase().includes("laptop") ||
                v.title.toLowerCase().includes("macbook"),
            );

            if (isLaptop) {
              if (
                isStorage &&
                !option.toLowerCase().includes("ssd") &&
                !option.toLowerCase().includes("hdd")
              ) {
                return `${option} SSD`;
              }
              if (isRam && !option.toLowerCase().includes("ram")) {
                return `${option} RAM`;
              }
            }
            return option;
          })();

          return (
            <Link
              key={option}
              href={href}
              scroll={false}
              className={cn(
                "relative flex min-w-[70px] flex-col items-center justify-center rounded-[4px] border px-3 py-1.5 text-[#2d2d2d] no-underline transition-all",
                isSelected
                  ? "border-[#0771d0] bg-white"
                  : "border-[#b4b4b4] bg-white hover:border-[#888]",
                !isAvailable && !isSelected && "pointer-events-none opacity-40",
              )}
              title={
                !isAvailable ? "In dieser Kombination nicht verfügbar" : ""
              }
            >
              {isSelected && (
                <div className="absolute top-0 left-0 z-20">
                  <Check className="h-3.5 w-3.5 stroke-[3px] text-[#0771d0]" />
                </div>
              )}
              <span
                className={cn(
                  "inline-grid grid-cols-1 grid-rows-1 items-center justify-center text-[13px]",
                  isSelected ? "font-bold text-[#0771d0]" : "",
                )}
              >
                <span
                  className="invisible col-start-1 row-start-1 font-bold whitespace-nowrap"
                  aria-hidden="true"
                >
                  {displayOption}
                </span>
                <span className="col-start-1 row-start-1 whitespace-nowrap">
                  {displayOption}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ProductVariantSelectorProps removed as clean up. Only exports ProductVariantSelector now.

export function ProductVariantSelector({
  currentProduct,
  variants: allVariants,
  countryCode,
  isParentView = false,
  selectedCondition,
  parentSlug,
}: {
  currentProduct: Product;
  variants: Product[];
  countryCode: string;
  isParentView?: boolean;
  selectedCondition?: "new" | "used" | "renewed";
  parentSlug?: string; // Passed from server for stability
}) {
  // 1. Enrich variants with normalized attributes
  const normalizedAllVariants = allVariants.map((v) => {
    const normStr = normalizeVariantAttributes({
      variationAttributes: v.variationAttributes,
      title: v.title,
      category: v.category,
      officialSpecs: v.officialSpecifications || v.specifications,
    });

    // DATA INTEGRITY FIX:
    // If this variant is the current product, use the fresh 'currentProduct' data
    // (which has the correct prices from server prop) instead of the stale family fetch
    const isCurrent =
      v.id === currentProduct.id || v.asin === currentProduct.asin;
    const source = isCurrent ? currentProduct : v;

    return {
      ...source,
      normalizedStr: normStr,
      normalizedAttrs: parseVariationAttributes(normStr),
      // Use v.slug directly as it is already canonicalized in the Parent (CachedVariantSelector)
      variantSuffix: source.subtitle || "",
    };
  });

  const normalizedCurrentProduct = (() => {
    const normStr = normalizeVariantAttributes({
      variationAttributes: currentProduct.variationAttributes,
      title: currentProduct.title,
      category: currentProduct.category,
      officialSpecs:
        currentProduct.officialSpecifications || currentProduct.specifications,
    });

    return {
      ...currentProduct,
      normalizedStr: normStr,
      normalizedAttrs: parseVariationAttributes(normStr),
      variantSuffix: currentProduct.subtitle || "",
    };
  })();

  // Determine the condition pool to show.
  const targetCondition =
    selectedCondition === "renewed" || selectedCondition === "used"
      ? "used"
      : "new";

  // Shared price selector logic for consistency across all component facets
  const getEffectivePrice = (p: Product) => {
    const pricesVal = p.prices[countryCode] || 0;
    const usedPricesVal = p.usedPrices?.[countryCode] || 0;
    const isRenewed = (p.condition || "").toLowerCase() === "renewed";

    // Unified logic selection!
    const bestOverall = getBestPrice({
      price: p.prices[countryCode],
      usedPrice: usedPricesVal,
      warehousePrice: p.warehousePrices?.[countryCode],
      mode: targetCondition === "new" ? "new" : "used",
    });

    return bestOverall;
  };

  const variants = (() => {
    const rawFiltered = normalizedAllVariants.filter((v) => {
      // HUB MODE FIX: Always show all unique configurations in Parent View.
      // This ensures the "15 Varianten" count on Category Page (which counts unique specs)
      // matches the number of cards shown here (e.g. 15).
      if (isParentView) return true;

      const cond = (v.condition || "New").toLowerCase();
      const isRenewedListing = cond === "renewed";
      const hasWarehousePrice = (v.usedPrices?.[countryCode] || 0) > 0;

      if (targetCondition === "used") {
        // In used mode, we show both certified Renewed listings AND items with Warehouse deals
        return isRenewedListing || hasWarehousePrice;
      }

      // In new mode, we only show physical listings that are 'New'
      return !isRenewedListing;
    });

    // Group by attributes to avoid showing duplicates
    const uniqueMap = new Map<string, NormalizedProduct>();
    rawFiltered.forEach((v) => {
      const key = Object.entries(v.normalizedAttrs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, val]) => `${k}: ${val}`)
        .join("; ");

      const existing = uniqueMap.get(key);

      if (!existing) {
        uniqueMap.set(key, v);
      } else {
        const priceV = getEffectivePrice(v) || 0;
        const priceE = getEffectivePrice(existing) || 0;

        if (priceV > 0) {
          if (priceE === 0) {
            uniqueMap.set(key, v);
          } else {
            const vIsRenewed = (v.condition || "").toLowerCase() === "renewed";
            const eIsRenewed =
              (existing.condition || "").toLowerCase() === "renewed";

            let shouldReplace = false;
            if (vIsRenewed && !eIsRenewed) {
              // Switch to Renewed if it's within 5€ of the current Warehouse price
              if (priceV < priceE + 5) shouldReplace = true;
            } else if (!vIsRenewed && eIsRenewed) {
              // Current is Renewed, only switch to Warehouse if it's MORE than 5€ cheaper
              if (priceV < priceE - 5) shouldReplace = true;
            } else {
              // Same type, take the cheaper one
              if (priceV < priceE) shouldReplace = true;
            }

            if (shouldReplace) {
              uniqueMap.set(key, v);
            }
          }
        }
      }
    });

    return Array.from(uniqueMap.values());
  })();

  const isSmartphone =
    currentProduct.category === "smartphones" ||
    currentProduct.title.toLowerCase().includes("smartphone");

  const attributeGroups = extractAttributeGroups(variants);

  const currentAttrs = normalizedCurrentProduct.normalizedAttrs;

  const {
    bestPrice,
    allImages,
    cheapestAsin = "",
  } = (() => {
    let min = Infinity;
    let minAsin = "";
    const images: (string | undefined)[] = [];

    variants.forEach((v) => {
      const p = getEffectivePrice(v);

      if (p && p > 0 && (min === Infinity || p < min)) {
        min = p;
        minAsin = v.asin;
      }
      if (v.image && !images.includes(v.image)) images.push(v.image);
    });
    return {
      bestPrice: min === Infinity ? undefined : min,
      allImages: images,
      cheapestAsin: minAsin,
    };
  })();

  const sortedVariants = (() => {
    const currentNormalizedStr = Object.entries(currentAttrs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(";");

    return [...variants].sort((a, b) => {
      // Standardize for comparison
      const normA = Object.entries(a.normalizedAttrs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join(";");
      const normB = Object.entries(b.normalizedAttrs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join(";");

      // 1. Current product specification always first
      if (normA === currentNormalizedStr) return -1;
      if (normB === currentNormalizedStr) return 1;

      // 2. Sort by active price
      const getPrice = (p: NormalizedProduct) => {
        if (targetCondition === "new") return p.prices[countryCode];
        const isRenewed = (p.condition || "").toLowerCase() === "renewed";
        return isRenewed ? p.prices[countryCode] : p.usedPrices?.[countryCode];
      };

      const priceA = getPrice(a);
      const priceB = getPrice(b);

      return (priceA || 999999) - (priceB || 999999);
    });
  })();

  // Generate parent neutral slug using canonical logic
  const derivedParentSlug = (() => {
    if (parentSlug) return parentSlug;

    const rawId = currentProduct.id || 0;
    const realId = rawId % 100000000;
    const parentId = 900000000 + realId;
    const { slug } = getFamilyIdentity(
      { ...currentProduct, id: parentId },
      normalizedAllVariants, // Use full list for consensus
    );
    return slug;
  })();

  const finalParentSlug = parentSlug || derivedParentSlug;

  if (allVariants.length <= 1) return null;

  const sortedAttributeGroups = (() => {
    const rawEntries = Object.entries(attributeGroups);
    const hasRam = rawEntries.some(([k]) =>
      /ram|memory|arbeitsspeicher/i.test(k),
    );

    const isRamCategory = /ram|memory|arbeitsspeicher/i.test(
      currentProduct.category || "",
    );
    const hasStorage = rawEntries.some(([k]) =>
      /storage|kapazität|speicher/i.test(k),
    );

    return rawEntries
      .filter(([key, values]) => {
        const k = key.toLowerCase();
        // Style is now mapped to Connectivity, but we still filter out generic Style just in case
        if (k === "style") return false;

        // For RAM kits: "RAM" and "Storage" (Kapazität) are duplicates.
        // Hide "Storage" if we already identified "RAM" in this specific category.
        if (isRamCategory && k === "storage" && hasRam) return false;

        return true;
      })
      .map(([key, values]) => {
        const k = key.toLowerCase();
        // For smartphones, filter out RAM (usually < 64GB) from storage-labeled groups
        if (
          isSmartphone &&
          (k.includes("storage") ||
            k.includes("speicher") ||
            k.includes("memory"))
        ) {
          const filtered = values.filter((v) => parseCapacityToGB(v) >= 64);
          return [key, filtered] as [string, string[]];
        }
        return [key, values] as [string, string[]];
      })
      .filter(([_, values]) => values.length > 0)
      .sort(([a], [b]) => {
        const score = (key: string) => {
          const k = key.toLowerCase();
          if (
            k === "ram" ||
            k === "arbeitsspeicher" ||
            k === "memory" ||
            k.includes("ram")
          )
            return 0;
          if (
            k === "storage" ||
            k === "interner speicher" ||
            k === "size" ||
            k === "speicherkapazität" ||
            k === "ssd"
          )
            return 1;
          if (k === "color" || k === "farbe") return 2;
          if (k === "connectivity" || k === "konnektivität") return 3;
          return 4;
        };
        return score(a) - score(b);
      });
  })();

  const activeVariants = (() => {
    const currentNormalizedStr = Object.entries(currentAttrs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");

    return sortedVariants.filter((v) => {
      const p =
        targetCondition === "used"
          ? (v.condition?.toLowerCase() === "renewed"
              ? v.prices[countryCode]
              : v.usedPrices?.[countryCode]) || v.prices[countryCode]
          : v.prices[countryCode];

      // Standardize variant for comparison
      const variantNormalizedStr = Object.entries(v.normalizedAttrs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");

      // Ensure we don't hide the current product even if price is missing (safety)
      const attrsMatch = variantNormalizedStr === currentNormalizedStr;
      return (p && p > 0) || attrsMatch;
    });
  })();

  const carouselTitle = (() => {
    if (!isParentView) return "Variante:";

    const count = activeVariants.length;

    if (!bestPrice) return `${count} Varianten`;

    const formatter = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    });

    return `${count} Varianten ab ${formatter.format(bestPrice)}`;
  })();

  return (
    <div className="mt-4 mb-6">
      <div className="mb-2 text-[13px] font-bold text-[#2d2d2d]">
        {carouselTitle}
      </div>

      <div className="relative w-full max-w-full overflow-hidden">
        <div className="scrollbar-thin scrollbar-thumb-gray-300 flex gap-2.5 overflow-x-auto pt-1 pb-2">
          {/* Alle Varianten Card */}
          <Link
            href={`${getProductPath(undefined, finalParentSlug)}${
              targetCondition && targetCondition !== "new"
                ? `?condition=${targetCondition}`
                : ""
            }`}
            scroll={false}
            className="group cursor-pointer no-underline"
          >
            <VariantCard
              isAllVariants={true}
              isSelected={isParentView}
              allImages={allImages}
              bestPrice={bestPrice}
              countryCode={countryCode}
              currentSlug={currentProduct.slug}
              isHubMode={isParentView}
              selectedCondition={targetCondition}
            />
          </Link>

          {activeVariants.map((variant) => (
            <Link
              key={variant.asin}
              href={`${getProductPath(variant.id, variant.slug)}${
                targetCondition && targetCondition !== "new"
                  ? `?condition=${targetCondition}`
                  : ""
              }`}
              scroll={false}
              className="group cursor-pointer no-underline"
            >
              <VariantCard
                variant={variant}
                isSelected={
                  !isParentView &&
                  (variant.asin === currentProduct.asin ||
                    variant.id === currentProduct.id || // Added ID check
                    (() => {
                      const curStr = Object.entries(currentAttrs)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([k, val]) => `${k}: ${val}`)
                        .join("; ");
                      const varStr = Object.entries(variant.normalizedAttrs)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([k, val]) => `${k}: ${val}`)
                        .join("; ");
                      return curStr === varStr;
                    })())
                }
                countryCode={countryCode}
                currentSlug={currentProduct.slug}
                isCheapest={variant.asin === cheapestAsin}
                isHubMode={isParentView}
                selectedCondition={targetCondition}
              />
            </Link>
          ))}
        </div>
      </div>

      {sortedAttributeGroups.map(([attrName, values]) => (
        <AttributeSelector
          key={attrName}
          label={attrName}
          options={values}
          selected={currentAttrs[attrName]}
          isParentView={isParentView}
          variants={variants}
          currentAttrs={currentAttrs}
          countryCode={countryCode}
          condition={targetCondition}
        />
      ))}
    </div>
  );
}

function ProductVariantSelectorSkeleton() {
  return (
    <div className="mt-4 mb-6 animate-pulse">
      {/* Title Skeleton */}
      <div className="mb-2 h-4 w-32 rounded bg-gray-200" />

      <div className="flex gap-2.5 overflow-hidden pt-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-[167px] min-w-[110px] rounded border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    </div>
  );
}
