import { Product } from "@/lib/product-registry";
import { getProductIdentity } from "@/lib/utils/product-identity";

/**
 * Semantic Identity Engine
 * Responsible for Entity Resolution / Clustering of identical products.
 */

interface SemanticCluster {
  hash: string;
  representativeId: number;
  productIds: number[];
}

/**
 * Generates a stable grouping key for entity resolution.
 *
 * GOAL: Group colors, MPNs, and multiple sources of the EXACT same technical product.
 * NON-GOAL: Grouping different storage capacities (128GB vs 256GB) - these are distinct search intents.
 */
function generateSemanticHash(product: Partial<Product>): string {
  if (!product.title) return "unknown";

  // 1. Leverage existing identity resolution (strips noise, normalizes brands)
  const identity = getProductIdentity(product);

  // 2. Extract specific technical traits that define a "Master Product"
  const brand = (identity.brand || "generic")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  // Model is already cleaned by getProductIdentity (strips color, MPN, etc)
  const model = identity.model.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Technical differentiators that MUST match for "Identical" status:
  const storage = (identity.variantMap.Storage || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const ram = (identity.variantMap.RAM || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const size = (identity.variantMap.Size || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  // 3. Construct Composite Grouping Key
  // Format: brand:model:traits...
  // We sort/filter to ensure stability
  const traits = [storage, ram, size].filter(Boolean);
  const hash = [brand, model, ...traits].join(":").replace(/-+/g, "-");

  return hash;
}

/**
 * Logic to determine the "Canonical Representative" of a cluster.
 * Currently: Lowest ID (usually first imported) or most complete product.
 */
export function getCanonicalRepresentative(products: Product[]): Product {
  return products.sort((a, b) => {
    // 1. Prefer health scored products
    const healthA = a.completenessScore || 0;
    const healthB = b.completenessScore || 0;
    if (healthA !== healthB) return healthB - healthA;

    // 2. Fallback to older ID (stability)
    return (a.id || 0) - (b.id || 0);
  })[0];
}

/**
 * Clusters an array of products into Semantic Groups.
 */
export function clusterProducts<T extends Partial<Product>>(
  products: T[],
): Map<string, T[]> {
  const clusters = new Map<string, T[]>();

  for (const product of products) {
    const hash = generateSemanticHash(product);
    const existing = clusters.get(hash) || [];
    existing.push(product);
    clusters.set(hash, existing);
  }

  return clusters;
}
