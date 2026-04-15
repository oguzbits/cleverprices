/**
 * Product Schema.org JSON-LD
 *
 * Generates structured data for products to enable rich snippets in Google.
 * Supports Product, AggregateOffer, and AggregateRating schemas.
 *
 * @see https://schema.org/Product
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */

import type { CountryCode } from "@/lib/countries";
import { getCountryByCode } from "@/lib/countries";
import type { Product } from "@/lib/product-definitions";
import { BRAND_DOMAIN, BRAND_NAME } from "@/lib/site-config";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { getProductCanonicalUrl } from "@/lib/utils/url";

interface ProductSchemaProps {
  product: Product;
  countryCode: CountryCode;
  rating?: number;
  reviewCount?: number;
  isHub?: boolean;
}

export function ProductSchema({
  product,
  countryCode,
  rating,
  reviewCount,
  isHub = false,
}: ProductSchemaProps) {
  const identity = getProductIdentity(product);
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
    name: isHub ? identity.modelTitle : identity.displayTitle,
    description:
      `${isHub ? identity.modelTitle : identity.displayTitle} - ${product.brand} ${product.category}.`.trim(),
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    manufacturer: {
      "@type": "Organization",
      name: product.manufacturer || product.brand,
    },
    sku: product.asin,
    mpn: product.mpn || product.asin,
    category: product.category,
  };

  // Add image if available
  if (product.image) {
    schema.image = product.image;
  }

  // Add offers
  if (currentPrice || allPrices.length > 0) {
    // Use a conditional block to choose between AggregateOffer and single Offer
    if (allPrices.length > 1 && lowestPrice && highestPrice) {
      // Add shipping and return policy (Required for Google Merchant Listings)
      const shippingRate = lowestPrice > 39 ? "0.00" : "4.99";

      const aggregateOffer: Record<string, unknown> = {
        "@type": "AggregateOffer",
        priceCurrency: currency,
        lowPrice: lowestPrice.toFixed(2),
        highPrice: highestPrice.toFixed(2),
        offerCount: allPrices.length,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url: getProductCanonicalUrl(product.id, product.slug),
        priceValidUntil: "2027-12-31",
        seller: {
          "@type": "Organization",
          name: "Amazon",
        },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: shippingRate,
            currency: currency,
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 1,
              unitCode: "DAY",
            },
            transitTime: {
              "@type": "ShippingDeliveryTime",
              minValue: 1,
              maxValue: 3,
              unitCode: "DAY",
            },
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "DE",
          },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "DE",
          returnPolicyCategory:
            "https://schema.org/MerchantReturnFiniteReturnPeriod",
          merchantReturnDays: 30,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/FreeReturn",
        },
      };

      // Add unit price if available
      if (pricePerUnit && product.capacityUnit) {
        aggregateOffer.priceSpecification = {
          "@type": "UnitPriceSpecification",
          price: pricePerUnit.toFixed(2),
          priceCurrency: currency,
          unitText: product.capacityUnit,
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitText: product.capacityUnit,
          },
        };
      }

      schema.offers = aggregateOffer;
    } else if (currentPrice) {
      // Standard shipping logic for single offers
      const shippingRate = currentPrice > 39 ? "0.00" : "4.99";

      // Single price - use Offer
      const offer: Record<string, unknown> = {
        "@type": "Offer",
        priceCurrency: currency,
        price: currentPrice.toFixed(2),
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url: getProductCanonicalUrl(product.id, product.slug),
        seller: {
          "@type": "Organization",
          name: "Amazon",
        },
        priceValidUntil: "2027-12-31",
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: shippingRate,
            currency: currency,
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 1,
              unitCode: "DAY",
            },
            transitTime: {
              "@type": "ShippingDeliveryTime",
              minValue: 1,
              maxValue: 3,
              unitCode: "DAY",
            },
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "DE",
          },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "DE",
          returnPolicyCategory:
            "https://schema.org/MerchantReturnFiniteReturnPeriod",
          merchantReturnDays: 30,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/FreeReturn",
        },
      };

      // Add unit price if available
      if (pricePerUnit && product.capacityUnit) {
        offer.priceSpecification = {
          "@type": "UnitPriceSpecification",
          price: pricePerUnit.toFixed(2),
          priceCurrency: currency,
          unitText: product.capacityUnit,
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitText: product.capacityUnit,
          },
        };
      }

      schema.offers = offer;
    } else if (lowestPrice !== null && highestPrice !== null) {
      // No current price but we have others - use AggregateOffer with available prices
      schema.offers = {
        "@type": "AggregateOffer",
        priceCurrency: currency,
        lowPrice: lowestPrice.toFixed(2),
        highPrice: highestPrice.toFixed(2),
        offerCount: allPrices.length,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url: getProductCanonicalUrl(product.id, product.slug),
        priceValidUntil: "2027-12-31",
      };
    }
  }

  // Add aggregate rating if available
  if (rating && reviewCount && reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.toFixed(1),
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  // If we have neither offers nor rating, don't output the schema to avoid Google errors
  if (!schema.offers && !schema.aggregateRating) {
    return null;
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
function OrganizationSchema() {
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
function WebSiteSchema() {
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
