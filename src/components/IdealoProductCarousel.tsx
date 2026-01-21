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
    <div className={cn("cn-productCarousel", className)}>
      {/* Section Header */}
      {title && (
        <div className="cn-productCarousel__header mb-4">
          <h2 className="text-idealo-text-primary text-[20px] font-bold">
            {title}
          </h2>
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
            isBestseller={product.isBestseller}
            variationAttributes={product.variationAttributes}
            countryCode={countryCode}
            priorityLoad={priorityImages && index < 2}
          />
        ))}
      </CarouselContainer>
    </div>
  );
}
