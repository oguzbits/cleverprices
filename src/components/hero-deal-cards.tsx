import { ProductSection } from "@/components/ProductSection";
import { getCountryByCode, type CountryCode } from "@/lib/countries";
import { type Product } from "@/lib/product-registry";
import { getAllProducts } from "@/lib/server/cached-products";
import {
  adaptToUIModel,
  calculateProductMetrics,
  getLocalizedProductData,
} from "@/lib/utils/products";

type ProductWithDiscount = Product & {
  discount: number;
};

// Calculate discount percentage based on market average or typical retail price
const calculateDiscount = (product: Product, countryCode: CountryCode = "us"): number => {
  const { price } = getLocalizedProductData(product, countryCode);
  
  // Typical market prices per unit (TB for storage, GB for RAM, W for PSU)
  const marketPrices: Record<string, number> = {
    SSD: 120, // Average $/TB
    HDD: 25, // Average $/TB
    SAS: 30, // Average $/TB
    DDR4: 10, // Average $/GB
    DDR5: 15, // Average $/GB
    "GaN-MOSFET": 0.25, // Average $/W for high-end PSU
  };

  // Try to determine a market price based on category if technology is not found
  let marketPrice = marketPrices[product.technology || ""];

  if (marketPrice === undefined) {
    if (product.category === "power-supplies") {
      marketPrice = 0.2; // Default $/W for PSU
    } else {
      marketPrice = 0; // Unknown
    }
  }

  // Calculate pricePerUnit for this specific country price
  const finalPrice = price ?? 0;
  const enhanced = calculateProductMetrics(product, finalPrice);
  const currentPricePerUnit = enhanced.pricePerUnit || 0;

  if (marketPrice === 0 || currentPricePerUnit === 0) return 0;

  const discount = Math.round(
    ((marketPrice - currentPricePerUnit) / marketPrice) * 100,
  );
  return Math.max(0, Math.min(discount, 99)); // Clamp between 0-99%
};

// Get the top 3 deals based on discount percentage
const getTopDeals = async (countryCode: CountryCode = "us"): Promise<ProductWithDiscount[]> => {
  const allProducts = await getAllProducts();
  return allProducts
    .filter((p) => {
      const { price } = getLocalizedProductData(p, countryCode);
      return price !== null && price !== 0;
    })
    .map((product) => ({
      ...product,
      discount: calculateDiscount(product, countryCode),
    }))
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 3);
};

export async function HeroDealCards({ country }: { country: CountryCode }) {
  const countryConfig = getCountryByCode(country);

  const highlightedDeals = await getTopDeals(country);
  const uiProducts = highlightedDeals.map((p) => {
    const ui = adaptToUIModel(
      p,
      country,
      countryConfig?.currency,
      countryConfig?.symbol,
    );
    return {
      ...ui,
      oldPrice: ui.price.amount * (1 + p.discount / 100),
      discountPercentage: p.discount,
    };
  });

  return (
    <ProductSection
      title="Highlighted Deals"
      description="These are outstanding deals we've found and feel are worth sharing."
      products={uiProducts}
      country={country}
      priorityIndices={[0, 1]}
      productCardProps={
        {
          // Custom logic for oldPrice in HeroDealCards
        }
      }
    />
  );
}
