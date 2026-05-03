import { Database } from "bun:sqlite";

import { getFamilyIdentity } from "../../src/lib/product-families";
import { getProductIdentity } from "../../src/lib/utils/product-identity";

const db = new Database("./data/cleverprices.db");

// Select a diverse sample of products with Modell spec
const products = db
  .query(
    `
  SELECT id, title, brand, category, official_title, official_specifications, specifications_source, variation_attributes, mpn
  FROM products 
  WHERE id = 2518
`,
  )
  .all() as any[];

console.log(
  "| ID | Brand | Category | Original Title | Improved Model | New Display Title | traits | highVar |",
);
console.log(
  "|----|-------|----------|----------------|----------------|-------------------|--------|---------|",
);

for (const p of products) {
  // Map underscored to camelCase for Product interface
  const mappedProduct = {
    ...p,
    variationAttributes:
      p.id === 2518
        ? "Farbe: Rosé; Storage: 512 GB; Konnektivität: Wi-Fi + Cellular"
        : p.variation_attributes,
    officialSpecifications: p.official_specifications,
    officialTitle: p.official_title,
    specificationsSource: p.specifications_source,
  };

  const identity = getProductIdentity(mappedProduct);
  const familyInfo = getFamilyIdentity(mappedProduct as any);
  const oldTitle = p.title.substring(0, 30) + "...";
  const newTitle = identity.displayTitle;
  const traits = identity.variantTokens.join(", ");

  console.log(
    `| ${p.id} | ${identity.brand} | ${p.category} | ${oldTitle} | ${identity.model} | ${newTitle} | ${traits} | ${identity.isHighVariance} |`,
  );
  console.log(`DEBUG: slug: ${familyInfo.slug}`);
  console.log(`DEBUG: variantSuffix: ${identity.variantSuffix}`);
  console.log(`DEBUG: variantMap: ${JSON.stringify(identity.variantMap)}`);
}
