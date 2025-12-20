"use client";

import React from "react";
import { useCountry } from "@/hooks/use-country";
import { getCountryByCode } from "@/lib/countries";
import { ProductCard } from "@/components/product-card";
import { ProductUIModel } from "@/lib/amazon-api";
import { SectionHeader } from "@/components/SectionHeader";
import { Carousel, CarouselRef } from "@/components/Carousel";

interface PriceDropsProps {
  products: (ProductUIModel & { dropPercentage: number; oldPrice: number })[];
}

export function PriceDrops({ products }: PriceDropsProps) {
  const { country } = useCountry();
  const countryConfig = getCountryByCode(country);
  const [period, setPeriod] = React.useState<"daily" | "weekly">("daily");
  const [category, setCategory] = React.useState("all");
  const carouselRef = React.useRef<CarouselRef>(null);

  const filteredProducts = products.filter(p => {
    const categoryMatch = category === "all" || p.category.toLowerCase() === category.toLowerCase();
    return categoryMatch;
  }).sort((a, b) => 
    period === "daily" ? b.dropPercentage - a.dropPercentage : a.dropPercentage - b.dropPercentage
  );

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
        title="Top Amazon Price Drops"
        description="The products below have seen significant price drops since the last update. Save big by choosing these vetted deals."
        href={`/${country}/categories`}
        onScrollLeft={() => carouselRef.current?.scrollLeft()}
        onScrollRight={() => carouselRef.current?.scrollRight()}
        categories={categories}
        selectedCategory={category}
        onCategoryChange={setCategory}
      />

      <div className="flex gap-2 mb-6 -mt-2">
        <button
          onClick={() => setPeriod("daily")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl border transition-all duration-300 cursor-pointer ${
            period === "daily" 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "bg-background text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5"
          }`}
        >
          Daily Drops
        </button>
        <button
          onClick={() => setPeriod("weekly")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl border transition-all duration-300 cursor-pointer ${
            period === "weekly" 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "bg-background text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5"
          }`}
        >
          Weekly Drops
        </button>
      </div>

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
              oldPrice={product.oldPrice}
              currency={countryConfig?.currency || "USD"}
              url={product.url}
              pricePerUnit={product.pricePerUnit}
              countryCode={country}
              badgeText={badgeText}
              condition="New"
            />
          );
        })}
      </Carousel>
    </section>
  );
}
