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

    // Fetch full category (Cached <2MB)
    const categoryProducts = await getCachedLocalizedCategoryProducts(
      product.category,
      countryCode,
    );
    const { getProductIdentity, IDENTITY_CONFIG } =
      await import("@/lib/utils/product-identity");
    const { normalizeVariantAttributes, parseVariationAttributes } =
      await import("@/lib/utils/variants");

    // Calculate identity of the CURRENT product
    const identity = getProductIdentity(product);
    const targetBrand = identity.brand.toLowerCase();
    const targetShortModel = identity.shortModel.toLowerCase();
    const targetSize = identity.variantMap.Size
      ? identity.variantMap.Size.replace(/\s*(?:Zoll|Inch|")/i, "")
      : undefined;

    const isLaptopOrTV = IDENTITY_CONFIG.FIXED_TRAIT_CATEGORIES.some(
      (c) =>
        product.category?.toLowerCase().includes(c) ||
        product.title?.toLowerCase().includes("macbook"),
    );

    if (targetShortModel && targetShortModel.length > 2) {
      // Filter for siblings with SAME identity
      const siblings = categoryProducts
        .filter((p) => {
          // Skip self
          if (p.id === product.id) return false;
          // Must be same brand (optimization)
          if (p.brand.toLowerCase() !== targetBrand) return false;

          const siblingIdentity = getProductIdentity(p as any);
          const siblingShortModel = siblingIdentity.shortModel.toLowerCase();

          // 1. Base model must match (e.g. "MacBook Air")
          if (siblingShortModel !== targetShortModel) return false;

          // 2. If it's a fixed trait category (Laptop/TV), Size must ALSO match
          if (isLaptopOrTV) {
            const siblingMap = parseVariationAttributes(
              p.variationAttributes || "",
            );
            const siblingSize =
              siblingIdentity.variantMap.Size || siblingMap.Size;
            if (siblingSize) {
              const sibSizeNorm = siblingSize
                .replace(/\s*(?:Zoll|Inch|")/i, "")
                .trim();
              if (targetSize && sibSizeNorm !== targetSize.trim()) return false;
            }
          }

          return true;
        })
        .map((p) => {
          const sibId = getProductIdentity({
            ...p,
            category: product.category,
            brand: identity.brand,
          } as any);

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
            category: product.category, // INJECT PARENT CATEGORY for identity consistency
            brand: identity.brand, // USE NORMALIZED BRAND from identity
            variantSuffix: sibId.variantSuffix, // PRE-CALCULATE FOR UI
            variationAttributes: attrs,
            // Adapt LocalizedProduct (flat price) to Registry Product (prices map)
            prices: { [countryCode]: p.price },
            usedPrices: {},
            lastUpdated: p.lastUpdated,
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
