import { Carousel, CarouselRef } from "@/components/Carousel";
import { IdealoProductCard } from "@/components/landing/IdealoProductCard";
import { type CountryCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

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
  /** Enable priority loading for first images (count depends on viewport) */
  priorityImages?: boolean;
}

export function IdealoProductCarousel({
  title,
  products,
  className,
  countryCode,
  priorityImages = false,
}: IdealoProductCarouselProps) {
  const carouselRef = useRef<CarouselRef>(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  if (products.length === 0) {
    return (
      <div className={cn("cn-productCarousel", className)}>
        {title && (
          <div className="cn-productCarousel__header mb-4">
            <h2 className="text-idealo-text-primary text-[20px] font-bold">
              {title}
            </h2>
          </div>
        )}
        <div className="border-border bg-secondary flex items-center justify-center rounded border py-12 text-center">
          <p className="text-muted-foreground text-sm">
            Keine Produkte verfügbar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("cn-productCarousel group/carousel relative", className)}
    >
      {/* Section Header */}
      {title && (
        <div className="cn-productCarousel__header mb-4">
          <h2 className="text-idealo-text-primary text-[20px] font-bold">
            {title}
          </h2>
        </div>
      )}

      {/* Navigation Buttons */}
      <button
        onClick={() => carouselRef.current?.scrollLeft()}
        disabled={!scrollState.canScrollLeft}
        className={cn(
          "absolute top-1/2 left-0 z-10 -translate-y-1/2",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
          "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
          !scrollState.canScrollLeft && "pointer-events-none opacity-0!",
          title ? "mt-4" : "", // Adjust for header height approximation if needed, though usually centering on content is better.
          // Actually, centering on the *cards* (excluding header) is better handled by placing buttons inside a relative container wrapping just the carousel.
        )}
        style={{ marginTop: title ? "24px" : "0" }} // Rough adjustment to center on cards, not header
        aria-label="Vorherige"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={() => carouselRef.current?.scrollRight()}
        disabled={!scrollState.canScrollRight}
        className={cn(
          "absolute top-1/2 right-0 z-10 -translate-y-1/2",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
          "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
          !scrollState.canScrollRight && "pointer-events-none opacity-0!",
          title ? "mt-4" : "",
        )}
        style={{ marginTop: title ? "24px" : "0" }}
        aria-label="Nächste"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Product Carousel */}
      <Carousel
        ref={carouselRef}
        onScrollStateChange={setScrollState}
        className="-mx-4 px-4 sm:mx-0 sm:px-0" // Undo negative margins from Carousel if needed, or adjust
      >
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
            isBestseller={product.isBestseller}
            variationAttributes={product.variationAttributes}
            countryCode={countryCode}
            priorityLoad={priorityImages && index < 2}
          />
        ))}
      </Carousel>
    </div>
  );
}
