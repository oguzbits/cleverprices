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
  const allVariants = await getProductVariants(product, countryCode);

  if (allVariants.length === 0) return null;

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
