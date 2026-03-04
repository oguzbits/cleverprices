import { ProductIdentity } from "../product-identity";

export interface IdentityStrategy {
  extract(product: any): Partial<ProductIdentity> | null;
}

export type CategoryStrategyMap = Record<string, new () => IdentityStrategy>;
