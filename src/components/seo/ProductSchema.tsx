/**
 * Product Schema.org JSON-LD
 *
 * Generates structured data for products to enable rich snippets in Google.
 * Supports Product, AggregateOffer, and AggregateRating schemas.
 *
 * @see https://schema.org/Product
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */

import type { Product } from "@/lib/product-registry";
import type { CountryCode } from "@/lib/countries";
import { getCountryByCode } from "@/lib/countries";
import { BRAND_DOMAIN, BRAND_NAME } from "@/lib/site-config";

interface ProductSchemaProps {
  product: Product;
  countryCode: CountryCode;
  rating?: number;
  reviewCount?: number;
}

export function ProductSchema({
  product,
  countryCode,
  rating,
  reviewCount,
}: ProductSchemaProps) {
  const countryConfig = getCountryByCode(countryCode);
  const currency = countryConfig?.currency || "USD";

  // Get price for current country
  const currentPrice = product.prices[countryCode];

  // Get all available prices for AggregateOffer
  const allPrices = Object.values(product.prices).filter(
    (p): p is number => p !== null && p !== undefined,
  );
  const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
  const highestPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;

  // Calculate price per unit if applicable
  const pricePerUnit =
    product.normalizedCapacity && currentPrice
      ? currentPrice / product.normalizedCapacity
      : undefined;

  // Build the schema object
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      `${product.title} - ${product.capacity} ${product.capacityUnit} ${product.technology || ""} ${product.formFactor || ""}`.trim(),
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    sku: product.asin,
    mpn: product.asin,
    category: product.category,
  };

  // Add image if available
  if (product.image) {
    schema.image = product.image;
  }

  // Add offers
  if (currentPrice) {
    if (allPrices.length > 1 && lowestPrice && highestPrice) {
      // Multiple prices available - use AggregateOffer
      schema.offers = {
        "@type": "AggregateOffer",
        priceCurrency: currency,
        lowPrice: lowestPrice.toFixed(2),
        highPrice: highestPrice.toFixed(2),
        offerCount: allPrices.length,
        availability: "https://schema.org/InStock",
        url: `https://${BRAND_DOMAIN}/p/${product.slug}`,
        seller: {
          "@type": "Organization",
          name: "Amazon",
        },
      };
    } else {
      // Single price - use Offer
      schema.offers = {
        "@type": "Offer",
        priceCurrency: currency,
        price: currentPrice.toFixed(2),
        availability: "https://schema.org/InStock",
        url: `https://${BRAND_DOMAIN}/p/${product.slug}`,
        seller: {
          "@type": "Organization",
          name: "Amazon",
        },
        priceValidUntil: "2027-12-31", // Static date - Cache Components don't allow Date.now()
      };
    }
  }

  // Add aggregate rating if available
  if (rating && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.toFixed(1),
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Add additional properties
  const additionalProperties: Array<{
    "@type": string;
    name: string;
    value: string | undefined;
  }> = [
    {
      "@type": "PropertyValue",
      name: "Capacity",
      value: `${product.capacity} ${product.capacityUnit}`,
    },
    {
      "@type": "PropertyValue",
      name: "Form Factor",
      value: product.formFactor,
    },
    {
      "@type": "PropertyValue",
      name: "Warranty",
      value: product.warranty,
    },
  ];

  if (product.technology) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Technology",
      value: product.technology,
    });
  }

  schema.additionalProperty = additionalProperties;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Breadcrumb Schema for product pages
 */
interface BreadcrumbSchemaProps {
  items: { name: string; href?: string }[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href ? `https://${BRAND_DOMAIN}${item.href}` : undefined,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Organization Schema for the website
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: `https://${BRAND_DOMAIN}`,
    logo: `https://${BRAND_DOMAIN}/icon.png`,
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * WebSite Schema with search action
 */
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: `https://${BRAND_DOMAIN}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://${BRAND_DOMAIN}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
