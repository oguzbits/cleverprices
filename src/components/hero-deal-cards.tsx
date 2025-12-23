"use client"

import { ProductSection } from "@/components/ProductSection"
import { useCountry } from "@/hooks/use-country"
import { getCountryByCode } from "@/lib/countries"
import { getAllProducts, type Product } from "@/lib/product-registry"
import { adaptToUIModel } from "@/lib/utils/products"

type ProductWithDiscount = Product & {
  discount: number
}

// Calculate discount percentage based on market average or typical retail price
const calculateDiscount = (product: Product): number => {
  // Typical market prices per unit (TB for storage, GB for RAM, W for PSU)
  const marketPrices: Record<string, number> = {
    'SSD': 120, // Average $/TB
    'HDD': 25,  // Average $/TB
    'SAS': 30,  // Average $/TB
    'DDR4': 10, // Average $/GB
    'DDR5': 15, // Average $/GB
    'GaN-MOSFET': 0.25, // Average $/W for high-end PSU
  }
  
  // Try to determine a market price based on category if technology is not found
  let marketPrice = marketPrices[product.technology || ""]
  
  if (marketPrice === undefined) {
    if (product.category === 'power-supplies') {
      marketPrice = 0.20 // Default $/W for PSU
    } else {
      marketPrice = 0 // Unknown
    }
  }

  const currentPrice = product.pricePerUnit || 0

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

export function HeroDealCards() {
  const { country } = useCountry();
  const countryConfig = getCountryByCode(country);

  const highlightedDeals = getTopDeals();
  const uiProducts = highlightedDeals.map(p => {
    const ui = adaptToUIModel(p, countryConfig?.currency, countryConfig?.symbol);
    return {
      ...ui,
      oldPrice: ui.price.amount * (1 + p.discount / 100),
      discountPercentage: p.discount
    };
  });

  return (
    <ProductSection 
      title="Highlighted Deals"
      description="These are outstanding deals we've found and feel are worth sharing."
      products={uiProducts}
      priorityIndices={[0, 1]}
      productCardProps={{
        // Custom logic for oldPrice in HeroDealCards
      }}
    />
  );
}
