// Example: Value-Based Diffing
// Source: scripts/update-prices.ts

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { prices, products } from "@/db/schema";

// ❌ BAD: Always write, even if nothing changed
async function badUpdate(productId: number, newPrice: number) {
  await db
    .update(prices)
    .set({
      amazonPrice: newPrice,
      lastUpdated: new Date(),
    })
    .where(eq(prices.productId, productId));
  // This ALWAYS costs a write, even if price is unchanged!
}

// ✅ GOOD: Only write if value has changed
async function goodUpdate(productId: number, newPrice: number) {
  // Fetch current state
  const [current] = await db
    .select({
      amazonPrice: prices.amazonPrice,
      lastUpdated: prices.lastUpdated,
    })
    .from(prices)
    .where(eq(prices.productId, productId));

  // Check if anything has changed
  const priceChanged = current.amazonPrice !== newPrice;
  const isStale =
    Date.now() - current.lastUpdated.getTime() > 24 * 60 * 60 * 1000;

  if (priceChanged) {
    // Full update - price changed
    await db
      .update(prices)
      .set({
        amazonPrice: newPrice,
        lastUpdated: new Date(),
      })
      .where(eq(prices.productId, productId));
  } else if (isStale) {
    // Timestamp refresh only - keep in rotation
    await db
      .update(prices)
      .set({
        lastUpdated: new Date(),
      })
      .where(eq(prices.productId, productId));
  }
  // else: Do nothing - no write needed!
}

// Real-world implementation from update-prices.ts
async function updateProductPrices(product: any, keepaData: any) {
  const priceChanged =
    keepaData.amazonPrice !== product.currentAmazonPrice ||
    keepaData.newPrice !== product.currentNewPrice ||
    keepaData.usedPrice !== product.currentUsedPrice;

  const metaChanged =
    keepaData.salesRank !== product.salesRank ||
    keepaData.rating !== product.rating;

  const isStale = Date.now() - product.currentLastUpdated > 24 * 60 * 60 * 1000;

  // Only write what changed
  if (priceChanged) {
    await db
      .update(prices)
      .set({
        amazonPrice: keepaData.amazonPrice,
        newPrice: keepaData.newPrice,
        usedPrice: keepaData.usedPrice,
        lastUpdated: new Date(),
      })
      .where(eq(prices.productId, product.id));
  } else if (isStale) {
    // Just refresh timestamp to keep in rotation
    await db
      .update(prices)
      .set({ lastUpdated: new Date() })
      .where(eq(prices.productId, product.id));
  }

  if (metaChanged) {
    await db
      .update(products)
      .set({
        salesRank: keepaData.salesRank,
        rating: keepaData.rating,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));
  }
}
