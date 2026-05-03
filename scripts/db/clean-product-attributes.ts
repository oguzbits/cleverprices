import { eq } from "drizzle-orm";

import { db, products } from "../../src/db";
import { getProductIdentity } from "../../src/lib/utils/product-identity";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";
import { normalizeVariantAttributes } from "../../src/lib/utils/variants";

async function cleanupProductAttributes() {
  console.log("🚀 Starting Database Attribute Cleanup...");

  const allProducts = await db.select().from(products);
  console.log(`📋 Processing ${allProducts.length} products...`);

  let updateCount = 0;

  for (const product of allProducts) {
    let needsUpdate = false;
    const updateData: any = {};

    // 1. Re-normalize Variation Attributes (Drizzle uses camelCase for properties)
    if (product.variationAttributes) {
      const normalized = normalizeVariantAttributes({
        title: product.title,
        variationAttributes: product.variationAttributes,
        category: product.category || "",
        officialSpecs: product.officialSpecifications
          ? JSON.parse(product.officialSpecifications)
          : product.specifications
            ? JSON.parse(product.specifications)
            : {},
      });

      if (normalized !== product.variationAttributes) {
        if (product.id === 289) {
          console.log(`🔍 Product 289 Variation Dedup:`);
          console.log(`   Before: ${product.variationAttributes}`);
          console.log(`   After:  ${normalized}`);
        }
        updateData.variationAttributes = normalized;
        needsUpdate = true;
      }
    }

    // 2. Re-sanitize Official Specifications (Now handles HTML/Unicode entities)
    if (product.officialSpecifications) {
      try {
        const specs = JSON.parse(product.officialSpecifications);
        const identity = getProductIdentity(product as any);
        const identityContext = {
          title: product.title || "",
          brand: product.brand || "",
          model: identity.model,
        };
        const sanitized = sanitizeSpecs(specs, identityContext);
        const sanitizedStr = JSON.stringify(sanitized);

        if (sanitizedStr !== product.officialSpecifications) {
          if (product.id === 289 || product.id === 2947) {
            console.log(`🔍 Product ${product.id} OfficialSpecs Sanitization:`);
            console.log(
              `   Before: ${product.officialSpecifications.substring(0, 100)}...`,
            );
            console.log(`   After:  ${sanitizedStr.substring(0, 100)}...`);
          }
          updateData.officialSpecifications = sanitizedStr;
          needsUpdate = true;
        }
      } catch (e) {
        console.error(
          `❌ Error parsing officialSpecifications for product ${product.id}`,
        );
      }
    }

    // 3. Clean up Trash Official Titles
    if (product.officialTitle) {
      const lowerTitle = product.officialTitle.toLowerCase();
      if (
        lowerTitle.includes("unknown icecat product") ||
        lowerTitle === "unknown product" ||
        lowerTitle === ""
      ) {
        if (product.id === 2947) {
          console.log(
            `🔍 Product 2947 OfficialTitle Trash detected: ${product.officialTitle}`,
          );
        }
        updateData.officialTitle = null;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, product.id));
      updateCount++;
      if (updateCount % 10 === 0) {
        console.log(`✅ Updated ${updateCount} products...`);
      }
    }
  }

  console.log(`\n✨ Cleanup finished! Total products updated: ${updateCount}`);
}

cleanupProductAttributes().catch(console.error);
