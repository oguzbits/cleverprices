import { ProductVariantSelector } from "./ProductVariantSelector";

interface ProductVariantSelectorProps {
  product: any;
  countryCode: string;
  isParentView?: boolean;
  selectedCondition?: "new" | "used" | "renewed";
  parentSlug?: string;
}

export async function CachedVariantSelector({
  product,
  countryCode,
  isParentView,
  selectedCondition,
  parentSlug,
}: ProductVariantSelectorProps) {
  const { getProductVariants } = await import("@/lib/server/cached-products");
  let allVariants = await getProductVariants(product, countryCode);

  // Fallback: If getProductVariants returns empty (no siblings), we ensure the current product is in the list
  if (allVariants.length === 0) {
    allVariants = [product];
  }

  // [CRITICAL] Overlay fresh prices (1-min) for consistency across components
  const { mergeLivePrices } = await import("@/lib/server/live-data");
  allVariants = await mergeLivePrices(allVariants, countryCode);

  // Find the merged version of the current product to ensure consistency
  const currentMergedProduct =
    allVariants.find((v) => v.id === product.id) || product;

  if (allVariants.length <= 1) return null;

  return (
    <ProductVariantSelector
      currentProduct={currentMergedProduct}
      variants={allVariants as any[]}
      countryCode={countryCode}
      isParentView={isParentView}
      selectedCondition={selectedCondition}
      parentSlug={parentSlug}
    />
  );
}
