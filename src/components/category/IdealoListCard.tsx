/**
 * Idealo List Card Component
 *
 * Product card for List view, matching Idealo's exact HTML structure.
 *
 * Structure:
 * sr-resultItemTile_B0odU sr-resultItemTile--LIST_OzjBW
 * ├── sr-resultItemTile__buttons_kvQyr sr-resultItemTile__buttons--LIST_RHUNJ
 * ├── sr-resultItemTile__imageSection_aCeup sr-resultItemTile__imageSection--LIST_VDi1k
 * ├── sr-resultItemTile__efficiencyLabels_cWzym sr-resultItemTile__efficiencyLabels--LIST_xidcZ
 * ├── sr-resultItemTile__infoWrapper_otTCK
 * │   ├── sr-resultItemTile__summary_t5DyK
 * │   │   ├── sr-productSummary_vCt4O > title + description
 * │   │   └── sr-productRating_cszy2 (stars)
 * │   └── sr-resultItemTile__pioTrigger_W2Axs (Produktdetails - LIST only)
 * ├── sr-detailedPriceInfo_ypbTl sr-detailedPriceInfo--LIST_wCT4I
 * └── sr-resultItemTile__badges_eYrH1
 */

import Image from "next/image";

import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { type CountryCode, getCountryByCode } from "@/lib/countries";
import { getFamilyIdentity } from "@/lib/product-families";
import { type LeanProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTechText } from "@/lib/utils/formatting";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { isProductBestseller } from "@/lib/utils/products";
import { getProductPath } from "@/lib/utils/url";

import { IdealoLivePrice } from "../product/IdealoLivePrice";
import { IdealoStarRating } from "./IdealoStarRating";

interface IdealoListCardProps {
  product: LeanProduct;
  countryCode: CountryCode;
  className?: string;
  priority?: boolean;
  livePriceData?: {
    price: number | null;
    usedPrice: number | null;
    warehousePrice: number | null;
  };
}

export function IdealoListCard({
  product,
  countryCode,
  className,
  priority = false,
  livePriceData,
}: IdealoListCardProps) {
  const _countryConfig = getCountryByCode(countryCode);

  // Build description parts
  const fullTitle = (
    product.subtitle
      ? `${product.title || ""} ${product.subtitle}`
      : product.title || ""
  ).toLowerCase();

  const descriptionParts = [
    product.capacity && product.capacityUnit
      ? `${product.capacity} ${product.capacityUnit}`
      : null,
    product.formFactor,
  ]
    .filter(Boolean)
    .filter((part) => !fullTitle.includes(part!.toLowerCase()));

  // Only show variation attributes if they aren't already in the title
  const hasUniqueVariation =
    product.variationAttributes &&
    product.variationAttributes.split(";").some((attr) => {
      const val = attr.split(":").pop()?.trim().toLowerCase();
      return val && !fullTitle.includes(val);
    });

  const isHub = !!product.isParentView;
  const identity = getProductIdentity(product);

  const displayModelTitle = product.modelTitle || identity.modelTitle;
  const displayVariantSuffix = product.variantSuffix || identity.variantSuffix;

  // Compute canonical slug at render time for identity-driven categories.
  const IDENTITY_CATEGORIES = [
    "smartphones",
    "tablets",
    "notebooks",
    "laptops",
    "handy",
  ];
  const useLiveSlug =
    IDENTITY_CATEGORIES.includes(product.category || "") && !isHub;
  const liveSlug = useLiveSlug
    ? getFamilyIdentity(product, []).slug
    : undefined;
  const cardHref = liveSlug
    ? `/p/${liveSlug}`
    : getProductPath(product.id || 0, product.slug || "");

  return (
    <div className={cn("sr-resultList__item", "-mb-px", className)}>
      <PrefetchLink
        href={cardHref}
        className={cn(
          "sr-resultItemTile sr-resultItemTile--LIST",
          "relative flex flex-row items-stretch",
          "border border-[#b4b4b4] bg-white text-inherit no-underline hover:no-underline",
        )}
      >
        {/* ============================================ */}
        {/* IMAGE SECTION - sr-resultItemTile__imageSection--LIST */}
        {/* ============================================ */}
        <div
          className={cn(
            "relative flex h-[140px] w-[168px] items-center justify-center overflow-hidden bg-[#f5f5f5]",
          )}
        >
          {/* Shimmer overlay */}
          <div className="animate-shimmer pointer-events-none absolute inset-0" />

          {product.image ? (
            <Image
              src={product.image}
              alt={product.title || ""}
              fill
              priority={priority}
              loading={priority ? undefined : "lazy"}
              fetchPriority={priority ? "high" : "low"}
              className="object-contain p-2 mix-blend-multiply"
              sizes="168px"
              quality={75}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5] text-sm text-[#767676]">
              Kein Bild
            </div>
          )}
        </div>

        {/* Efficiency Labels placeholder (empty in most cases) */}
        <div className="sr-resultItemTile__efficiencyLabels sr-resultItemTile__efficiencyLabels--LIST" />

        {/* ============================================ */}
        {/* INFO WRAPPER - sr-resultItemTile__infoWrapper */}
        {/* ============================================ */}
        <div className="sr-resultItemTile__infoWrapper flex flex-1 flex-col justify-center p-[15px]">
          {/* SUMMARY SECTION */}
          <div className="sr-resultItemTile__summary">
            <div className="sr-productSummary">
              {/* TITLE */}
              <div className="sr-resultItemLink">
                <div
                  className={cn(
                    "sr-productSummary__title sr-productSummary__title--LIST productSummary__title--categoryPage",
                    "mb-1 text-[14px] leading-[18px] font-bold text-[#2d2d2d]",
                  )}
                >
                  {displayModelTitle}
                  {displayVariantSuffix && !isHub && (
                    <span className="ml-1.5 font-bold">
                      {displayVariantSuffix}
                    </span>
                  )}
                </div>
              </div>

              {/* SUBTITLE (Variant Info) */}

              {/* DESCRIPTION */}
              <div
                className={cn(
                  "sr-productSummary__description sr-productSummary__description--LIST",
                  "sr-productSummary__description--categoryPage",
                  "mb-2 text-[14px] leading-[18px] text-[#2d2d2d]",
                )}
              >
                <span>
                  {!isHub && descriptionParts.length > 0 && (
                    <p className="sr-productSummary__mainDetails productSummary__mainDetails--categoryPage">
                      <span>{formatTechText(descriptionParts.join(", "))}</span>
                    </p>
                  )}
                  {!isHub &&
                    product.variationAttributes &&
                    hasUniqueVariation && (
                      <p className="mt-1 text-[11px] font-medium text-orange-600">
                        Version: {formatTechText(product.variationAttributes)}
                      </p>
                    )}
                  {product.isParentView &&
                    product.variantCount &&
                    product.variantCount > 1 && (
                      <p className="text-idealo-text-primary mt-1 text-[12px]">
                        {product.variantCount} Varianten
                      </p>
                    )}
                </span>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* PRODUCT DETAILS TRIGGER (LIST-specific wrapper) */}
          {/* ============================================ */}
          <div className="sr-resultItemTile__pioTrigger">
            <div className="sr-productInformationTrigger text-idealo-blue flex items-center gap-2 text-[13px] font-bold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="sr-productInformationTrigger__icon h-4 w-4 fill-current"
              >
                <path d="M24 1.5A1.5 1.5 0 0 0 22.5 0H15a1.5 1.5 0 0 0 0 3h3.855l-4.92 4.935a1.5 1.5 0 0 0 0 2.13 1.5 1.5 0 0 0 2.13 0L21 5.13V9a1.5 1.5 0 1 0 3 0zM10.065 13.935a1.5 1.5 0 0 0-2.13 0L3 18.855V15a1.5 1.5 0 0 0-3 0v7.5A1.5 1.5 0 0 0 1.5 24H9a1.5 1.5 0 1 0 0-3H5.13l4.935-4.935a1.5 1.5 0 0 0 0-2.13" />
              </svg>
              <span className="sr-productInformationTrigger__text">
                Produktdetails
              </span>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* PRICE INFO - sr-detailedPriceInfo--LIST */}
        {/* Positioned on the right side for list view */}
        {/* ============================================ */}
        <div className="sr-detailedPriceInfo sr-detailedPriceInfo--LIST flex shrink-0 flex-col items-end justify-center p-[15px]">
          {/* RATING */}
          <IdealoStarRating
            rating={product.rating || 4.5}
            reviewCount={product.reviewCount || 0}
            className="mb-2"
          />
          {product.listPrice && product.listPrice > (product.price || 0) && (
            <div className="text-idealo-text-secondary mb-0.5 text-[14px] line-through">
              {formatCurrency(product.listPrice, countryCode)}
            </div>
          )}
          <IdealoLivePrice
            productId={product.id!}
            countryCode={countryCode}
            initialPrice={product.price || 0}
            showAb={!!product.isParentView}
            className="text-primary text-[20px]"
            livePriceData={livePriceData}
          />
          {!!product.pricePerUnit && (
            <div className="text-idealo-text-secondary mt-1 text-right text-[12px]">
              ({formatCurrency(product.pricePerUnit, countryCode)} /{" "}
              {formatTechText(product.capacityUnit || "Einheit")})
            </div>
          )}
        </div>

        {/* BADGES */}
        <div className="sr-resultItemTile__badges absolute bottom-2 left-[200px] flex flex-wrap gap-1">
          {(product.savings ?? 0) > 0.05 && (
            <span className="rounded-[2px] bg-[#e10316] px-2 py-0.5 text-[11px] font-bold text-white">
              -{Math.round(product.savings! * 100)}%
            </span>
          )}
        </div>

        {/* TOP LEFT BADGE (Bestseller) */}
        {isProductBestseller(product) && (
          <div className="absolute top-0 left-0 z-10">
            <span className="inline-block rounded-br-sm bg-[#0066cc] px-2.5 py-1 text-[14px] font-bold text-white shadow-sm">
              Bestseller
            </span>
          </div>
        )}
      </PrefetchLink>
    </div>
  );
}
