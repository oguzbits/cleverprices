import Image from "next/image";

import { IdealoLivePrice } from "@/components/product/IdealoLivePrice";
import { LegalPrice } from "@/components/ui/LegalPrice";
import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { CountryCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { getProductPath } from "@/lib/utils/url";

import { IdealoStarRating } from "../category/IdealoStarRating";

export interface LivePriceData {
  price: number | null;
  usedPrice: number | null;
  warehousePrice: number | null;
}

interface IdealoProductCardProps {
  id?: number; // DB ID for live price fetching
  title: string;
  subtitle?: string;
  price: number;
  currency?: string;
  slug: string;
  image?: string | null;
  rating?: number | null; // Community Rating (Stars)
  ratingCount?: number | null; // Community Review Count
  testRating?: number; // Professional "Note" (e.g. 1.0 - 6.0)
  testCount?: number; // Number of tests
  badgeText?: string;
  categoryName?: string;
  discountRate?: number;
  isBestseller?: boolean;
  isVariantGroup?: boolean;
  countryCode?: string;
  priorityLoad?: boolean;
  livePriceData?: LivePriceData;
}

export function IdealoProductCard({
  id,
  title,
  subtitle,
  price,
  slug,
  image,
  rating,
  ratingCount,
  testRating,
  testCount,
  badgeText,
  categoryName,
  discountRate,
  isBestseller,
  countryCode = "de",
  priorityLoad = false,
  livePriceData,
}: IdealoProductCardProps) {
  const href = getProductPath(id, slug);
  return (
    <div className="group border-idealo-border relative flex h-[272px] w-[164px] shrink-0 snap-start flex-col overflow-hidden rounded-[6px] border bg-white sm:h-[327px] sm:w-[224px]">
      <PrefetchLink
        href={href}
        className="flex h-full w-full flex-col no-underline"
      >
        {/* Badges Area - top left */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {discountRate && discountRate > 0 ? (
            <div className="bg-primary rounded-sm px-2 py-1 text-[14px] font-extrabold tracking-tight text-white shadow-sm">
              -{discountRate}%
            </div>
          ) : null}
          {badgeText && (!discountRate || discountRate === 0) ? (
            <div className="bg-primary rounded-sm px-2 py-1 text-[14px] font-extrabold tracking-tight text-white shadow-sm">
              {badgeText}
            </div>
          ) : null}
        </div>

        {/* Image Container */}
        <div className="mb-3 bg-gray-100 p-[4px_8px] sm:p-[4px_12px]">
          <div className="relative h-[115px] w-full overflow-hidden sm:h-[158px]">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 600px) 128px, 192px"
                quality={75}
                priority={priorityLoad}
                fetchPriority={priorityLoad ? "high" : "auto"}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
                <span className="text-xs italic">Kein Bild</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Container */}
        <div className="flex flex-1 flex-col p-[4px_8px] sm:p-[8px_12px]">
          {/* Category Info */}
          <div className="mb-1 flex items-center gap-1.5 overflow-hidden">
            {isBestseller ? (
              <div className="bg-idealo-blue shrink-0 rounded-[2px] px-2 py-1 text-[14px] font-extrabold tracking-tight text-white">
                Bestseller
              </div>
            ) : null}
            {categoryName && categoryName !== "uncategorized" ? (
              <span
                className={cn(
                  "truncate text-[14px] text-gray-500",
                  isBestseller && "font-medium",
                )}
              >
                {isBestseller ? "in " : ""}
                {categoryName}
              </span>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="mb-0.5 line-clamp-2 max-h-[44px] text-[16px] leading-tight font-semibold text-gray-900">
            {subtitle ? title.replace(subtitle, "").trim() : title}
            {subtitle && <span className="ml-1.5 font-bold">{subtitle}</span>}
          </h3>

          {/* Professional Rating (Note) */}
          {typeof testRating === "number" && testRating > 0 ? (
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#00a651]">
              <span>Note Ø {testRating.toFixed(1).replace(".", ",")}</span>
              {testCount ? (
                <span className="text-[10px] font-normal text-gray-400">
                  ({testCount} Test{testCount === 1 ? "" : "s"})
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto flex flex-col items-start gap-1">
            {/* Community Rating (Stars) - Even Smaller Pill Style */}
            {typeof rating === "number" && rating > 0 ? (
              <IdealoStarRating
                rating={rating}
                reviewCount={ratingCount}
                className="mb-1.5"
              />
            ) : null}

            {/* Price Display: Live (Server Component) or Static */}
            {id ? (
              <IdealoLivePrice
                productId={id}
                countryCode={countryCode as CountryCode}
                initialPrice={price}
                showAb
                className="text-primary text-[20px] leading-none font-bold"
                livePriceData={livePriceData}
              />
            ) : (
              <LegalPrice
                price={price}
                countryCode={countryCode}
                showAb
                priceClassName="text-[20px] text-primary"
              />
            )}
          </div>
        </div>
      </PrefetchLink>
    </div>
  );
}
