import { getCountryByCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatting";
import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface ProductCardProps {
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
}

export function ProductCard({
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
            sizes="224px"
            quality={85}
            priority={priority}
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

        {/* Rating row like Idealo - Note score + stars + count */}
        <div className="mb-3 flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-zinc-600">Note ∅ 1,5</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-3 w-3 fill-[#f97316] text-[#f97316]" />
            ))}
          </div>
          <span className="text-zinc-400">8</span>
        </div>

        <div className="mt-auto">
          {/* Price - "ab" prefix with ORANGE price like Idealo */}
          <div className="flex items-baseline gap-1">
            <span className="text-[12px] font-semibold text-zinc-500">ab</span>
            <span className="text-[18px] font-bold text-[#f97316]">
              {formatCurrency(price, countryCode)}
            </span>
          </div>

          {/* Produktdetails link at bottom - blue link like Idealo */}
          <div className="mt-2 flex items-center gap-0.5 text-[11px] font-semibold text-[#0066cc]">
            <span className="hover:underline">Produktdetails</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
