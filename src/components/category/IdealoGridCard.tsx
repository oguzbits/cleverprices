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

"use client";

import { getCountryByCode, type CountryCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

import { type LeanProduct } from "@/lib/types";
import { formatCurrency, formatDisplayTitle } from "@/lib/utils/formatting";
import { LegalPrice } from "@/components/ui/LegalPrice";
import { IdealoWishlistHeart } from "./IdealoWishlistHeart";

interface IdealoGridCardProps {
  product: LeanProduct;
  countryCode: CountryCode;
  className?: string;
}

export function IdealoGridCard({
  product,
  countryCode,
  className,
}: IdealoGridCardProps) {
  const countryConfig = getCountryByCode(countryCode);

  // Build description parts
  const descriptionParts = [
    product.capacity && product.capacityUnit
      ? `${product.capacity} ${product.capacityUnit}`
      : null,
    product.formFactor,
  ].filter(Boolean);

  return (
    <div
      className={cn(
        "sr-resultList__item",
        // Negative margins for overlapping borders (Idealo style)
        "-mr-px -mb-px",
        className,
      )}
    >
      <div
        className={cn(
          "sr-resultItemTile sr-resultItemTile--GRID",
          "relative flex h-full flex-col",
          "border border-[#b4b4b4] bg-white",
        )}
      >
        {/* ============================================ */}
        {/* IMAGE SECTION - sr-resultItemTile__imageSection */}
        {/* Idealo: height:140px, width:168px */}
        {/* ============================================ */}
        <Link href={`/p/${product.slug}`} className="block">
          <div
            className={cn(
              "sr-resultItemTile__imageSection resultItemTile__imageSection--GRID",
              "relative flex h-[140px] items-center justify-center bg-white",
            )}
          >
            {product.image ? (
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-contain p-2"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 168px"
                style={{ objectFit: "contain" }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5] text-sm text-[#767676]">
                Kein Bild
              </div>
            )}
          </div>
        </Link>

        {/* Efficiency Labels placeholder (empty in most cases) */}
        <div className="sr-resultItemTile__efficiencyLabels sr-resultItemTile__efficiencyLabels--GRID" />

        {/* ============================================ */}
        {/* INFO WRAPPER - sr-resultItemTile__infoWrapper */}
        {/* ============================================ */}
        <div className="sr-resultItemTile__infoWrapper flex flex-1 flex-col p-[15px] pt-0">
          {/* SUMMARY SECTION */}
          <div className="sr-resultItemTile__summary flex-1">
            <div className="sr-productSummary">
              {/* TITLE LINK */}
              <div className="sr-resultItemLink">
                <Link
                  href={`/p/${product.slug}`}
                  className="no-underline hover:no-underline"
                >
                  <div
                    className={cn(
                      "sr-productSummary__title productSummary__title--GRID productSummary__title--categoryPage",
                      "mb-1 line-clamp-3 text-[14px] leading-[18px] font-bold hyphens-auto text-[#2d2d2d]",
                    )}
                  >
                    {formatDisplayTitle(product.title)}
                  </div>
                </Link>
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
                    <span>{descriptionParts.join(", ")}</span>
                  </p>
                  {product.variationAttributes && (
                    <p className="mt-1 text-[11px] font-medium text-orange-600">
                      Version: {product.variationAttributes}
                    </p>
                  )}
                </span>
              </div>
            </div>

            {/* RATING */}
            <div className="sr-productRating mb-3 flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    className={cn(
                      "h-3.5 w-3.5",
                      (product.rating || 4.5) >= s
                        ? "fill-[#ff9900] text-[#ff9900]"
                        : "fill-[#e5e5e5] text-[#e5e5e5]",
                    )}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-[12px] text-[#767676]">
                ({product.reviewCount || 0})
              </span>
            </div>
          </div>

          {/* ============================================ */}
          {/* PRICE INFO - sr-detailedPriceInfo */}
          {/* ============================================ */}
          <div className="sr-detailedPriceInfo detailedPriceInfo--GRID mt-auto">
            <LegalPrice
              price={product.price}
              showAb
              priceClassName="text-[20px] text-[#f97316]"
            />
            {product.pricePerUnit && (
              <div className="mt-1 text-right text-[12px] text-[#767676]">
                ({formatCurrency(product.pricePerUnit, countryCode)} /{" "}
                {product.capacityUnit || "Einheit"})
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* PRODUCT DETAILS TRIGGER */}
          {/* ============================================ */}
          <Link
            href={`/p/${product.slug}`}
            className="sr-productInformationTrigger mt-2 flex items-center gap-0.5 text-[13px] font-bold text-[#0771d0] no-underline hover:no-underline"
          >
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
          </Link>

          {/* BADGES */}
          {product.salesRank && product.salesRank < 10000 && (
            <div className="sr-resultItemTile__badges mt-2">
              <span className="rounded-[2px] bg-[#0066cc] px-2 py-0.5 text-[11px] font-bold text-white">
                Bestseller
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
