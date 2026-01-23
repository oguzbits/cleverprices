import { getCountryByCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatting";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { IdealoStarRating } from "./category/IdealoStarRating";
import {
  IdealoLivePrice,
  IdealoLivePriceSkeleton,
} from "./product/IdealoLivePrice";

export interface ProductCardProps {
  id?: number; // DB ID for live price fetching
  title: string;
  price: number;
  currency: string;
  slug: string;
  pricePerUnit?: string;
  countryCode?: string;
  image?: string;
  className?: string;
  priority?: boolean;
  badgeText?: string;
  brand?: string;
  specs?: string;
  rating?: number;
  reviewCount?: number;
}

export function ProductCard({
  id,
  title,
  price,
  currency,
  slug,
  pricePerUnit,
  countryCode = "de",
  image,
  className,
  priority = false,
  badgeText,
  brand,
  specs,
  rating,
  reviewCount,
}: ProductCardProps) {
  const countryConfig = getCountryByCode(countryCode);

  // Navigate to product page, NOT affiliate link
  const productUrl = `/p/${slug}`;

  return (
    <Link
      href={productUrl}
      className={cn(
        // Idealo card: 224px width, white bg, 6px radius, subtle border
        "group relative flex h-full w-[224px] flex-col overflow-hidden rounded-[6px] border border-[#dcdcdc] bg-white no-underline transition-all hover:border-zinc-400 hover:shadow-lg",
        className,
      )}
    >
      {/* Badge - top left on image like Idealo (blue for Bestseller) */}
      {badgeText && (
        <div className="absolute top-2 left-2 z-10 rounded-sm bg-[#0066cc] px-2 py-0.5 text-[10px] font-bold text-white">
          {badgeText}
        </div>
      )}

      {/* Wishlist heart - top right like Idealo */}
      <button
        className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-400 shadow-sm transition-colors hover:bg-white hover:text-[#f97316]"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // TODO: Add to wishlist
        }}
        aria-label="Zur Merkliste hinzufügen"
      >
        <Heart className="h-4 w-4" />
      </button>

      {/* Image Container - larger padding like Idealo */}
      <div className="relative flex aspect-square w-full items-center justify-center bg-white p-6">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain p-4"
            sizes="(max-width: 600px) 128px, 192px"
            quality={30}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            // @ts-ignore - fetchPriority is supported in Next.js 16/React 19
            fetchPriority={priority ? "high" : "low"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-300">
            <span className="text-sm">Kein Bild</span>
          </div>
        )}
      </div>

      {/* Content - matching Idealo layout */}
      <div className="flex flex-1 flex-col p-3 pt-0 text-left">
        {/* Title - bold, slightly larger */}
        <h3 className="mb-1.5 line-clamp-2 text-[13px] leading-tight font-bold text-zinc-900">
          {title}
        </h3>

        {/* Specs line - small grey text like Idealo */}
        {specs && (
          <p className="mb-2 line-clamp-2 text-[11px] leading-snug text-zinc-500">
            {specs}
          </p>
        )}

        <div className="mt-auto flex flex-col items-start">
          {/* Rating row - Even smaller black stars in a light grey pill */}
          {(rating || reviewCount) && (
            <IdealoStarRating
              rating={rating}
              reviewCount={reviewCount}
              className="mb-2"
            />
          )}

          {/* Price - "ab" prefix with ORANGE price like Idealo */}
          <Suspense
            fallback={<IdealoLivePriceSkeleton className="h-[27px] w-24" />}
          >
            {id ? (
              <IdealoLivePrice
                productId={id}
                countryCode={countryCode as any}
                initialPrice={price}
                className="text-[18px] font-bold text-[#f97316]"
                showAb={true}
              />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-[12px] font-semibold text-zinc-500">
                  ab
                </span>
                <span className="text-[18px] font-bold text-[#f97316]">
                  {formatCurrency(price, countryCode)}
                </span>
              </div>
            )}
          </Suspense>
        </div>
        <div className="mt-2 flex items-center gap-0.5 text-[11px] font-semibold text-[#0066cc]">
          <span>Produktdetails</span>
        </div>
      </div>
    </Link>
  );
}
