// Example: Lite Columns Pattern
// Source: src/lib/product-registry.ts

import { prices, products } from "@/db/schema";

// Lightweight price columns - excludes rarely-used fields
export const litePriceColumns = {
  id: prices.id,
  productId: prices.productId,
  country: prices.country,
  amazonPrice: prices.amazonPrice,
  newPrice: prices.newPrice,
  usedPrice: prices.usedPrice,
  listPrice: prices.listPrice,
  priceAvg30: prices.priceAvg30,
  priceAvg90: prices.priceAvg90,
  currency: prices.currency,
  lastUpdated: prices.lastUpdated,
  // EXCLUDED: amazonPriceFormatted, warehousePrice, priceMin, priceMax,
  //           pricePerUnit, availability, deliveryTime, deliveryCost, source
};

// Lightweight product columns for list views
export const liteProductColumns = {
  id: products.id,
  asin: products.asin,
  slug: products.slug,
  title: products.title,
  brand: products.brand,
  category: products.category,
  imageUrl: products.imageUrl,
  capacity: products.capacity,
  capacityUnit: products.capacityUnit,
  normalizedCapacity: products.normalizedCapacity,
  formFactor: products.formFactor,
  technology: products.technology,
  condition: products.condition,
  rating: products.rating,
  reviewCount: products.reviewCount,
  salesRank: products.salesRank,
  // EXCLUDED: rawData, features, description (heavy JSON fields)
};

// Usage
async function getCategoryProducts(category: string) {
  const prods = await db
    .select(liteProductColumns)
    .from(products)
    .where(eq(products.category, category));
  const prs = await db
    .select(litePriceColumns)
    .from(prices)
    .where(
      inArray(
        prices.productId,
        prods.map((p) => p.id),
      ),
    );
  return prods;
}
