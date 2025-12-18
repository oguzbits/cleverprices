"use client"

import { useState } from "react"
import { ProductUIModel } from "@/lib/amazon-api"
import { useCountry } from "@/hooks/use-country"
import { getCountryByCode } from "@/lib/countries"
import { ProductCard } from "@/components/product-card"

interface PriceDropsProps {
  products: (ProductUIModel & { dropPercentage: number, oldPrice: number })[]
}

export function PriceDrops({ products }: PriceDropsProps) {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily")
  const { country } = useCountry()
  const countryConfig = getCountryByCode(country)

  // Filter products based on period (in a real app, this would be a real filter)
  const filteredProducts = products.sort((a, b) => 
    period === "daily" ? b.dropPercentage - a.dropPercentage : a.dropPercentage - b.dropPercentage
  ).slice(0, 5)

  return (
    <section className="mb-12">
      <div className="mb-6">
        <div className="mb-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0066CC] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1">
            Top Amazon Price Drops <span className="text-foreground no-underline">→</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Big price drops. The products below are selected from categories that you frequently track products in and have had large price drops since the last price update.
          </p>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setPeriod("daily")}
            className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
              period === "daily" 
                ? "bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-black dark:border-gray-200" 
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-card dark:text-gray-300 dark:border-border dark:hover:bg-muted"
            }`}
          >
            Daily Drops
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${
              period === "weekly" 
                ? "bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-black dark:border-gray-200" 
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-card dark:text-gray-300 dark:border-border dark:hover:bg-muted"
            }`}
          >
            Weekly Drops
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.asin}
            title={product.title}
            price={product.price.amount}
            oldPrice={product.oldPrice}
            currency={countryConfig?.currency || "USD"}
            url={product.url}
            pricePerUnit={product.pricePerUnit}
            countryCode={country}
            badgeText="Best Price"
            badgeColor="green"
            discountPercentage={product.dropPercentage}
            condition="New"
          />
        ))}
      </div>
    </section>
  )
}
