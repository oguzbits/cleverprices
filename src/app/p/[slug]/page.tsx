import { IdealoProductPage } from "@/components/product/IdealoProductPage";
import { allCategories, type CategorySlug } from "@/lib/categories";
import {
  DEFAULT_COUNTRY,
  getAllCountries,
  type CountryCode,
} from "@/lib/countries";
import { dataAggregator } from "@/lib/data-sources";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { getAllProducts, getProductBySlug } from "@/lib/product-registry";
import { BRAND_DOMAIN } from "@/lib/site-config";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all products (Germany only)
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (slug === "[slug]" || slug === "%5Bslug%5D") {
    return { title: BRAND_DOMAIN };
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }

  const countryCode = DEFAULT_COUNTRY;
  const countryConfig = getAllCountries().find((c) => c.code === countryCode);
  const category = allCategories[product.category as CategorySlug];
  const price = product.prices[countryCode] || Object.values(product.prices)[0];

  const title = `${product.title} - Best Price | ${BRAND_DOMAIN}`;
  const description = `Compare prices for ${product.title}. Current best price: ${countryConfig?.currency || "EUR"} ${price?.toFixed(2)}. Find the best deal on ${category?.name || product.category}.`;
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
      locale: "de_DE",
    }),
    keywords: [
      product.brand,
      product.title,
      "price comparison",
      "best deal",
      category?.name,
      "DE",
      "buy",
    ].filter(Boolean) as string[],
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const countryCode = DEFAULT_COUNTRY;

  // Handle static collection for the dynamic template route
  if (slug === "[slug]" || slug === "%5Bslug%5D") {
    return null;
  }

  const product = await getProductBySlug(slug);

  if (!product) {
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
  }

  return (
    <IdealoProductPage
      product={product}
      countryCode={countryCode}
      unifiedProduct={unifiedProduct}
    />
  );
}
