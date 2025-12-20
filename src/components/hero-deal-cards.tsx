"use client"

import { Badge } from "@/components/ui/badge"
import { useCountry } from "@/hooks/use-country"
import { getCountryByCode } from "@/lib/countries"
import { ProductCard } from "@/components/product-card"
import { getAllProducts, getAffiliateRedirectPath, type Product } from "@/lib/product-registry"



type ProductWithDiscount = Product & {
  discount: number
}

// Calculate discount percentage based on market average or typical retail price
const calculateDiscount = (product: Product): number => {
  // Typical market prices per unit (TB for storage, GB for RAM)
  const marketPrices: Record<Product['technology'], number> = {
    'SSD': 120, // Average $/TB
    'HDD': 25,  // Average $/TB
    'SAS': 30,  // Average $/TB
    'DDR4': 10, // Average $/GB
    'DDR5': 15  // Average $/GB
  }
  
  const marketPrice = marketPrices[product.technology]
  const currentPrice = (product.technology === 'DDR4' || product.technology === 'DDR5')
    ? (product.pricePerGB || 0)
    : (product.pricePerTB || 0)

  if (marketPrice === 0 || currentPrice === 0) return 0
  
  const discount = Math.round(((marketPrice - currentPrice) / marketPrice) * 100)
  return Math.max(0, Math.min(discount, 99)) // Clamp between 0-99%
}

// Get the top 3 deals based on discount percentage
const getTopDeals = (): ProductWithDiscount[] => {
  const allProducts = getAllProducts()
  return allProducts
    .map(product => ({
      ...product,
      discount: calculateDiscount(product)
    }))
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 3)
}

import React, { useRef } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { Carousel, CarouselRef } from "@/components/Carousel";

export function HeroDealCards() {
  const { country } = useCountry();
  const countryConfig = getCountryByCode(country);
  const carouselRef = useRef<CarouselRef>(null);

  const highlightedDeals = getTopDeals();

  // Products already come with discount info, but we also want unit price badges
  const productsWithUnitValue = highlightedDeals.map(p => {
    const isRAM = p.category === 'ram';
    const val = isRAM ? p.pricePerGB : p.pricePerTB;
    return {
      ...p,
      unitValue: val || Infinity,
      unitLabel: isRAM ? 'GB' : 'TB'
    };
  });

  const minUnitValue = Math.min(...productsWithUnitValue.map(p => p.unitValue));
  const avgUnitValue = productsWithUnitValue.reduce((acc, p) => acc + p.unitValue, 0) / (productsWithUnitValue.length || 1);

  return (
    <section className="mb-16">
      <SectionHeader 
        title="Highlighted Deals"
        description="These are outstanding deals we've found and feel are worth sharing."
        href={`/${country}/categories`}
        onScrollLeft={() => carouselRef.current?.scrollLeft()}
        onScrollRight={() => carouselRef.current?.scrollRight()}
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
              key={product.id || product.asin}
              title={product.title}
              price={product.price}
              oldPrice={product.price * (1 + product.discount / 100)}
              currency={countryConfig?.currency || "USD"}
              url={getAffiliateRedirectPath(product.slug)}
              pricePerUnit={product.unitValue !== Infinity ? `${countryConfig?.symbol || "$"}${product.unitValue.toFixed(2)}/${product.unitLabel}` : undefined}
              countryCode={country}
              badgeText={badgeText}
            />
          );
        })}
      </Carousel>
    </section>
  );
}
