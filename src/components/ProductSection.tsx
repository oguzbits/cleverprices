"use client";

import React, { useRef } from "react";
import { useCountry } from "@/hooks/use-country";
import { getCountryByCode } from "@/lib/countries";
import { ProductCard } from "@/components/product-card";
import { ProductUIModel } from "@/lib/amazon-api";
import { SectionHeader } from "@/components/SectionHeader";
import { Carousel, CarouselRef } from "@/components/Carousel";
import { parseUnitValue, calculateProductBadges } from "@/lib/utils/products";

interface ProductSectionProps {
  title: string;
  description: string;
  products: ProductUIModel[];
  categories?: { label: string; value: string }[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  children?: React.ReactNode;
  productCardProps?: Partial<React.ComponentProps<typeof ProductCard>>;
  priorityIndices?: number[];
}

export function ProductSection({
  title,
  description,
  products,
  categories,
  selectedCategory,
  onCategoryChange,
  children,
  productCardProps,
  priorityIndices
}: ProductSectionProps) {
  const { country } = useCountry();
  const countryConfig = getCountryByCode(country);
  const carouselRef = useRef<CarouselRef>(null);
  const [scrollState, setScrollState] = React.useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  const filteredProducts = !onCategoryChange || !selectedCategory || selectedCategory === "all"
    ? products
    : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  const processedProducts = calculateProductBadges(
    filteredProducts.map(p => ({
      ...p,
      unitValue: parseUnitValue(p.pricePerUnit)
    }))
  );

  return (
    <section className="mb-16">
      <SectionHeader 
        title={title}
        description={description}
        href={`/${country}/categories`}
        onScrollLeft={() => carouselRef.current?.scrollLeft()}
        onScrollRight={() => carouselRef.current?.scrollRight()}
        canScrollLeft={scrollState.canScrollLeft}
        canScrollRight={scrollState.canScrollRight}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
      />

      {children}

      <Carousel 
        ref={carouselRef}
        onScrollStateChange={setScrollState}
      >
        {processedProducts.map((product, index) => (
          <ProductCard
            key={product.asin}
            title={product.title}
            price={product.price.amount}
            currency={countryConfig?.currency || "USD"}
            url={product.url}
            image={product.image}
            pricePerUnit={product.pricePerUnit}
            countryCode={country}
            badgeText={product.badgeText}
            priority={priorityIndices?.includes(index)}
            {...productCardProps}
          />
        ))}
      </Carousel>
    </section>
  );
}

