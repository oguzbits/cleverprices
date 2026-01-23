import {
  getCategoryBestsellers,
  getCategoryDeals,
  getCategoryNewProducts,
} from "./src/lib/data/parentCategoryData";

async function debug() {
  const parentSlug = "elektroartikel";
  const countryCode = "de";

  console.log("=== Bestsellers ===");
  const bestsellers = await getCategoryBestsellers(parentSlug, 5, countryCode);
  bestsellers.forEach((p) =>
    console.log(`- ${p.brand}: ${p.title} (Score: ${p.popularityScore})`),
  );

  console.log("\n=== New Products ===");
  const newProducts = await getCategoryNewProducts(parentSlug, 5, countryCode);
  newProducts.forEach((p) => console.log(`- ${p.brand}: ${p.title}`));

  console.log("\n=== Deals ===");
  const deals = await getCategoryDeals(parentSlug, 5, countryCode);
  deals.forEach((p) => console.log(`- ${p.brand}: ${p.title}`));
}

debug().catch(console.error);
