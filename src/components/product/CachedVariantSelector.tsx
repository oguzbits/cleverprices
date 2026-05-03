import { Product } from "@/lib/product-definitions";

import { ProductVariantSelector } from "./ProductVariantSelector";

interface ProductVariantSelectorProps {
  product: Product;
  variants?: Product[]; // Pre-merged variants from server
  countryCode: string;
  isParentView?: boolean;
  selectedCondition?: "new" | "used" | "renewed";
  parentSlug?: string;
}

export function CachedVariantSelector({
  product,
  variants: allVariants = [],
  countryCode,
  isParentView,
  selectedCondition,
  parentSlug,
}: ProductVariantSelectorProps) {
  // Find the merged version of the current product to ensure consistency
  // Robust match: Try ID first, then ASIN (especially if ID is synthetic/Hub)
  const currentMergedProduct =
    allVariants.find((v) => v.id === product.id || v.asin === product.asin) ||
    product;

  if (allVariants.length <= 1) return null;

  return (
    <ProductVariantSelector
      currentProduct={currentMergedProduct}
      variants={allVariants as Product[]}
      countryCode={countryCode}
      isParentView={isParentView}
      selectedCondition={selectedCondition}
      parentSlug={parentSlug}
    />
  );
}
