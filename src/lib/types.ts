export interface LeanProduct {
  id?: number;
  slug: string;
  title: string;
  modelTitle?: string;
  variantSuffix?: string;
  specificationsSource?: string | null;
  subtitle?: string;
  image?: string;
  price: number;
  pricePerUnit?: number;
  capacity?: number;
  capacityUnit?: string;
  formFactor?: string;
  brand: string;
  rating?: number;
  reviewCount?: number;
  salesRank?: number;
  monthlySold?: number;
  variationAttributes?: string;
  isVariantGroup?: boolean;
  variantCount?: number;
  category?: string;
  listPrice?: number;
  savings?: number;
}
