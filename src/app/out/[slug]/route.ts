import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Affiliate Redirect Route
 *
 * This is the ONLY route in the entire application that contains
 * direct Amazon affiliate URLs. All product CTAs link to /out/{slug}
 * which redirects to the affiliate URL stored in the Product Registry.
 */
import { getProductById, getProductBySlug } from "@/lib/product-registry";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  const params = await props.params;
  const { slug } = params;

  // 1. Try ID-based match first (Matching logic from /p/ route)
  const idMatch = slug.match(/^(\d+)_-(.*)$/);
  let product;

  if (idMatch) {
    const id = parseInt(idMatch[1]);
    // Handle 200m/900m offsets
    const realId =
      id >= 900000000 ? id - 900000000 : id >= 200000000 ? id - 200000000 : id;
    product = await getProductById(realId);
  } else {
    // 2. Legacy fallback: Look up by raw slug
    product = await getProductBySlug(slug);
  }

  if (!product || !product.affiliateUrl) {
    // Product or affiliate URL not found - return 404 (GSC fix: avoid soft redirects for missing products)
    return new NextResponse("Product not found", { status: 404 });
  }

  // Redirect to Amazon affiliate URL
  return NextResponse.redirect(product.affiliateUrl, 307);
}
