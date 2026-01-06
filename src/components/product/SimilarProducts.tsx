/**
 * Similar Products Component
 *
 * Displays a grid of similar products for internal linking.
 * Shows products from the same category, sorted by price similarity.
 */

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/product-registry";
import type { CountryCode } from "@/lib/countries";
import { getCountryByCode } from "@/lib/countries";

interface SimilarProductsProps {
  products: Product[];
  countryCode: CountryCode;
  title?: string;
}

export function SimilarProducts({
  products,
  countryCode,
  title = "Similar Products",
}: SimilarProductsProps) {
  const countryConfig = getCountryByCode(countryCode);
  const currencySymbol = countryConfig?.symbol || "$";

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((product) => {
        const price = product.prices[countryCode];

        return (
          <Link
            key={product.slug}
            href={`/p/${product.slug}`}
            className="group no-underline"
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="p-3">
                {/* Product Image */}
                <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-1">
                  {/* Brand */}
                  <p className="text-muted-foreground text-xs">
                    {product.brand}
                  </p>

                  {/* Title - truncated, no underline on hover */}
                  <h3 className="line-clamp-2 text-sm font-medium no-underline">
                    {product.title}
                  </h3>

                  {/* Capacity Badge */}
                  <Badge variant="secondary" className="text-xs">
                    {product.capacity} {product.capacityUnit}
                  </Badge>

                  {/* Price */}
                  {price && (
                    <p className="text-base font-bold">
                      {currencySymbol}
                      {price.toFixed(2)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Compact version for sidebars
 */
interface SimilarProductsCompactProps {
  products: Product[];
  countryCode: CountryCode;
}

export function SimilarProductsCompact({
  products,
  countryCode,
}: SimilarProductsCompactProps) {
  const countryConfig = getCountryByCode(countryCode);
  const currencySymbol = countryConfig?.symbol || "$";

  if (products.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2">
      {products.map((product) => {
        const price = product.prices[countryCode];

        return (
          <li key={product.slug}>
            <Link
              href={`/p/${product.slug}`}
              className="hover:bg-muted flex items-center gap-3 rounded-md p-2 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                  />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.title}</p>
                {price && (
                  <p className="text-muted-foreground text-xs">
                    {currencySymbol}
                    {price.toFixed(2)}
                  </p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
