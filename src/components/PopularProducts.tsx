"use client"

import { Badge } from "@/components/ui/badge"
import { useCountry } from "@/hooks/use-country"
import { getCountryByCode } from "@/lib/countries"
import { ProductCard } from "@/components/product-card"
import { ProductUIModel } from "@/lib/amazon-api"

interface PopularProductsProps {
  products: ProductUIModel[]
}

export function PopularProducts({ products }: PopularProductsProps) {
  const { country } = useCountry()
  const countryConfig = getCountryByCode(country)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(countryConfig?.locale || "en-US", {
      style: "currency",
      currency: countryConfig?.currency || "USD",
    }).format(value)
  }

  return (
    <section className="mb-12">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0066CC] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1">
          Popular Products <span className="text-foreground no-underline">→</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Check out these recently popular deals on realpricedata. See what other informed users have been buying lately!
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.asin}
            title={product.title}
            price={product.price.amount}
            oldPrice={product.price.amount * 1.15}
            currency={countryConfig?.currency || "USD"}
            url={product.url}
            pricePerUnit={product.pricePerUnit ? product.pricePerUnit.split('/')[0] : undefined}
            countryCode={country}
            badgeText="Good Deal"
            badgeColor="blue"
          />
        ))}
      </div>
    </section>
  )
}
