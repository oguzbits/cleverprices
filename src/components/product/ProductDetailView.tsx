/**
 * Product Detail View
 *
 * Main component for individual product pages.
 * Shows multi-source price comparison, price history, and specifications.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAffiliateRedirectPath } from "@/lib/affiliate-utils";
import {
  getBreadcrumbs,
  getCategoryBySlug,
  getCategoryPath,
  type CategorySlug,
} from "@/lib/categories";
import { getCountryByCode, type CountryCode } from "@/lib/countries";
import type {
  UnifiedProduct,
  ProductOffer,
  PriceAnalysis,
} from "@/lib/data-sources";
import { Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ExternalLink,
  Star,
  TrendingDown,
  TrendingUp,
  Minus,
  ShieldCheck,
  Truck,
  Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { OfferComparisonTable } from "./OfferComparisonTable";
import { PriceAnalysisBadge } from "./PriceAnalysisBadge";
import { SpecificationsTable } from "./SpecificationsTable";

interface ProductDetailViewProps {
  product: Product;
  countryCode: CountryCode;
  unifiedProduct?: UnifiedProduct | null;
}

export function ProductDetailView({
  product,
  countryCode,
  unifiedProduct,
}: ProductDetailViewProps) {
  const countryConfig = getCountryByCode(countryCode);
  const category = getCategoryBySlug(product.category);

  // Get price for current country
  const price =
    product.prices[countryCode] || Object.values(product.prices)[0] || 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(countryConfig?.locale || "en-US", {
      style: "currency",
      currency: countryConfig?.currency || "USD",
    }).format(value);
  };

  // Build breadcrumbs
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    ...(category
      ? [
          {
            name: category.name,
            href: getCategoryPath(
              product.category as CategorySlug,
              countryCode,
            ),
          },
        ]
      : []),
    { name: product.title.split(" ").slice(0, 4).join(" ") },
  ];

  // Calculate price per unit
  const pricePerUnit =
    product.pricePerUnit || price / product.normalizedCapacity!;
  const unitLabel = product.capacityUnit === "W" ? "W" : product.capacityUnit;

  // Get offers from unified product or create mock from current data
  // Note: lastUpdated is omitted for static data to avoid build issues
  const offers: ProductOffer[] = unifiedProduct?.offers || [
    {
      source: "amazon" as const,
      price,
      currency: countryConfig?.currency || "USD",
      displayPrice: formatCurrency(price),
      affiliateLink: getAffiliateRedirectPath(product.slug),
      condition: product.condition.toLowerCase() as "new" | "renewed" | "used",
      availability: "unknown" as const,
      freeShipping: true,
      seller: "Amazon",
      country: countryCode,
    },
  ];

  // Price analysis from unified product
  const priceAnalysis = unifiedProduct?.priceAnalysis;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Main Product Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Product Image */}
        <div className="relative">
          <div className="bg-muted/20 dark:bg-muted/10 sticky top-24 aspect-square overflow-hidden rounded-2xl border p-8">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-contain p-4"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-muted-foreground text-lg">
                  No image available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="space-y-6">
          {/* Title & Rating */}
          <div>
            <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-3xl">
              {product.title}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-muted-foreground text-sm">
                Brand: {product.brand}
              </span>
              {unifiedProduct?.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium">
                    {unifiedProduct.rating.toFixed(1)}
                  </span>
                  {unifiedProduct.reviewCount && (
                    <span className="text-muted-foreground text-sm">
                      ({unifiedProduct.reviewCount.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Price Analysis Badge */}
          {priceAnalysis && <PriceAnalysisBadge analysis={priceAnalysis} />}

          {/* Best Price Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                    Best Price
                  </p>
                  <p className="text-foreground mt-1 text-4xl font-bold">
                    {formatCurrency(offers[0]?.price || price)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatCurrency(pricePerUnit)} per {unitLabel}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-sm",
                      product.condition === "New" &&
                        "bg-emerald-100/50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
                      product.condition === "Renewed" &&
                        "bg-secondary text-secondary-foreground",
                      product.condition === "Used" &&
                        "bg-amber-100/50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
                    )}
                  >
                    {product.condition}
                  </Badge>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 space-y-3">
                <a
                  href={getAffiliateRedirectPath(product.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#FCD200]/50 bg-[#FFD814] py-3 text-lg font-bold text-black shadow-sm transition-all hover:bg-[#F7CA00] active:scale-[0.99]">
                    View on Amazon
                    <ExternalLink className="h-5 w-5" />
                  </button>
                </a>

                {/* Quick Info */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Truck className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Free shipping</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <ShieldCheck className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">
                      {product.warranty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">In Stock</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Specifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                Key Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">
                    {product.capacity} {product.capacityUnit}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Form Factor</span>
                  <span className="font-medium">{product.formFactor}</span>
                </div>
                {product.technology && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Technology</span>
                    <span className="font-medium">{product.technology}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Warranty</span>
                  <span className="font-medium">{product.warranty}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Price History Section - Placeholder */}
      {priceAnalysis && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">Price History (90 Days)</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Price history chart will be displayed here when Keepa API is
                    connected.
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Average: {formatCurrency(priceAnalysis.averagePrice)} •
                    Lowest: {formatCurrency(priceAnalysis.lowestPrice)} •
                    Highest: {formatCurrency(priceAnalysis.highestPrice)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Price Comparison Section */}
      <section className="mt-12">
        <h2 className="mb-6 text-xl font-bold">
          Compare Prices ({offers.length}{" "}
          {offers.length === 1 ? "offer" : "offers"})
        </h2>
        <OfferComparisonTable offers={offers} formatCurrency={formatCurrency} />
      </section>

      {/* Full Specifications */}
      <section className="mt-12">
        <h2 className="mb-6 text-xl font-bold">Full Specifications</h2>
        <SpecificationsTable product={product} />
      </section>

      {/* Similar Products - Placeholder */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Similar Products</h2>
          <Link
            href={getCategoryPath(
              product.category as CategorySlug,
              countryCode,
            )}
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6">
          <p className="text-muted-foreground text-sm">
            Similar products carousel will be displayed here.
          </p>
        </div>
      </section>
    </div>
  );
}
