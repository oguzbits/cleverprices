"use client";

import { getFamilyIdentity } from "@/lib/product-families";
import { cn } from "@/lib/utils";
import {
  extractAttributeGroups,
  extractRealStorageFromTitle,
  normalizeVariantAttributes,
  parseCapacityToGB,
  parseVariationAttributes,
} from "@/lib/utils/variants";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { LegalPrice } from "../ui/LegalPrice";

interface Product {
  id: number;
  asin: string;
  slug: string;
  title: string;
  image?: string;
  variationAttributes?: string;
  prices: Record<string, number>;
  usedPrices?: Record<string, number>;
  brand: string;
  specifications?: Record<string, any>;
  officialSpecifications?: Record<string, any>;
  parentAsin?: string;
  condition: "New" | "Used" | "Renewed"; // Added condition
  category?: string;
  mpn?: string;
}

interface NormalizedProduct extends Product {
  normalizedStr: string;
  normalizedAttrs: Record<string, string>;
  canonicalSlug: string;
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

  const label = useMemo(() => {
    if (isAllVariants) return "Alle Varianten";

    // Extract values and handle misconceptions (like RAM being labeled as Storage)
    const displayValues: string[] = [];
    let foundRealStorage = false;

    const suffixTokens = (variant?.variantSuffix || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/);

    Object.entries(attrs).forEach(([key, value]) => {
      const k = key.toLowerCase();
      const valLower = value.toLowerCase();
      const gb = parseCapacityToGB(value);

      if (gb >= 64) {
        foundRealStorage = true;
      }

      // Skip attributes that are already in the variantSuffix (Color, MPN)
      // or are RAM-like placeholders in smartphones
      if (
        isSmartphone &&
        (k.includes("storage") ||
          k.includes("speicher") ||
          k.includes("memory")) &&
        gb > 0 &&
        gb < 64
      ) {
        return;
      }

      // Check if this specific value is already represented in the subtitle
      const valTokens = valLower.split(/[^a-z0-9]+/);
      const isRedundant = valTokens.every((t) => suffixTokens.includes(t));
      if (isRedundant) return;

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
  const isRenewed = variant?.condition?.toLowerCase() === "renewed";
  const price = isAllVariants
    ? bestPrice
    : isUsedMode && !isRenewed
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
          {isAllVariants ? "Alle Varianten" : variant?.variantSuffix || ""}
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
      : label.toLowerCase() === "color"
        ? "Farbe"
        : label.toLowerCase() === "ram" || label.toLowerCase() === "memory"
          ? "Arbeitsspeicher"
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
              const vAttrs = v.normalizedAttrs;
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
            ? `/p/${targetVariant.canonicalSlug}${condition ? `?condition=${condition}` : ""}`
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
  // 1. Enrich variants with normalized attributes
  const normalizedAllVariants = useMemo(() => {
    const normalizedVariants = allVariants.map((v) => {
      const normStr = normalizeVariantAttributes({
        variationAttributes: v.variationAttributes,
        title: v.title,
        category: v.category,
        officialSpecs: v.officialSpecifications || v.specifications,
      });

      // Generate the exact same canonical slug as the server
      const { slug: canonicalSlug, variantSuffix } = getFamilyIdentity(v);

      return {
        ...v,
        normalizedStr: normStr,
        normalizedAttrs: parseVariationAttributes(normStr),
        canonicalSlug,
        variantSuffix,
      };
    });
    return normalizedVariants;
  }, [allVariants]);

  const normalizedCurrentProduct = useMemo(() => {
    const normStr = normalizeVariantAttributes({
      variationAttributes: currentProduct.variationAttributes,
      title: currentProduct.title,
      category: currentProduct.category,
      officialSpecs:
        currentProduct.officialSpecifications || currentProduct.specifications,
    });

    // Generate the exact same canonical slug as the server
    const { slug: canonicalSlug, variantSuffix } =
      getFamilyIdentity(currentProduct);

    return {
      ...currentProduct,
      normalizedStr: normStr,
      normalizedAttrs: parseVariationAttributes(normStr),
      canonicalSlug,
      variantSuffix,
    };
  }, [currentProduct]);

  // Determine the condition pool to show.
  const targetCondition =
    selectedCondition === "renewed" || selectedCondition === "used"
      ? "used"
      : "new";

  const variants = useMemo(() => {
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
        .map(([k, val]) => `${k}:${val}`)
        .join(";");

      const existing = uniqueMap.get(key);

      if (!existing) {
        uniqueMap.set(key, v);
      } else {
        // Prioritize 'Main' price (Renewed) over Warehouse for the card display if both exist for same spec
        const getEffectivePrice = (p: NormalizedProduct) => {
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
  }, [normalizedAllVariants, targetCondition, countryCode, isParentView]);

  const isSmartphone =
    currentProduct.category === "smartphones" ||
    currentProduct.title.toLowerCase().includes("smartphone");

  const attributeGroups = useMemo(
    () => extractAttributeGroups(variants),
    [variants],
  );

  const currentAttrs = normalizedCurrentProduct.normalizedAttrs;

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
  }, [variants, currentAttrs, targetCondition, countryCode]);

  // Generate parent neutral slug using canonical logic
  const parentSlug = useMemo(() => {
    const rawId = currentProduct.id || 0;
    const realId = rawId % 100000000;
    const parentId = 900000000 + realId;
    const { slug } = getFamilyIdentity(
      { ...currentProduct, id: parentId } as any,
      variants as any,
    );
    return slug;
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
          return 3;
        };
        return score(a) - score(b);
      });
  }, [attributeGroups, isSmartphone]);

  const activeVariants = useMemo(() => {
    const currentNormalizedStr = Object.entries(currentAttrs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(";");

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
        .map(([k, v]) => `${k}:${v}`)
        .join(";");

      // Ensure we don't hide the current product even if price is missing (safety)
      const attrsMatch = variantNormalizedStr === currentNormalizedStr;
      return (p && p > 0) || attrsMatch;
    });
  }, [sortedVariants, targetCondition, countryCode, currentAttrs]);

  const carouselTitle = useMemo(() => {
    if (!isParentView) return "Variante:";

    const count = activeVariants.length;

    if (!bestPrice) return `${count} Varianten`;

    const formatter = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    });

    return `${count} Varianten ab ${formatter.format(bestPrice)}`;
  }, [isParentView, activeVariants.length, bestPrice]);

  return (
    <div className="mt-4 mb-6">
      <div className="mb-2 text-[13px] font-bold text-[#2d2d2d]">
        {carouselTitle}
      </div>

      <div className="relative w-full max-w-full overflow-hidden">
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

          {activeVariants.map((variant) => (
            <Link
              key={variant.asin}
              href={`/p/${variant.slug.includes("_-") ? variant.slug : `${200000000 + (variant.id || 0)}_-${variant.slug}`}${
                targetCondition ? `?condition=${targetCondition}` : ""
              }`}
              scroll={false}
              className="group cursor-pointer no-underline"
            >
              <VariantCard
                variant={variant}
                isSelected={
                  !isParentView &&
                  (variant.asin === currentProduct.asin ||
                    (() => {
                      const curStr = Object.entries(currentAttrs)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([k, val]) => `${k}:${val}`)
                        .join(";");
                      const varStr = Object.entries(variant.normalizedAttrs)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([k, val]) => `${k}:${val}`)
                        .join(";");
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
