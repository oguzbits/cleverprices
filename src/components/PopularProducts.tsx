"use client";

import React from "react";
import { useCountry } from "@/hooks/use-country";
import { getCountryByCode } from "@/lib/countries";
import { ProductCard } from "@/components/product-card";
import { ProductUIModel } from "@/lib/amazon-api";
import { SectionHeader } from "@/components/SectionHeader";
import { Carousel, CarouselRef } from "@/components/Carousel";

interface PopularProductsProps {
  products: ProductUIModel[];
}

export function PopularProducts({ products }: PopularProductsProps) {
  const { country } = useCountry()
  const countryConfig = getCountryByCode(country)
  const [category, setCategory] = React.useState("all");
  const carouselRef = React.useRef<CarouselRef>(null);

  const filteredProducts = category === "all" 
    ? products 
    : products.filter(p => p.category.toLowerCase() === category.toLowerCase());

  // Extract numeric price per unit for comparison
  const productsWithUnitValue = filteredProducts.map(p => {
    const match = p.pricePerUnit?.match(/[\d.]+/);
    return {
      ...p,
      unitValue: match ? parseFloat(match[0]) : Infinity
    };
  });

  const minUnitValue = Math.min(...productsWithUnitValue.map(p => p.unitValue));
  const avgUnitValue = productsWithUnitValue.reduce((acc: number, p: { unitValue: number }) => acc + p.unitValue, 0) / (productsWithUnitValue.length || 1);

  const categories = [
    { label: "All Products", value: "all" },
    { label: "Hard Drives", value: "hard-drives" },
    { label: "RAM", value: "ram" }
  ];

  return (
    <section className="mb-16">
      <SectionHeader 
        title="Popular Products"
        description="The most-viewed products right now, analyzed and compared for total value."
        href={`/${country}/categories`}
        onScrollLeft={() => carouselRef.current?.scrollLeft()}
        onScrollRight={() => carouselRef.current?.scrollRight()}
        categories={categories}
        selectedCategory={category}
        onCategoryChange={setCategory}
      />

      <Carousel ref={carouselRef}>
        {productsWithUnitValue.map((product) => {
          let badgeText = undefined;
          if (product.unitValue === minUnitValue && minUnitValue !== Infinity) {
            badgeText = "Best Price";
          } else if (product.unitValue < avgUnitValue * 0.85 && product.unitValue !== Infinity) {
            badgeText = "Good Deal";
          }
          
          return (
            <ProductCard
              key={product.asin}
              title={product.title}
              price={product.price.amount}
              oldPrice={product.price.amount * 1.15}
              currency={countryConfig?.currency || "USD"}
              url={product.url}
              pricePerUnit={product.pricePerUnit}
              countryCode={country}
              badgeText={badgeText}
            />
          );
        })}
      </Carousel>
    </section>
  );
}
