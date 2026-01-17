/**
 * Idealo Product Carousel Component
 *
 * Reusable product carousel section for bestsellers, new products, etc.
 * Uses the existing IdealoProductCard component for individual cards.
 */

import { IdealoProductCard } from "@/components/landing/IdealoProductCard";
import { CarouselContainer } from "@/components/ui/CarouselContainer";
import { type CountryCode } from "@/lib/countries";
import { cn } from "@/lib/utils";

export interface CarouselProduct {
  title: string;
  price: number;
  slug: string;
  image?: string;
  rating?: number;
  ratingCount?: number;
  testRating?: number;
  testCount?: number;
  badgeText?: string;
  categoryName?: string;
  discountRate?: number;
  isBestseller?: boolean;
  variationAttributes?: string;
}

interface IdealoProductCarouselProps {
  title?: string;
  products: CarouselProduct[];
  className?: string;
  countryCode?: CountryCode;
  /** Enable priority loading for first 4 images (for above-the-fold carousels) */
  priorityImages?: boolean;
}

export function IdealoProductCarousel({
  title,
  products,
  className,
  countryCode,
  priorityImages = false,
}: IdealoProductCarouselProps) {
  if (products.length === 0) {
    return (
      <div className={cn("cn-productCarousel", "mb-8", className)}>
        {title && (
          <div className="cn-productCarousel__header mb-4">
            <h2 className="text-[20px] font-bold text-[#2d2d2d]">{title}</h2>
          </div>
        )}
        <div className="flex items-center justify-center rounded border border-[#e5e5e5] bg-[#f9f9f9] py-12 text-center">
          <p className="text-sm text-[#999]">Keine Produkte verfügbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("cn-productCarousel", "mb-8", className)}>
      {/* Section Header */}
      {title && (
        <div className="cn-productCarousel__header mb-4">
          <h2 className="text-[20px] font-bold text-[#2d2d2d]">{title}</h2>
        </div>
      )}

      {/* Product Carousel using native CSS snap via CarouselContainer */}
      <CarouselContainer>
        {products.map((product, index) => (
          <IdealoProductCard
            key={product.slug}
            title={product.title}
            price={product.price}
            slug={product.slug}
            image={product.image}
            rating={product.rating}
            ratingCount={product.ratingCount}
            testRating={product.testRating}
            testCount={product.testCount}
            badgeText={product.badgeText}
            categoryName={product.categoryName}
            discountRate={product.discountRate}
            isBestseller={product.isBestseller || (priorityImages && index < 4)}
            variationAttributes={product.variationAttributes}
            countryCode={countryCode}
          />
        ))}
      </CarouselContainer>
    </div>
  );
}
