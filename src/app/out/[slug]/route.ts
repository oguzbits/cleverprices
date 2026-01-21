import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Affiliate Redirect Route
 *
 * This is the ONLY route in the entire application that contains
 * direct Amazon affiliate URLs. All product CTAs link to /out/{slug}
 * which redirects to the affiliate URL stored in the Product Registry.
 */

import { getProductBySlug } from "@/lib/product-registry";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  const params = await props.params;
  const { slug } = params;

  // Look up product from the registry (single source of truth)
  const product = await getProductBySlug(slug);

  if (!product) {
    // Product not found - return 404 (GSC fix: avoid soft redirects for missing products)
    return new NextResponse("Product not found", { status: 404 });
  }

  // Redirect to Amazon affiliate URL
  return NextResponse.redirect(product.affiliateUrl, 307);
}
