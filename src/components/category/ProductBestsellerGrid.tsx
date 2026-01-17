/**
 * Product Bestseller Grid Component
 *
 * Idealo-style grid for displaying bestseller products on parent category pages.
 * Similar to the "Bestseller in Elektroartikel" section on idealo.de
 *
 * Now uses the same IdealoGridCard component from the category product pages
 * for consistent styling across the application.
 */

import { type CountryCode } from "@/lib/countries";
import { type LeanProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { IdealoGridCard } from "./IdealoGridCard";

interface ProductBestsellerGridProps {
  title: string;
  products: LeanProduct[];
  countryCode?: CountryCode;
  moreLink?: string;
  className?: string;
}

export function ProductBestsellerGrid({
  title,
  products,
  countryCode = "de",
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

      {/* Product Grid - Using IdealoGridCard for consistent styling */}
      <div className="grid grid-cols-2 gap-0 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.slice(0, 4).map((product, index) => (
          <IdealoGridCard
            key={product.slug}
            product={product}
            countryCode={countryCode}
            priority={index < 4}
          />
        ))}
      </div>
    </section>
  );
}
