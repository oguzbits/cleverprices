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
}: {
  price?: number | null;
  usedPrice?: number | null;
  warehousePrice?: number | null;
  initialPrice?: number | null;
}): number {
  const p = price || 0;
  const up = usedPrice || 0;
  const wp = warehousePrice || 0;

  // 1. Start with the most stable price (Professional New or Renewed)
  let selected = p;

  // 2. Consider professional marketplace (up) if significantly cheaper (>20€ difference)
  // This avoids "ghost" marketplace prices that are only a few cents cheaper.
  if (up > 0) {
    if (!selected || up < selected - 20) {
      selected = up;
    }
  }

  // 3. Consider warehouse deals (wp) only if they are a MASSIVE steal (>50€ cheaper than what we have)
  // These are often one-off items or returns with variable quality.
  if (wp > 0) {
    if (!selected || wp < selected - 50) {
      selected = wp;
    }
  }

  return selected || p || up || wp || initialPrice || 0;
}
