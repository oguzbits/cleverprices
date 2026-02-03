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
  // so that we can check length <= 1 properly.
  if (allVariants.length === 0) {
    allVariants = [product];
  }

  if (allVariants.length <= 1) return null;

  return (
    <ProductVariantSelector
      currentProduct={product}
      variants={allVariants as any[]}
      countryCode={countryCode}
      isParentView={isParentView}
      selectedCondition={selectedCondition}
      parentSlug={parentSlug}
    />
  );
}
