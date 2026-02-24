/**
 * Idealo Grid Card Component
 *
 * Product card for Grid view, matching Idealo's exact HTML structure.
 *
 * Structure:
 * sr-resultItemTile_B0odU sr-resultItemTile--GRID_UHbpj
 * ├── sr-resultItemTile__buttons_kvQyr (wishlist heart)
 * ├── sr-resultItemTile__imageSection_aCeup (140x168 image)
 * ├── sr-resultItemTile__efficiencyLabels_cWzym (placeholder)
 * ├── sr-resultItemTile__infoWrapper_otTCK
 * │   ├── sr-resultItemTile__summary_t5DyK
 * │   │   ├── sr-productSummary_vCt4O > title + description
 * │   │   └── sr-productRating_cszy2 (stars)
 * │   ├── sr-detailedPriceInfo_ypbTl (price)
 * │   ├── sr-productInformationTrigger_dAYVx (Produktdetails)
 * │   └── sr-resultItemTile__badges_eYrH1 (Bestseller)
 */

import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { getCountryByCode, type CountryCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import Image from "next/image";

import { type LeanProduct } from "@/lib/types";
import { formatCurrency, formatTechText } from "@/lib/utils/formatting";
import { isProductBestseller } from "@/lib/utils/products";
import { IdealoLivePrice } from "../product/IdealoLivePrice";
import { IdealoStarRating } from "./IdealoStarRating";

interface IdealoGridCardProps {
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

export function IdealoGridCard({
  product,
  countryCode,
  className,
  priority = false,
  livePriceData,
}: IdealoGridCardProps) {
  const countryConfig = getCountryByCode(countryCode);

  // Build description parts
  const fullTitle = (
    product.subtitle ? `${product.title} ${product.subtitle}` : product.title
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

  return (
    <div
      className={cn(
        "sr-resultList__item",
        // Negative margins for overlapping borders (Idealo style)
        "-mr-px -mb-px",
        className,
      )}
    >
      <PrefetchLink
        href={`/p/${product.slug}`}
        className={cn(
          "sr-resultItemTile sr-resultItemTile--GRID",
          "relative flex h-full flex-col",
          "border border-[#b4b4b4] bg-white text-inherit no-underline hover:no-underline",
        )}
      >
        {/* Badge Area - top left */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {(product.savings ?? 0) >= 0.05 && (
            <div className="bg-primary rounded-sm px-2 py-1 text-[14px] font-extrabold tracking-tight text-white shadow-sm">
              -{Math.round(product.savings! * 100)}%
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* IMAGE SECTION - sr-resultItemTile__imageSection */}
        {/* Idealo: height:140px, width:168px */}
        {/* ============================================ */}
        <div
          className={cn(
            "relative flex h-[140px] items-center justify-center overflow-hidden bg-[#f5f5f5]",
          )}
        >
          {/* Shimmer overlay */}
          <div className="animate-shimmer pointer-events-none absolute inset-0" />

          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              priority={priority}
              loading={priority ? undefined : "lazy"}
              // @ts-ignore - fetchPriority is supported in Next.js 16/React 19
              fetchPriority={priority ? "high" : "low"}
              className="object-contain p-2 mix-blend-multiply"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 168px"
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
        <div className="sr-resultItemTile__efficiencyLabels sr-resultItemTile__efficiencyLabels--GRID" />

        {/* ============================================ */}
        {/* INFO WRAPPER - sr-resultItemTile__infoWrapper */}
        {/* ============================================ */}
        <div className="sr-resultItemTile__infoWrapper flex flex-1 flex-col p-[15px] pt-0">
          {/* SUMMARY SECTION */}
          <div className="sr-resultItemTile__summary flex-1">
            <div className="sr-productSummary">
              {/* TITLE */}
              <div className="sr-resultItemLink">
                <div
                  className={cn(
                    "sr-productSummary__title productSummary__title--GRID productSummary__title--categoryPage",
                    "mb-1 line-clamp-3 text-[14px] leading-[18px] font-bold hyphens-auto text-[#2d2d2d]",
                  )}
                >
                  {product.subtitle
                    ? product.title.replace(product.subtitle, "").trim()
                    : product.title}
                  {product.subtitle && (
                    <span className="ml-1.5 font-bold">{product.subtitle}</span>
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div
                className={cn(
                  "sr-productSummary__description productSummary__description--GRID",
                  "sr-productSummary__description--categoryPage",
                  "mb-2 text-[14px] leading-[18px] text-[#2d2d2d]",
                )}
              >
                <span>
                  <p className="sr-productSummary__mainDetails productSummary__mainDetails--categoryPage">
                    <span>{formatTechText(descriptionParts.join(", "))}</span>
                  </p>
                  {product.variationAttributes && hasUniqueVariation && (
                    <p className="mt-1 text-[11px] font-medium text-orange-600">
                      Version: {formatTechText(product.variationAttributes)}
                    </p>
                  )}
                  {product.isVariantGroup && (
                    <p className="text-idealo-text-primary mt-1 text-[12px]">
                      {product.variantCount} Varianten
                    </p>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* PRICE INFO - sr-detailedPriceInfo */}
          <div className="sr-detailedPriceInfo detailedPriceInfo--GRID mt-auto flex flex-col items-start">
            {/* RATING */}
            <IdealoStarRating
              rating={product.rating || 4.5}
              reviewCount={product.reviewCount || 0}
              className="mb-1.5"
            />
            {product.listPrice && product.listPrice > product.price && (
              <div className="text-idealo-text-secondary mb-0.5 text-[14px] line-through">
                {formatCurrency(product.listPrice, countryCode)}
              </div>
            )}
            <IdealoLivePrice
              productId={product.id!}
              countryCode={countryCode}
              initialPrice={product.price}
              showAb={product.isVariantGroup}
              className="text-primary text-[20px]"
              livePriceData={livePriceData}
            />
          </div>

          {/* ============================================ */}
          {/* PRODUCT DETAILS TRIGGER */}
          {/* ============================================ */}
          <div className="sr-productInformationTrigger text-idealo-blue mt-2 flex items-center gap-2 text-[13px] font-bold">
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

          {/* BADGES */}
          <div className="sr-resultItemTile__badges mt-2 flex flex-wrap gap-1">
            {isProductBestseller(product as any) && (
              <span className="rounded-[2px] bg-[#0066cc] px-2 py-0.5 text-[11px] font-bold text-white">
                Bestseller
              </span>
            )}
          </div>
        </div>
      </PrefetchLink>
    </div>
  );
}
