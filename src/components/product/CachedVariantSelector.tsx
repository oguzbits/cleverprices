import { getFamilyIdentity } from "@/lib/product-families";
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
  const { getProductVariants } = await import("@/lib/product-registry");
  let allVariants = await getProductVariants(product, countryCode);

  // Fallback: If getProductVariants returns empty (no siblings), we ensure the current product is in the list
  // so that we can check length <= 1 properly.
  if (allVariants.length === 0) {
    allVariants = [product];
  }

  // Ensure all variants have canonical slugs.
  // We trust the slugs from getProductVariants (server-side consensus) if available.
  const variantsWithCorrectSlugs = allVariants.map((v) => {
    if (v.slug && v.slug.includes(`${v.id}_-`)) return v;
    const { slug } = getFamilyIdentity(v, allVariants);
    return { ...v, slug };
  });

  if (variantsWithCorrectSlugs.length <= 1) return null;

  return (
    <ProductVariantSelector
      currentProduct={product}
      variants={variantsWithCorrectSlugs as any[]}
      countryCode={countryCode}
      isParentView={isParentView}
      selectedCondition={selectedCondition}
      parentSlug={parentSlug}
    />
  );
}
