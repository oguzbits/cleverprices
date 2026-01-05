import { ProductDetailView } from "@/components/product";
import {
  allCategories,
  getCategoryPath,
  type CategorySlug,
} from "@/lib/categories";
import {
  DEFAULT_COUNTRY,
  getAllCountries,
  isValidCountryCode,
  type CountryCode,
} from "@/lib/countries";
import { dataAggregator } from "@/lib/data-sources";
import {
  generateKeywords,
  getAlternateLanguages,
  getOpenGraph,
} from "@/lib/metadata";
import {
  getAllProducts,
  getProductBySlug,
  type Product,
} from "@/lib/product-registry";
import { BRAND_DOMAIN } from "@/lib/site-config";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    country: string;
    slug: string;
  }>;
}

// Generate static params for all products × countries
export async function generateStaticParams() {
  const products = getAllProducts();
  const countries = getAllCountries().filter((c) => c.isLive);

  const params: { country: string; slug: string }[] = [];

  for (const country of countries) {
    // Skip US as it uses the (root) route
    if (country.code === DEFAULT_COUNTRY) continue;

    for (const product of products) {
      params.push({
        country: country.code,
        slug: product.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;

  if (!isValidCountryCode(country)) {
    return { title: "Product Not Found" };
  }

  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }

  const countryCode = country.toLowerCase() as CountryCode;
  const countryConfig = getAllCountries().find((c) => c.code === countryCode);
  const category = allCategories[product.category as CategorySlug];
  const price = product.prices[countryCode] || Object.values(product.prices)[0];

  const title = `${product.title} - Compare Prices ${countryCode.toUpperCase()} | ${BRAND_DOMAIN}`;
  const description = `Compare prices for ${product.title} on Amazon ${countryCode.toUpperCase()}, eBay, and more. Current best price: ${countryConfig?.currency || "USD"} ${price?.toFixed(2)}. Find the best deal on ${category?.name || product.category}.`;
  const canonicalUrl = `https://${BRAND_DOMAIN}/${countryCode}/p/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguages(`/p/${slug}`),
    },
    openGraph: getOpenGraph({
      title,
      description,
      url: canonicalUrl,
      locale: countryConfig?.locale.replace("-", "_") || "en_US",
    }),
    keywords: [
      product.brand,
      product.title,
      "price comparison",
      "best deal",
      category?.name,
      countryCode.toUpperCase(),
      "buy",
    ].filter(Boolean) as string[],
  };
}

export default async function CountryProductPage({ params }: Props) {
  const { country, slug } = await params;

  // Validate country
  if (!isValidCountryCode(country)) {
    notFound();
  }

  const countryCode = country.toLowerCase() as CountryCode;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Check if this product has pricing for this country
  const price = product.prices[countryCode];
  if (!price || price === 0) {
    // Product not available in this country - could redirect or show message
    notFound();
  }

  // Try to get unified product data with multi-source offers
  let unifiedProduct = null;
  try {
    unifiedProduct = await dataAggregator.fetchProduct(
      product.asin,
      countryCode,
    );
  } catch (error) {
    console.error("Error fetching unified product:", error);
    // Continue with just the static product data
  }

  return (
    <ProductDetailView
      product={product}
      countryCode={countryCode}
      unifiedProduct={unifiedProduct}
    />
  );
}
