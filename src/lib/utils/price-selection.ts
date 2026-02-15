/**
 * Unified price selection logic for CleverPrices.
 * Implements the "Stability Bias" to prevent volatile Warehouse Deals
 * from overriding reliable Professional stock (New/Renewed) as the primary price.
 */
export function getBestPrice({
  price,
  usedPrice,
  warehousePrice,
  initialPrice,
  condition,
  mode = "smart",
}: {
  price?: number | null;
  usedPrice?: number | null;
  warehousePrice?: number | null;
  initialPrice?: number | null;
  condition?: string;
  mode?: "smart" | "new" | "used";
}): number {
  const p = price || 0;
  const up = usedPrice || 0;
  const wp = warehousePrice || 0;

  // 0. Strict Condition Enforcement (User Request)
  // If the product is explicitly "New", we ONLY show the New price.
  // If the product is explicitly "Used" or "Renewed", we prioritize used prices.
  if (condition) {
    const cond = condition.toLowerCase();
    if (cond === "new") {
      return p || initialPrice || 0;
    }
    if (
      cond === "used" ||
      cond === "renewed" ||
      cond === "refurbished" ||
      cond === "generalüberholt"
    ) {
      if (up > 0 && wp > 0) return Math.min(up, wp);
      return up || wp || p || 0;
    }
  }

  // Fallback for legacy calls without condition (or unknown condition)
  // Mode 1: New - Strictly professional/stable new stock
  if (mode === "new") {
    return p || initialPrice || 0;
  }

  // Mode 2: Used - Strictly the best used price (Marketplace or Warehouse)
  if (mode === "used") {
    if (up > 0 && wp > 0) return Math.min(up, wp);
    return up || wp || 0;
  }

  // 3. Smart Logic (Stability Bias) - Now only applies if condition is UNKNOWN
  let selected = p;

  // 2. Consider professional marketplace (up) if significantly cheaper
  // Requirement: >20€ cheaper AND at least 10% cheaper than new price.
  if (up > 0) {
    const isSignificantlyCheaper =
      !selected || (up < selected - 20 && up < selected * 0.9);

    if (isSignificantlyCheaper) {
      selected = up;
    }
  }

  // 3. Consider warehouse deals (wp) only if they are a MASSIVE steal (>50€ cheaper)
  if (wp > 0) {
    if (!selected || wp < selected - 50) {
      selected = wp;
    }
  }

  return selected || p || up || wp || initialPrice || 0;
}
