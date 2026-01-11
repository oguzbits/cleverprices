import { getCategoryBestsellers } from "../src/lib/data/parentCategoryData";
import { getProductsByCategory } from "../src/lib/product-registry";
import { getCategoryBySlug, getChildCategories } from "../src/lib/categories";

async function main() {
  const parentSlug = "electronics";
  const childCategories = getChildCategories(parentSlug);

  console.log(`Checking parent category: ${parentSlug}`);
  console.log(
    `Found ${childCategories.length} child categories: ${childCategories.map((c) => c.slug).join(", ")}`,
  );

  for (const child of childCategories) {
    const products = await getProductsByCategory(child.slug);
    console.log(`Category ${child.slug}: ${products.length} products found`);
    if (products.length > 0) {
      console.log(
        `  Sample product: ${products[0].title} (Category: ${products[0].category})`,
      );
    }
  }

  console.log("\nFetching bestsellers for parent category...");
  const bestsellers = await getCategoryBestsellers(parentSlug);
  console.log(`Bestsellers found: ${bestsellers.length}`);
  bestsellers.forEach((p) => console.log(`  - ${p.title} (${p.category})`));
}

main();
