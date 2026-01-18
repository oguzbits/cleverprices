"use client";

import { Carousel, CarouselRef } from "@/components/Carousel";
import { ProductCard } from "@/components/product-card";
import { Product } from "@/types";
import { getCountryByCode } from "@/lib/countries";
import { calculateProductBadges, parseUnitValue } from "@/lib/utils/products";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductSectionProps {
  title: string;
  description: string;
  products: Product[];
  country: string;
  children?: React.ReactNode;
  productCardProps?: Partial<React.ComponentProps<typeof ProductCard>>;
  priorityIndices?: number[];
}

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
  const carouselRef = useRef<CarouselRef>(null);
  const [scrollState, setScrollState] = React.useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

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

      {/* Carousel with Navigation */}
      <div className="group/carousel relative">
        {/* Left Navigation Button */}
        <button
          onClick={() => carouselRef.current?.scrollLeft()}
          disabled={!scrollState.canScrollLeft}
          className={cn(
            "absolute top-1/2 left-0 z-10 -translate-y-1/2",
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
            "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
            !scrollState.canScrollLeft && "pointer-events-none opacity-0!",
          )}
          aria-label="Vorherige"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Right Navigation Button */}
        <button
          onClick={() => carouselRef.current?.scrollRight()}
          disabled={!scrollState.canScrollRight}
          className={cn(
            "absolute top-1/2 right-0 z-10 -translate-y-1/2",
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-[#6b6b6b] text-white hover:bg-[#5a5a5a]",
            "opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100",
            !scrollState.canScrollRight && "pointer-events-none opacity-0!",
          )}
          aria-label="Nächste"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <Carousel
          ref={carouselRef}
          onScrollStateChange={setScrollState}
          className="px-6"
        >
          {processedProducts.map((product, index) => (
            <ProductCard
              key={product.asin}
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
        </Carousel>
      </div>
    </section>
  );
}
