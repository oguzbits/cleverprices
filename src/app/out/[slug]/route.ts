import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Affiliate Redirect Route
 *
 * This is the ONLY route in the entire application that contains
 * direct Amazon affiliate URLs. All product CTAs link to /out/{slug}
 * which redirects to the affiliate URL stored in the Product Registry.
 */

import { getAllProducts } from "@/lib/product-registry";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  const params = await props.params;
  const { slug } = params;

  // Look up product from the registry (single source of truth)
  const products = getAllProducts();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    // Product not found - redirect to hard-drives page
    const url = new URL("/de/electronics/hard-drives", request.url);
    return NextResponse.redirect(url, 307);
  }

  // Redirect to Amazon affiliate URL
  return NextResponse.redirect(product.affiliateUrl, 307);
}
