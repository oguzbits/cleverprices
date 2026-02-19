import { Product } from "@/lib/product-registry";
import { ProductVariantSelector } from "./ProductVariantSelector";

interface ProductVariantSelectorProps {
  product: Product;
  variants?: Product[]; // Pre-merged variants from server
  countryCode: string;
  isParentView?: boolean;
  selectedCondition?: "new" | "used" | "renewed";
  parentSlug?: string;
}

export async function CachedVariantSelector({
  product,
  variants: passedVariants,
  countryCode,
  isParentView,
  selectedCondition,
  parentSlug,
}: ProductVariantSelectorProps) {
  let allVariants = passedVariants || [];

  if (!passedVariants) {
    const { getProductVariants } = await import("@/lib/server/cached-products");
    allVariants = await getProductVariants(product, countryCode);

    // Fallback: If getProductVariants returns empty (no siblings), we ensure the current product is in the list
    if (allVariants.length === 0) {
      allVariants = [product];
    }

    // [CRITICAL] Overlay fresh prices (1-min) for consistency across components
    const { mergeLivePrices } = await import("@/lib/server/live-data");
    allVariants = await mergeLivePrices(allVariants, countryCode);
  }

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
