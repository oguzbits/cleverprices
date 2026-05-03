export interface ProductIdentity {
  brand: string;
  model: string;
  fullModel: string;
  shortModel: string;
  variantLabel: string;
  variantMap: Record<string, string>;
  displayTitle: string;
  modelTitle: string;
  variantSuffix: string;
  variantTokens: string[];
  mpn?: string;
  isHighVariance: boolean;
  traitCount: number;
  isLaptop: boolean;
  categoryUsed: string;
}

export interface IdentityStrategy {
  extract(product: unknown): Partial<ProductIdentity> | null;
}

export type CategoryStrategyMap = Record<string, new () => IdentityStrategy>;
