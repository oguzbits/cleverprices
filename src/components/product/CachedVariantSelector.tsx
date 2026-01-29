import { ProductVariantSelector } from "./ProductVariantSelector";

interface ProductVariantSelectorProps {
  product: any;
  countryCode: string;
  isParentView?: boolean;
  selectedCondition?: "new" | "used" | "renewed";
}

export async function CachedVariantSelector({
  product,
  countryCode,
  isParentView,
  selectedCondition,
}: ProductVariantSelectorProps) {
  const { getProductVariants } = await import("@/lib/product-registry");
  let allVariants = await getProductVariants(product, countryCode);

  // --- SMART FALLBACK ---
  // If DB returns no siblings (missing parentAsin), try to find them in the category cache
  // by matching the Model Identity (e.g. "MacBook Air M4").
  if (allVariants.length === 0) {
    const { getCachedLocalizedCategoryProducts } =
      await import("@/lib/server/category-products");
    const { getProductIdentity } = await import("@/lib/utils/product-identity");

    // Fetch full category (Cached <2MB)
    const categoryProducts = await getCachedLocalizedCategoryProducts(
      product.category,
      countryCode,
    );
    const { normalizeVariantAttributes } = await import("@/lib/utils/variants");

    // Calculate identity of the CURRENT product
    const identity = getProductIdentity(product);
    const targetModelKey = identity.model
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    if (targetModelKey && targetModelKey.length > 2) {
      // Filter for siblings with SAME identity
      const siblings = categoryProducts
        .filter((p) => {
          // Skip self
          if (p.id === product.id) return false;
          // Must be same brand (optimization)
          if (p.brand.toLowerCase() !== product.brand?.toLowerCase())
            return false;

          const siblingIdentity = getProductIdentity(p as any);
          const siblingKey = siblingIdentity.model
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");
          return siblingKey === targetModelKey;
        })
        .map((p) => {
          // RECOVERY: Ensure we have attributes for the UI to filter by
          let attrs = p.variationAttributes || "";
          if (!attrs || attrs.length < 5) {
            // Use the centralized normalizer which recovers Storage/Color from title
            attrs = normalizeVariantAttributes({
              title: p.title,
              variationAttributes: "",
              category: p.category,
              officialSpecs: p.officialSpecifications,
            });
          }

          return {
            ...p,
            variationAttributes: attrs,
            // Adapt LocalizedProduct (flat price) to Registry Product (prices map)
            prices: { [countryCode]: p.price },
            usedPrices: {},
            condition: p.condition as any,
          };
        });

      if (siblings.length > 0) {
        // Also fix the CURRENT product if it's missing attributes (so it matches the buttons)
        let currentAttrs = product.variationAttributes || "";
        if (!currentAttrs || currentAttrs.length < 5) {
          currentAttrs = normalizeVariantAttributes({
            title: product.title,
            variationAttributes: "",
            category: product.category,
          });
          // Mutate effectively for the view
          (product as any).variationAttributes = currentAttrs;
        }

        // Add self to the list so selector shows current selection correctly
        allVariants = [product, ...siblings] as any[];
      }
    }
  }

  if (allVariants.length <= 1) return null;

  return (
    <ProductVariantSelector
      currentProduct={product}
      variants={allVariants as any[]}
      countryCode={countryCode}
      isParentView={isParentView}
      selectedCondition={selectedCondition}
    />
  );
}
