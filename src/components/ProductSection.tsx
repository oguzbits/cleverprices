import { ProductCard } from "@/components/product-card";
import { CarouselWithNav } from "@/components/ui/CarouselWithNav";
import { getCountryByCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { calculateProductBadges, parseUnitValue } from "@/lib/utils/products";
import { Product } from "@/types";
import React from "react";

interface ProductSectionProps {
  title: string;
  description: string;
  products: Product[];
  country: string;
  children?: React.ReactNode;
  productCardProps?: Partial<React.ComponentProps<typeof ProductCard>>;
  priorityIndices?: number[];
}

/**
 * Server Component for a product section with a carousel.
 * Leverages CarouselWithNav for interactivity while keeping ProductCard on the server.
 */
export function ProductSection({
  title,
  description,
  products,
  country,
  children,
  productCardProps,
  priorityIndices,
}: ProductSectionProps) {
  const countryConfig = getCountryByCode(country);

  const processedProducts = calculateProductBadges(
    products.map((p) => ({
      ...p,
      unitValue: parseUnitValue(p.pricePerUnit),
    })),
  );

  return (
    <section className={cn("mb-8 md:mb-10")}>
      {/* Section Header - Title only */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-zinc-900 md:text-xl">{title}</h2>
      </div>

      {children}

      <CarouselWithNav>
        {processedProducts.map((product, index) => (
          <ProductCard
            key={product.asin}
            id={product.id}
            title={product.title}
            price={product.price.amount}
            currency={countryConfig?.currency || "USD"}
            slug={product.slug}
            image={product.image}
            pricePerUnit={product.pricePerUnit}
            countryCode={country}
            badgeText={product.badgeText}
            priority={priorityIndices?.includes(index)}
            rating={product.rating}
            reviewCount={product.reviewCount}
            {...productCardProps}
          />
        ))}
      </CarouselWithNav>
    </section>
  );
}
