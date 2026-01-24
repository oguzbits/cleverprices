"use client";

import { cn } from "@/lib/utils";
import {
  extractAttributeGroups,
  extractRealStorageFromTitle,
  parseCapacityToGB,
  parseVariationAttributes,
} from "@/lib/utils/variants";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { LegalPrice } from "../ui/LegalPrice";

interface Product {
  asin: string;
  slug: string;
  title: string;
  image?: string;
  variationAttributes?: string;
  prices: Record<string, number>;
  usedPrices?: Record<string, number>;
  brand: string;
  specifications?: Record<string, any>;
  parentAsin?: string;
  condition: "New" | "Used" | "Renewed"; // Added condition
  category?: string;
}

interface VariantCardProps {
  variant?: Product;
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
  const attrs = parseVariationAttributes(variant?.variationAttributes);
  const isSmartphone =
    variant?.category === "smartphones" ||
    variant?.title.toLowerCase().includes("smartphone");

  const label = useMemo(() => {
    if (isAllVariants) return "Alle Varianten";

    // Extract values and handle misconceptions (like RAM being labeled as Storage)
    const displayValues: string[] = [];
    let foundRealStorage = false;

    Object.entries(attrs).forEach(([key, value]) => {
      const k = key.toLowerCase();
      const gb = parseCapacityToGB(value);

      if (gb >= 64) {
        foundRealStorage = true;
      }

      // Heuristic: If it's a smartphone and the "Storage" is exactly 8, 12, 16, or < 64, it's likely RAM.
      // We exclude these from the primary card label to avoid "12GB Titanium" (RAM + Color).
      if (
        isSmartphone &&
        (k.includes("storage") ||
          k.includes("speicher") ||
          k.includes("memory"))
      ) {
        if (gb > 0 && gb < 64) return; // Skip RAM in labels
      }

      displayValues.push(value);
    });

    // Recovery if real storage wasn't in variation attributes
    if (isSmartphone && !foundRealStorage) {
      const real = extractRealStorageFromTitle(variant?.title);
      if (real) displayValues.unshift(real);
    }

    return displayValues.join(" ") || variant?.title.slice(0, 30);
  }, [variant, attrs, isAllVariants, isSmartphone]);

  // Price Logic: Show Used price if condition is 'used', otherwise New price
  const isUsedMode = selectedCondition === "used";
  const price = isAllVariants
    ? bestPrice
    : isUsedMode
      ? variant?.usedPrices?.[countryCode]
      : variant?.prices[countryCode];

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
          <div className="grid aspect-square h-full max-h-full w-full grid-cols-2 gap-0.5">
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
          {price && price > 0 && (
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
  variants: Product[];
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
      ? "interner Speicher"
      : label.toLowerCase() === "color"
        ? "Farbe"
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
          // Availability Logic
          const isUsedMode = condition === "used";
          const isAvailable =
            isParentView ||
            isColor ||
            variants.some((v) => {
              const vAttrs = parseVariationAttributes(v.variationAttributes);
              // Check if this variant has this specific option for this attribute
              if (vAttrs[label] !== option) return false;

              // Check if it has a price in the current mode
              const price = isUsedMode
                ? v.usedPrices?.[countryCode]
                : v.prices[countryCode];
              if (!price || price <= 0) return false;

              // And check if it's compatible with other selected attributes (excluding the current one's dimension)
              return Object.entries(currentAttrs).every(([pk, pv]) => {
                if (pk === label) return true; // ignore our own dimension
                return vAttrs[pk] === pv;
              });
            });

          const isSelected = !isParentView && selected === option;

          // Find best matching variant for this chip (for the link)
          // Priority: 1. Exact match with current filters, 2. Any match with this option
          // Tie-breaker: If overlapping New/Renewed, PREFER RENEWED (usually cheaper)
          const targetAttrs = { ...currentAttrs, [label]: option };

          const getBestMatch = (candidates: Product[]) => {
            // Filter for exact attributes match
            const matches = candidates.filter((v) => {
              const vAttrs = parseVariationAttributes(v.variationAttributes);
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

          const getRelaxedMatch = (candidates: Product[]) => {
            const matches = candidates.filter((v) => {
              const vAttrs = parseVariationAttributes(v.variationAttributes);
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
            ? `/p/${targetVariant.slug}${condition ? `?condition=${condition}` : ""}`
            : "#";

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
                  {option}
                </span>
                <span className="col-start-1 row-start-1 whitespace-nowrap">
                  {option}
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
}: {
  currentProduct: Product;
  variants: Product[];
  countryCode: string;
  isParentView?: boolean;
  selectedCondition?: "new" | "used" | "renewed";
}) {
  // STRICT FILTERING: Only show variants matching the current condition
  // If current is "Renewed", only show "Renewed". If "New", only show "New".
  // Note: "New" in UI might map to "New" or "Used" in DB technically, but for our 'Renewed/New' split:
  // Renewed = (condition === 'Renewed')
  // New = (condition !== 'Renewed')

  // Determine the condition pool to show.
  const targetCondition =
    selectedCondition === "renewed" || selectedCondition === "used"
      ? "used"
      : "new";

  const variants = useMemo(() => {
    const rawFiltered = allVariants.filter((v) => {
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
    const uniqueMap = new Map<string, Product>();
    rawFiltered.forEach((v) => {
      const key = (v.variationAttributes || v.asin).toLowerCase().trim();
      const existing = uniqueMap.get(key);

      if (!existing) {
        uniqueMap.set(key, v);
      } else {
        // Prioritize 'Main' price (Renewed) over Warehouse for the card display if both exist for same spec
        const getEffectivePrice = (p: Product) => {
          if (targetCondition === "new") return p.prices[countryCode];
          // Used Mode logic: Prioritize Renewed price
          const isRenewed = (p.condition || "").toLowerCase() === "renewed";
          return isRenewed
            ? p.prices[countryCode]
            : p.usedPrices?.[countryCode];
        };

        const priceV = getEffectivePrice(v) || 0;
        const priceE = getEffectivePrice(existing) || 0;

        // Replace if: new has price and existing doesn't, OR new is cheaper than existing
        if (priceV > 0 && (priceE === 0 || priceV < priceE)) {
          uniqueMap.set(key, v);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }, [allVariants, targetCondition, countryCode]);

  const isSmartphone =
    currentProduct.category === "smartphones" ||
    currentProduct.title.toLowerCase().includes("smartphone");

  const attributeGroups = useMemo(
    () => extractAttributeGroups(variants),
    [variants],
  );

  const currentAttrs = useMemo(
    () => parseVariationAttributes(currentProduct.variationAttributes),
    [currentProduct.variationAttributes],
  );

  const { bestPrice, allImages, cheapestAsin } = useMemo(() => {
    let min = Infinity;
    let minAsin = "";
    const images: (string | undefined)[] = [];

    variants.forEach((v) => {
      // Use Main price logic for used mode
      const isRenewed = (v.condition || "").toLowerCase() === "renewed";
      const p =
        targetCondition === "used"
          ? isRenewed
            ? v.prices[countryCode]
            : v.usedPrices?.[countryCode]
          : v.prices[countryCode];

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
  }, [variants, countryCode, targetCondition]);

  const sortedVariants = useMemo(() => {
    return [...variants].sort((a, b) => {
      // 1. Current product specification always first
      const attrsA = a.variationAttributes?.toLowerCase().trim();
      const attrsB = b.variationAttributes?.toLowerCase().trim();
      const curAttrs = currentProduct.variationAttributes?.toLowerCase().trim();

      if (attrsA === curAttrs) return -1;
      if (attrsB === curAttrs) return 1;

      // 2. Sort by active price (Using same Main price logic)
      const getPrice = (p: Product) => {
        if (targetCondition === "new") return p.prices[countryCode];
        const isRenewed = (p.condition || "").toLowerCase() === "renewed";
        return isRenewed ? p.prices[countryCode] : p.usedPrices?.[countryCode];
      };

      const priceA = getPrice(a);
      const priceB = getPrice(b);

      return (priceA || 999999) - (priceB || 999999);
    });
  }, [variants, currentProduct, targetCondition, countryCode]);

  // Generate parent neutral slug using robust subtraction logic
  const parentSlug = useMemo(() => {
    const parentAsis = currentProduct.parentAsin || currentProduct.asin;
    const parentAsinSuffix = parentAsis.slice(-4).toLowerCase();

    // 1. Collect all variation values to subtract
    const variationTokens = new Set<string>();
    variants.forEach((v) => {
      const attrs = parseVariationAttributes(v.variationAttributes);
      Object.entries(attrs).forEach(([key, value]) => {
        // Add exact value
        variationTokens.add(value.toLowerCase());
        // Add split parts (e.g. "512 GB" -> "512", "gb")
        value
          .toLowerCase()
          .split(/([^a-z0-9]+)|(?<=[0-9])(?=[a-z])|(?<=[a-z])(?=[0-9])/)
          .filter((t) => t && !/^\s+$/.test(t))
          .forEach((t) => variationTokens.add(t));
      });
    });

    // 2. Add common spec keywords to filter
    const keywordsToFilter = [
      "gb",
      "mb",
      "tb",
      "generalüberholt",
      "renewed",
      "neu",
      "new",
      "brandnew",
      "used",
      "gebraucht",
      "handy",
      "mobile",
      "telefon",
      "generalueberholt",
      "general",
      "ueberholt",
      "berholt",
      "refurbished",
      "renewed",
    ];

    // Also add singular versions of variations just in case
    variants.forEach((v) => {
      // ... handled above by splitting loop
    });
    keywordsToFilter.forEach((k) => variationTokens.add(k));

    // 3. Clean Brand
    const brand = currentProduct.brand;
    const brandPrefix = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // 4. Determine base name (Model or Title)
    // We prefer Title because Model sometimes is missing or cryptic,
    // but we will rigorously strip the variation tokens from it.

    let baseName = currentProduct.title
      .toLowerCase()
      .normalize("NFKC")
      .replace(/\u00E4/g, "ae")
      .replace(/\u00F6/g, "oe")
      .replace(/\u00FC/g, "ue")
      .replace(/\u00DF/g, "ss");

    // Remove Brand from title to avoid duplication if it's there
    if (baseName.startsWith(brand.toLowerCase())) {
      baseName = baseName.slice(brand.length).trim();
    }

    // 5. Tokenize and Filter
    // Robust split: Split by non-alphanumeric AND transitions between digits and letters
    // e.g. "512GB" -> "512", "GB"
    const tokens = baseName
      .split(/([^a-z0-9]+)|(?<=[0-9])(?=[a-z])|(?<=[a-z])(?=[0-9])/)
      .filter((t) => t && !/^\s+$/.test(t));

    const cleanTokens = tokens.filter((t) => {
      const token = t.toLowerCase().trim();
      if (!token) return false;
      // Strict filter: Must contain at least one alphanumeric char
      if (!/[a-z0-9]/.test(token)) return false;

      // Aggressive kill-list
      if (
        token.includes("general") ||
        token.includes("berholt") ||
        token.includes("ueberholt") ||
        token.includes("refurbished") ||
        token.includes("renewed")
      )
        return false;

      // If token is a known variation value (like "512", "black"), skip it
      if (variationTokens.has(token)) return false;
      // If token looks like a capacity unit (redundant check but safe)
      if (/^[0-9]+[gtm]b$/.test(t)) return false;
      return true;
    });

    // 6. Reconstruct
    // Take the first few meaningful tokens (usually Model Name parts)
    // e.g. ["iphone", "15"]
    const modelPart = cleanTokens.slice(0, 4).join("-");

    return `${brandPrefix}-${modelPart}-${parentAsinSuffix}`.replace(
      /-+/g,
      "-",
    );
  }, [currentProduct, variants]);

  if (allVariants.length <= 1) return null;

  const sortedAttributeGroups = useMemo(() => {
    return Object.entries(attributeGroups)
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
          if (k === "color" || k === "farbe") return 0;
          if (k === "storage" || k === "interner speicher" || k === "size")
            return 1;
          return 2;
        };
        return score(a) - score(b);
      });
  }, [attributeGroups, isSmartphone]);

  return (
    <div className="mt-4 mb-6">
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

      <div className="relative mt-6 w-full max-w-full overflow-hidden">
        <div className="scrollbar-thin scrollbar-thumb-gray-300 flex gap-2.5 overflow-x-auto pt-1 pb-2">
          {/* Alle Varianten Card */}
          <Link
            href={`/p/${parentSlug}?condition=${targetCondition}`}
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

          {sortedVariants
            .filter((v) => {
              const p =
                targetCondition === "used"
                  ? v.usedPrices?.[countryCode] || v.prices[countryCode]
                  : v.prices[countryCode];
              // Ensure we don't hide the current product even if price is missing (safety)
              const attrsMatch =
                v.variationAttributes?.toLowerCase().trim() ===
                currentProduct.variationAttributes?.toLowerCase().trim();
              return (p && p > 0) || attrsMatch;
            })
            .map((variant) => (
              <Link
                key={variant.asin}
                href={`/p/${variant.slug}${
                  targetCondition ? `?condition=${targetCondition}` : ""
                }`}
                scroll={false}
                className="group cursor-pointer no-underline"
              >
                <VariantCard
                  variant={variant}
                  isSelected={
                    !isParentView &&
                    variant.variationAttributes?.toLowerCase().trim() ===
                      currentProduct.variationAttributes?.toLowerCase().trim()
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
    </div>
  );
}

export function ProductVariantSelectorSkeleton() {
  return (
    <div className="mt-4 mb-4 animate-pulse">
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
