import { getProductsByCategory } from "../src/lib/server/product-queries";
import { mapRawToLocalizedProduct } from "../src/lib/server/category-products";
import { serializeSafe } from "../src/lib/utils/serialization";

async function test() {
  const slug = "kabel-adapter";
  console.log(`Testing category: ${slug}`);
  
  try {
    const products = await getProductsByCategory(slug);
    console.log(`Found ${products.length} products`);
    
    for (const p of products) {
      if (!p.prices) {
          console.error(`Product ID ${p.id} has NO prices object!`);
          process.exit(1);
      }
      
      try {
        const localized = mapRawToLocalizedProduct(p, "de", slug);
        if (localized) {
          if (!localized.prices) {
              console.error(`Localized Product ID ${p.id} has NO prices object!`);
              process.exit(1);
          }
          serializeSafe(localized);
        }
      } catch (err) {
        console.error(`Serialization failed for product ID ${p.id}:`, err);
        process.exit(1);
      }
    }
    console.log("All products checked successfully!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

test();
