import { getCountryByCode, type CountryCode } from "@/lib/countries";
import { LocalizedProduct } from "@/lib/server/category-products";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatting";
import Image from "next/image";
import Link from "next/link";
import { IdealoStarRating } from "./IdealoStarRating";

interface ProductGridProps {
  products: LocalizedProduct[];
  countryCode: CountryCode;
}

export function ProductGrid({ products, countryCode }: ProductGridProps) {
  const countryConfig = getCountryByCode(countryCode);

  return (
    <div className="-mx-px grid auto-rows-fr grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <Link
          key={product.id || product.slug}
          href={`/p/${product.slug.includes("_-") ? product.slug : `${(product.isVariantGroup ? 900000000 : 200000000) + (product.id || 0)}_-${product.slug}`}`}
          className={cn(
            "group relative -mr-px -mb-px flex flex-col border border-[#b4b4b4] bg-white no-underline transition-shadow hover:z-10 hover:shadow-lg",
          )}
        >
          {/* Badge Area - top left */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {product.savings >= 0.05 && (
              <div className="bg-primary rounded-sm px-2 py-1 text-[14px] font-extrabold tracking-tight text-white shadow-sm">
                -{Math.round(product.savings * 100)}%
              </div>
            )}
          </div>

          {/* Image - using aspect ratio for natural sizing */}
          <div className="relative aspect-4/3 w-full bg-white">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-contain p-3"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-300">
                <span className="text-base">Kein Bild</span>
              </div>
            )}
          </div>

          {/* Content - flex-1 to push price to bottom */}
          <div className="flex flex-1 flex-col p-4">
            {/* Title - 14px for readability */}
            <h3 className="mb-1.5 line-clamp-2 text-[14px] leading-snug font-normal text-[#0066cc]">
              {product.title}
            </h3>

            {/* Specs - 13px */}
            <p className="mb-2 line-clamp-1 text-[13px] text-zinc-500">
              {product.capacity} {product.capacityUnit} • {product.formFactor}
            </p>

            {/* Price section - pushed to bottom with mt-auto */}
            <div className="mt-auto flex flex-col items-start">
              {/* Rating */}
              <IdealoStarRating
                rating={product.rating || 4.5}
                reviewCount={product.reviewCount || 0}
                className="mb-1.5"
              />

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-[13px] text-zinc-400">ab</span>
                <span className="text-[18px] font-bold text-[#f97316]">
                  {formatCurrency(product.price, countryCode)}
                </span>
              </div>
            </div>

            {/* Produktdetails link - 13px */}
            <div className="mt-2 text-[13px] text-[#0066cc]">
              Produktdetails
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
