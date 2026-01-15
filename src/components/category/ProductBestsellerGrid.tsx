/**
 * Product Bestseller Grid Component
 *
 * Idealo-style grid for displaying bestseller products on parent category pages.
 * Similar to the "Bestseller in Elektroartikel" section on idealo.de
 */

"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, formatDisplayTitle } from "@/lib/utils/formatting";
import Image from "next/image";
import Link from "next/link";

export interface BestsellerProduct {
  title: string;
  price: number;
  slug: string;
  image?: string;
  brand?: string;
  category?: string;
  offerCount?: number;
}

interface ProductBestsellerGridProps {
  title: string;
  products: BestsellerProduct[];
  moreLink?: string;
  className?: string;
}

function BestsellerTile({ product }: { product: BestsellerProduct }) {
  return (
    <Link
      href={`/p/${product.slug}`}
      className={cn(
        "group flex flex-col rounded-lg bg-white p-4 no-underline",
        "transition-shadow duration-200 hover:shadow-md",
        "border border-[#e5e5e5] hover:border-[#0066cc]",
      )}
    >
      {/* Product Image */}
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-md bg-[#f9f9f9]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <span className="text-xs">Kein Bild</span>
          </div>
        )}
      </div>

      {/* Product Title */}
      <h3 className="mb-2 line-clamp-2 min-h-10 text-[14px] leading-tight font-medium text-[#2d2d2d]">
        {formatDisplayTitle(product.title)}
      </h3>

      {/* Brand */}
      {product.brand && (
        <span className="mb-2 text-[12px] text-[#666]">{product.brand}</span>
      )}

      {/* Offer Count */}
      {product.offerCount && product.offerCount > 0 && (
        <span className="mb-1 text-[12px] text-[#666]">
          {product.offerCount}{" "}
          {product.offerCount === 1 ? "Angebot" : "Angebote"}
        </span>
      )}

      {/* Price */}
      <div className="mt-auto flex items-baseline gap-1 pt-2">
        <span className="text-[12px] text-[#666]">ab</span>
        <span className="text-[18px] font-bold text-[#ff6600]">
          {formatCurrency(product.price, "de")}
        </span>
      </div>
    </Link>
  );
}

export function ProductBestsellerGrid({
  title,
  products,
  moreLink,
  className,
}: ProductBestsellerGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-3", className)}>
      {/* Section Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[20px] font-bold text-[#2d2d2d]">{title}</h2>
        {moreLink && (
          <Link
            href={moreLink}
            className="text-[14px] font-medium text-[#0066cc] hover:underline"
          >
            Alle anzeigen
          </Link>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.map((product) => (
          <BestsellerTile key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
