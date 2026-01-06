import { ProductDetailView } from "@/components/product";
import {
  allCategories,
  getCategoryPath,
  type CategorySlug,
} from "@/lib/categories";
import {
  DEFAULT_COUNTRY,
  getAllCountries,
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
    slug: string;
  }>;
}

// Generate static params for all products
export async function generateStaticParams() {
  const products = getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const category = allCategories[product.category as CategorySlug];
  const price =
    product.prices[DEFAULT_COUNTRY] || Object.values(product.prices)[0];

  // Simple, compelling title focused on product
  const title = `${product.title} - Best Price & Deals | ${BRAND_DOMAIN}`;

  // Clear description: what it is + price + call to action
  let description = `${product.brand} ${product.title}`;

  if (price) {
    description += ` - Currently $${price.toFixed(2)}.`;
  }

  description +=
    ` Check current prices, specs, and find the best deal on this ${product.capacity}${product.capacityUnit} ${product.technology || ""} ${category?.name || "product"}.`.trim();

  const canonicalUrl = `https://${BRAND_DOMAIN}/p/${slug}`;

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
      locale: "en_US",
    }),
    keywords: [
      product.brand,
      product.title,
      `${product.capacity}${product.capacityUnit}`,
      product.technology,
      "price",
      "deal",
      "buy",
      category?.name,
    ].filter(Boolean) as string[],
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Try to get unified product data with multi-source offers
  let unifiedProduct = null;
  try {
    unifiedProduct = await dataAggregator.fetchProduct(
      product.asin,
      DEFAULT_COUNTRY,
    );
  } catch (error) {
    console.error("Error fetching unified product:", error);
    // Continue with just the static product data
  }

  return (
    <ProductDetailView
      product={product}
      countryCode={DEFAULT_COUNTRY}
      unifiedProduct={unifiedProduct}
    />
  );
}
