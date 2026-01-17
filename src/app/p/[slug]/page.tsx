import { IdealoProductPage } from "@/components/product/IdealoProductPage";
import { allCategories, type CategorySlug } from "@/lib/categories";
import { DEFAULT_COUNTRY, getAllCountries } from "@/lib/countries";
import { dataAggregator } from "@/lib/data-sources";
import { getAlternateLanguages, getOpenGraph } from "@/lib/metadata";
import { findProductSlugByAsinSuffix } from "@/lib/product-registry";
import {
  getAllProductSlugs,
  getProductBySlug,
  getSimilarProducts,
} from "@/lib/server/cached-products";
import { BRAND_DOMAIN } from "@/lib/site-config";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}
// Generate static params for all products (Germany only)
export async function generateStaticParams() {
  const products = await getAllProductSlugs();

  // Cache Components requires at least one result
  // If no products in DB yet, return a placeholder that will 404
  if (products.length === 0) {
    return [{ slug: "[slug]" }];
  }

  // Limit to top 100 products by updatedAt to keep deployment size manageable
  // Modern Next.js will generate the rest on-demand and cache them
  return products.slice(0, 100).map((product) => ({
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
    return { title: "Produkt nicht gefunden" };
  }

  const countryCode = DEFAULT_COUNTRY;
  const countryConfig = getAllCountries().find((c) => c.code === countryCode);
  const category = allCategories[product.category as CategorySlug];
  const price = product.prices[countryCode] || Object.values(product.prices)[0];

  // Calculate price per unit for SEO
  const pricePerUnit =
    product.normalizedCapacity && price
      ? (price / product.normalizedCapacity).toFixed(2)
      : null;
  const unitPriceText =
    pricePerUnit && category?.unitType
      ? ` - ${pricePerUnit}€ pro ${category.unitType}`
      : "";

  // German SEO-optimized title with low-competition keywords
  const title = `${product.title} günstig kaufen${unitPriceText}`;

  // German description with price and value proposition
  const description =
    pricePerUnit && category?.unitType
      ? `${product.title} Preisvergleich: Aktueller Preis ${price?.toFixed(2)}€, nur ${pricePerUnit}€ pro ${category.unitType}. Vergleichen Sie ${category?.name || product.category} und sparen Sie!`
      : `${product.title} Preisvergleich: Aktueller Preis ${countryConfig?.currency || "EUR"} ${price?.toFixed(2)}. Finden Sie das beste Angebot für ${category?.name || product.category}.`;

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
      "Preisvergleich",
      "günstig kaufen",
      `${category?.name} Preis`,
      category?.unitType ? `Preis pro ${category.unitType}` : null,
      "beste Angebot",
      "Deutschland",
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

  // 1. Fetch essential DB data (Lightning Fast)
  const product = await getProductBySlug(slug);

  if (!product) {
    const newSlug = await findProductSlugByAsinSuffix(slug);
    if (newSlug && newSlug !== slug) {
      redirect(`/p/${newSlug}`);
    }
    notFound();
  }

  // 2. Prepare slow live data as a Promise (Non-blocking)
  const isBuild =
    process.env.CI === "true" ||
    process.env.CI === "1" ||
    process.env.NEXT_PHASE === "phase-production-build";

  const unifiedProductPromise = !isBuild
    ? dataAggregator.fetchProduct(product.asin, countryCode).catch((error) => {
        console.error("Error fetching unified product:", error);
        return null;
      })
    : Promise.resolve(null);

  // 3. Fetch similar products (Cached/Fast)
  const similarProducts = await getSimilarProducts(product, 12, countryCode);

  // Strip heavy data for cleaner RSC payload
  const liteSimilarProducts = similarProducts.map((p) => ({
    ...p,
    specifications: {},
    features: [],
    priceHistory: [],
  }));

  // 4. Render immediately!
  return (
    <IdealoProductPage
      product={product}
      countryCode={countryCode}
      unifiedProductPromise={unifiedProductPromise}
      similarProducts={liteSimilarProducts}
    />
  );
}
