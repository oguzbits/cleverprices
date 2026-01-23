import {
  searchProducts,
  getProducts,
} from "../../src/lib/keepa/product-discovery";
import type { CountryCode } from "../../src/lib/countries";

async function main() {
  const keyword = process.argv[2];
  const country = (process.argv[3] || "de") as CountryCode;

  if (!keyword) {
    console.error(
      "Usage: bun run scripts/find-browse-node.ts <keyword> [country]",
    );
    process.exit(1);
  }

  console.log(`🔎 Searching for "${keyword}" in ${country}...`);
  const asins = await searchProducts(keyword, country, { limit: 1 });

  if (asins.length === 0) {
    console.log("No products found.");
    return;
  }

  const asin = asins[0];
  console.log(`📦 Analyzing ASIN: ${asin}`);

  const products = await getProducts([asin], country);
  const product = products[0];

  if (product && product.categoryTree) {
    console.log("\n🌳 Category Tree:");
    product.categoryTree.forEach((node) => {
      console.log(`   - ${node.name} (ID: ${node.catId})`);
    });

    const lastNode = product.categoryTree[product.categoryTree.length - 1];
    console.log(
      `\n✅ Recommended Browse Node: ${lastNode.catId} (${lastNode.name})`,
    );
  } else {
    console.log("Category tree not found.");
  }
}

main().catch(console.error);
