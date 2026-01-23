import { db } from "@/db";
import { products } from "@/db/schema";
import { generateProductSlug } from "@/lib/utils/slug";
import { eq } from "drizzle-orm";

async function regenerateSlugs() {
  console.log("Fetching all products...");
  const allProducts = await db.select().from(products);

  console.log(`Found ${allProducts.length} products. Regenerating slugs...`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const product of allProducts) {
    const newSlug = generateProductSlug(
      product.title,
      product.brand,
      product.asin,
      product.capacity,
      product.capacityUnit,
    );

    if (newSlug !== product.slug) {
      try {
        await db
          .update(products)
          .set({ slug: newSlug })
          .where(eq(products.id, product.id));

        console.log(`✅ Updated: ${product.slug} → ${newSlug}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Failed to update ${product.asin}: ${error}`);
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log(
    `\n✨ Done! Updated: ${updatedCount}, Unchanged: ${skippedCount}`,
  );
}

regenerateSlugs().catch(console.error);
