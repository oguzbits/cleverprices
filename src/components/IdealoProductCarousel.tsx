import { CarouselContainer } from "@/components/CarouselContainer";
import { IdealoProductCard } from "@/components/landing/IdealoProductCard";
import { type CountryCode } from "@/lib/countries";
import { cn } from "@/lib/utils";

export interface CarouselProduct {
  id?: number; // DB ID for live price fetching
  title: string;
  subtitle?: string;
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
  isVariantGroup?: boolean;
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
    <CarouselContainer title={title} className={className}>
      {products.map((product, index) => (
        <IdealoProductCard
          key={product.slug}
          id={product.id}
          title={product.title}
          subtitle={product.subtitle}
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
          isVariantGroup={product.isVariantGroup}
          countryCode={countryCode}
          priorityLoad={priorityImages && index < 2}
        />
      ))}
    </CarouselContainer>
  );
}
