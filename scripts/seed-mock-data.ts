import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import { products, prices, priceHistory, productOffers } from "@/db/schema";
import { sql } from "drizzle-orm";

const client = createClient({ url: "file:./data/cleverprices.db" });
const db = drizzle(client, { schema });

async function main() {
  console.log("🌱 Seeding mock data...");

  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Mock Product: Samsung 990 PRO 2TB
  const product = {
    asin: "B0BHK1VPK8",
    slug: "samsung-990-pro-2tb",
    title:
      "Samsung 990 PRO M.2 NVMe SSD 2 tb, PCIe 4.0, 7.450 MB/s Lesegeschwindigkeit, Interne SSD, Für Gaming und Videobearbeitung, Festplatte für Konsole und PC, MZ-V9P2T0BW",
    brand: "Samsung",
    category: "hard-drives",
    imageUrl:
      "https://images-na.ssl-images-amazon.com/images/I/71W690L%2B5cL._AC_SL1500_.jpg",
    capacity: 2,
    capacityUnit: "TB",
    formFactor: "M.2",
    technology: "NVMe",
    condition: "New",
    description:
      "The ultimate SSD for gamers and creators. Reach near max performance with PCIe 4.0.",
    features: JSON.stringify([
      "PCIe 4.0 NVMe",
      "7450 MB/s Read",
      "6900 MB/s Write",
    ]),
    salesRank: 1,
    rating: 4.8,
    reviewCount: 12500,
  };

  try {
    // 1. Insert Product
    const [insertedProduct] = await db
      .insert(products)
      .values({
        ...product,
        updatedAt: now,
      })
      .returning({ id: products.id });

    console.log(
      `Included product: ${product.slug} (ID: ${insertedProduct.id})`,
    );

    // 2. Insert Price Info
    await db.insert(prices).values({
      productId: insertedProduct.id,
      country: "de",
      amazonPrice: 169.9,
      newPrice: 169.9,
      usedPrice: 145.0,
      currency: "EUR",
      source: "mock",
      lastUpdated: now,
    });

    // 3. Insert Price History (Simulated 90 days)
    const historyPoints = [];
    let currentPrice = 189.9;
    for (let i = 90; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

      // Random walk price
      const change = (Math.random() - 0.5) * 5;
      currentPrice += change;
      if (currentPrice < 140) currentPrice = 140;
      if (currentPrice > 210) currentPrice = 210;

      historyPoints.push({
        productId: insertedProduct.id,
        country: "de",
        price: parseFloat(currentPrice.toFixed(2)),
        currency: "EUR",
        priceType: "amazon",
        recordedAt: date,
      });
    }

    // Batch insert history
    // SQLite limit might be hit if too many rows, so chunk it just in case, but 90 is fine.
    await db.insert(priceHistory).values(historyPoints);

    // 4. Insert Offers
    await db.insert(productOffers).values([
      {
        productId: insertedProduct.id,
        source: "amazon",
        merchantName: "Amazon.de",
        price: 169.9,
        currency: "EUR",
        shippingCost: 0,
        totalPrice: 169.9,
        affiliateUrl: "https://amazon.de",
        availability: "in_stock",
        deliveryTime: "Morgen",
      },
      {
        productId: insertedProduct.id,
        source: "mindfactory",
        merchantName: "Mindfactory",
        price: 165.0,
        currency: "EUR",
        shippingCost: 8.99,
        totalPrice: 173.99,
        affiliateUrl: "https://mindfactory.de",
        availability: "in_stock",
        deliveryTime: "3-5 Tage",
      },
    ]);

    console.log("✅ Mock data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

main();
