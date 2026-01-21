export interface LeanProduct {
  id?: number;
  slug: string;
  title: string;
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
  category?: string;
  listPrice?: number;
  savings?: number;
}
